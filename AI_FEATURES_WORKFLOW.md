# SkillSync AI Features - Comprehensive Technical Documentation

## AI Feature Workflow: From Frontend to Backend

This document provides a detailed technical explanation of how AI features work in SkillSync, tracing the complete execution path from user interaction to response display.

---

## Table of Contents

1. [Overview of AI Feature Architecture](#overview-of-ai-feature-architecture)
2. [Generate Summary Workflow](#generate-summary-workflow)
3. [Generate Quiz Workflow](#generate-quiz-workflow) 
4. [Generate Notes Workflow](#generate-notes-workflow)
5. [AI Provider System](#ai-provider-system)
6. [Transcript Processing Pipeline](#transcript-processing-pipeline)
7. [AI Content Caching & Performance](#ai-content-caching--performance)

---

## Overview of AI Feature Architecture

SkillSync's AI features are implemented through a complete frontend-to-backend workflow that includes:

```
User Interaction → Frontend Component → API Client → Backend Route → AI Controller → AI Helper → External AI API → Database Storage → UI Update
```

### Key Components

1. **Frontend Components**: React components that handle user interactions
2. **Custom Hooks**: React hooks (`useAIContent`) that manage API calls and state
3. **API Client**: Axios-based client that communicates with backend endpoints
4. **Backend Routes**: Express routes that handle AI feature requests
5. **AI Controller**: Server-side logic for managing AI operations
6. **AI Helper**: Utility class that interacts with external AI services
7. **Database Models**: MongoDB schemas for storing AI-generated content

### Supported AI Features

- **Video Summaries**: AI-generated summaries with key points and timestamps
- **Interactive Quizzes**: Multiple-choice questions with explanations
- **Structured Notes**: Formatted notes with sections and timestamps
- **AI Tutor**: Interactive question-answering about video content

---

## Generate Summary Workflow

### 1. User Interaction (Frontend)

When a user clicks the "Generate Summary" button in the video player page:

```tsx
// File: client/src/components/ai-content/AIContentTabs.tsx (18 lines)
const SummaryTab = ({ videoId }: { videoId: string }) => {
  const { generateSummary, isGenerating, error } = useAIContent(videoId);
  
  const handleGenerateSummary = () => {
    // User clicks this button
    generateSummary('gemini'); // Default provider
  };
  
  return (
    <div>
      {!video?.summary ? (
        <Button 
          onClick={handleGenerateSummary} 
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate Summary'}
        </Button>
      ) : (
        <div className="markdown-content">
          <MarkdownRenderer content={video.summary.content} />
        </div>
      )}
    </div>
  );
};
```

### 2. Custom Hook Processing (Frontend)

The `useAIContent` hook manages API interaction and state:

```tsx
// File: client/src/hooks/useAIContent.ts (35 lines)
export const useAIContent = (videoId: string) => {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // TanStack Query Mutation for API interaction
  const summaryMutation = useMutation({
    mutationFn: async (provider?: string) => {
      setIsGenerating(true);
      return aiAPI.generateSummary(videoId, provider);
    },
    onSuccess: (data) => {
      // Update cache with new summary data
      queryClient.setQueryData(['video', videoId], (old: any) => ({
        ...old,
        data: {
          ...old.data,
          video: {
            ...old.data.video,
            summary: data.data.summary
          }
        }
      }));
      setIsGenerating(false);
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to generate summary');
      setIsGenerating(false);
    }
  });
  
  const generateSummary = (provider?: string) => {
    summaryMutation.mutate(provider);
  };
  
  return {
    generateSummary,
    isGenerating,
    error
  };
};
```

### 3. API Client Call (Frontend)

The API client makes the actual HTTP request to the backend:

```typescript
// File: client/src/lib/api.ts (23 lines)
export const aiAPI = {
  generateSummary: (videoId: string, provider?: string) =>
    api.post<{ summary: Video['summary']; cached?: boolean }>(
      `/ai/summary/${videoId}`,
      { provider }
    ),
  // Other AI endpoints...
};

// Base API configuration
const api = axios.create({
  baseURL: API_BASE_URL, // http://localhost:5000/api
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 4. Backend Route Handling

The request is received by the Express route:

```javascript
// File: server/routes/ai.js (6 lines)
router.post('/summary/:videoId',
  aiLimiter,                // Rate limiting middleware (20 requests per hour)
  summaryValidation,        // Validate video ID and provider
  handleValidationErrors,   // Handle validation errors
  aiController.generateSummary  // Controller function
);
```

### 5. AI Controller Processing

The controller function manages the summary generation process:

```javascript
// File: server/controllers/ai/aiController.js (46 lines)
const generateSummary = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { provider = 'gemini' } = req.body || {};
    const userId = req.user._id;

    // 1. Fetch video and verify ownership
    const video = await Video.findById(videoId).populate('playlistId');
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    // 2. Check user has access to this playlist/video
    if (!video.playlistId.userId.equals(userId)) {
      return res.status(403).json({ 
        error: 'Access denied - not your playlist'
      });
    }
    
    // 3. Check if summary already exists (caching)
    if (video.summary && video.summary.content) {
      return res.status(200).json({
        message: 'Summary already exists',
        summary: video.summary,
        cached: true
      });
    }
    
    // 4. Fetch transcript for better summary generation
    const transcript = await youtubeAPI.getVideoTranscript(video.ytVideoId);
    
    // 5. Prepare data for AI processing
    const videoData = {
      title: video.title,
      description: video.description,
      transcript: transcript.text || '',
      transcriptSegments: transcript.segments || [],
      videoDuration: video.duration || 0
    };
    
    // 6. Generate summary using AI helper
    const summaryResult = await aiHelper.generateSummary(videoData, provider);
    
    // 7. Save summary to database
    await video.generateSummary(
      summaryResult.content,
      summaryResult.timestamps,
      provider
    );
    
    // 8. Return response
    res.status(200).json({
      message: 'Summary generated successfully',
      summary: video.summary
    });

  } catch (error) {
    console.error('AI summary generation error:', error);
    res.status(500).json({
      error: 'Failed to generate summary',
      message: error.message
    });
  }
};
```

### 6. AI Helper Processing

The AI Helper utility class handles the interaction with AI providers:

```javascript
// File: server/utils/aiHelper.js (68 lines)
class AIHelper {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.defaultProvider = 'gemini';
  }

  async generateSummary(videoData, provider = this.defaultProvider) {
    try {
      const { title, description, transcript, transcriptSegments, videoDuration } = videoData;
      
      // 1. Build prompt based on video data
      const prompt = this.buildSummaryPrompt(title, description, transcript);
      
      // 2. Select and call appropriate AI provider
      let response;
      switch (provider.toLowerCase()) {
        case 'gemini':
          response = await this.callGeminiAPI(prompt, 'summary');
          break;
        case 'openai':
          response = await this.callOpenAIAPI(prompt, 'summary');
          break;
        default:
          throw new Error(`Unsupported AI provider: ${provider}`);
      }

      // 3. Parse and structure the AI response
      const summaryContent = this.parseSummaryContent(response);
      
      // 4. Generate real timestamps from transcript segments
      const realTimestamps = this.generateRealTimestamps(
        transcriptSegments, 
        summaryContent, 
        videoDuration
      );
      
      // 5. Return structured summary data
      return {
        content: summaryContent,
        timestamps: realTimestamps
      };
    } catch (error) {
      console.error('AI summary generation error:', error);
      throw new Error(`Failed to generate summary: ${error.message}`);
    }
  }
  
  // Helper method for building the prompt
  buildSummaryPrompt(title, description, transcript) {
    return `
      Please create a comprehensive summary of this educational video:
      
      Title: ${title}
      Description: ${description}
      
      Transcript: ${transcript}
      
      Please provide:
      1. A concise overview (2-3 sentences)
      2. Key learning points (5-7 bullet points)
      3. Main topics covered
      4. Important concepts explained
      
      Format the response as structured text with clear sections.
    `;
  }
  
  // Gemini API integration
  async callGeminiAPI(prompt, type) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
            topP: 0.8,
            topK: 40
          }
        }
      );
      
      if (!response.data.candidates || !response.data.candidates[0]) {
        throw new Error('Invalid response from Gemini API');
      }
      
      return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }
  
  // Timestamp extraction from transcript segments
  generateRealTimestamps(segments, summaryContent, videoDuration) {
    // Implementation for extracting meaningful timestamps
    // based on transcript segments and summary content
    const timestamps = [];
    
    // Logic to identify key points in the summary and match
    // them with appropriate timestamps from the transcript
    
    return timestamps;
  }
}
```

### 7. Database Storage

The generated summary is stored in the Video model:

```javascript
// models/Video.js - Database Model
videoSchema.methods.generateSummary = async function(content, timestamps, provider) {
  this.summary = {
    content,
    keyPoints: this.extractKeyPoints(content),
    timestamps: timestamps || [],
    provider,
    generatedAt: new Date()
  };
  await this.save();
};

videoSchema.methods.extractKeyPoints = function(content) {
  // Extract bullet points or key sentences from summary
  const points = content.match(/[•\-\*]\s*(.+)/g) || [];
  return points.map(point => point.replace(/[•\-\*]\s*/, '').trim());
};
```

### 8. Frontend Update

After the API response, the UI is updated:

```tsx
// File: client/src/components/ai-content/AIContentDisplay.tsx (2 lines)
// The queryClient.setQueryData in the useAIContent hook
// updates the React Query cache, which triggers a re-render
// of the component with the new summary content

const SummaryView = ({ summary }: { summary: Video['summary'] }) => {
  return (
    <div className="summary-container">
      <h3 className="text-xl font-semibold mb-4">Video Summary</h3>
      
      <div className="markdown-content">
        <MarkdownRenderer content={summary.content} />
      </div>
      
      {summary.keyPoints?.length > 0 && (
        <div className="key-points mt-4">
          <h4 className="text-lg font-medium mb-2">Key Points</h4>
          <ul className="list-disc pl-5 space-y-1">
            {summary.keyPoints.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </div>
      )}
      
      {summary.timestamps?.length > 0 && (
        <div className="timestamps mt-4">
          <h4 className="text-lg font-medium mb-2">Key Moments</h4>
          <div className="space-y-2">
            {summary.timestamps.map((ts, i) => (
              <div 
                key={i}
                className="timestamp-item cursor-pointer hover:bg-muted p-2 rounded"
                onClick={() => onSeekToTimestamp(ts.seconds)}
              >
                <span className="font-mono text-sm text-primary">{ts.time}</span>
                <span className="ml-2">{ts.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="text-xs text-muted-foreground mt-4">
        Generated using {summary.provider} on {formatDate(summary.generatedAt)}
      </div>
    </div>
  );
};
```

---

## Generate Quiz Workflow

### 1. User Interaction (Frontend)

Similar to the summary workflow, the quiz generation begins with a button click:

```tsx
// File: client/src/components/ai-content/QuizInterface.tsx (15 lines)
const QuizInterface = ({ videoId }: { videoId: string }) => {
  const { generateQuiz, isGenerating, error } = useQuizInteraction(videoId);
  
  const handleGenerateQuiz = () => {
    // User clicks this button
    generateQuiz({ 
      provider: 'gemini',
      questionCount: 5
    });
  };
  
  return (
    <div className="quiz-container">
      {!video?.quiz ? (
        <div className="quiz-generation">
          <Button 
            onClick={handleGenerateQuiz} 
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Quiz'}
          </Button>
        </div>
      ) : (
        <QuizDisplay quiz={video.quiz} />
      )}
    </div>
  );
};
```

### 2. API Endpoint Call Chain

The API call flow follows the same pattern as the summary workflow:

```typescript
// File: client/src/hooks/useQuizInteraction.ts (20 lines)
const generateQuiz = (options?: { provider?: string; questionCount?: number }) => {
  quizMutation.mutate(options);
};

// File: client/src/lib/api.ts (23 lines)
export const aiAPI = {
  generateQuiz: (videoId: string, options?: { 
    provider?: string;
    questionCount?: number;
  }) =>
    api.post<{ quiz: Video['quiz']; cached?: boolean }>(
      `/ai/quiz/${videoId}`, 
      options || {}
    ),
};
```

### 3. Backend Quiz Generation

The quiz generation controller has additional logic for generating questions:

```javascript
// File: server/controllers/ai/aiController.js (45 lines)
const generateQuiz = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { provider = 'gemini', questionCount = 5 } = req.body || {};
    const userId = req.user._id;

    // Fetch video and verify ownership (same as summary workflow)
    const video = await Video.findById(videoId).populate('playlistId');
    // ...ownership checks...
    
    // Check if quiz already exists with the same question count
    if (video.quiz && video.quiz.questions && 
        video.quiz.questions.length === questionCount) {
      return res.status(200).json({
        message: 'Quiz already exists with same question count',
        quiz: video.quiz,
        cached: true
      });
    }

    // Generate quiz based on video summary or description
    let summaryContent = video.summary?.content;
    
    // If no summary exists, generate one first
    if (!summaryContent) {
      const transcript = await youtubeAPI.getVideoTranscript(video.ytVideoId);
      const videoData = {
        title: video.title,
        description: video.description,
        transcript: transcript.text || '',
        videoDuration: video.duration || 0
      };
      
      // Generate a brief summary first for better quiz questions
      const summaryResult = await aiHelper.generateSummary(videoData, provider);
      summaryContent = summaryResult.content;
      
      // Optionally save this summary
      if (!video.summary) {
        await video.generateSummary(
          summaryContent,
          summaryResult.timestamps || [],
          provider
        );
      }
    }
    
    // Generate quiz questions using AI
    const questions = await aiHelper.generateQuiz(
      summaryContent, 
      provider, 
      questionCount
    );
    
    // Validate quiz structure
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      throw new Error('Failed to generate valid quiz questions');
    }
    
    // Save quiz to video document
    video.quiz = {
      questions,
      provider,
      generatedAt: new Date()
    };
    
    await video.save();
    
    res.status(200).json({
      message: 'Quiz generated successfully',
      quiz: video.quiz
    });
    
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({
      error: 'Failed to generate quiz',
      message: error.message
    });
  }
};
```

### 4. AI Helper Quiz Generation

The AI Helper has specialized logic for quiz creation:

```javascript
// File: server/utils/aiHelper.js (50 lines)
async generateQuiz(summary, provider = this.defaultProvider, questionCount = 5) {
  try {
    const prompt = this.buildQuizPrompt(summary, questionCount);
    
    let response;
    switch (provider.toLowerCase()) {
      case 'gemini':
        response = await this.callGeminiAPI(prompt, 'quiz');
        break;
      case 'openai':
        response = await this.callOpenAIAPI(prompt, 'quiz');
        break;
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }

    return this.parseQuizResponse(response);
  } catch (error) {
    console.error('AI quiz generation error:', error);
    throw new Error(`Failed to generate quiz: ${error.message}`);
  }
}

buildQuizPrompt(summary, questionCount) {
  return `
    Based on the following educational content, generate ${questionCount} multiple-choice quiz questions.
    
    Content: ${summary}
    
    For each question:
    1. Write a clear question
    2. Provide exactly 4 options (A, B, C, D)
    3. Indicate the correct answer (0-indexed number, where 0=A, 1=B, etc.)
    4. Provide a brief explanation for the correct answer
    
    Format the response as a JSON array of question objects with the following structure:
    [
      {
        "question": "Question text here?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0,
        "explanation": "Explanation for why Option A is correct"
      },
      ...more questions...
    ]
    
    Ensure questions test understanding rather than just recall. Include a mix of difficulty levels.
  `;
}

parseQuizResponse(response) {
  try {
    // Find JSON array in the response
    const jsonMatch = response.match(/\[\s*\{.*\}\s*\]/s);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }
    
    const questions = JSON.parse(jsonMatch[0]);
    
    // Validate each question has required fields
    return questions.map((q, index) => {
      if (!q.question || !Array.isArray(q.options) || 
          q.options.length !== 4 || typeof q.correctAnswer !== 'number') {
        throw new Error(`Invalid question format at index ${index}`);
      }
      
      return {
        question: q.question.trim(),
        options: q.options.map(opt => opt.trim()),
        correctAnswer: q.correctAnswer,
        explanation: q.explanation?.trim() || ''
      };
    });
  } catch (error) {
    console.error('Quiz parsing error:', error);
    throw new Error(`Failed to parse quiz: ${error.message}`);
  }
}
```

### 5. Quiz Display and Interaction

The frontend handles quiz display and user interaction:

```tsx
// File: client/src/components/ai-content/QuizDisplay.tsx (72 lines)
const QuizDisplay = ({ quiz }: { quiz: Video['quiz'] }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  
  const handleSelectAnswer = (index: number) => {
    if (isAnswered) return;
    
    setSelectedAnswer(index);
    setIsAnswered(true);
    
    const isCorrect = index === quiz.questions[currentQuestion].correctAnswer;
    if (isCorrect) {
      setScore(prev => ({ ...prev, correct: prev.correct + 1 }));
    }
    setScore(prev => ({ ...prev, total: prev.total + 1 }));
  };
  
  const handleNextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    }
  };
  
  // Quiz display component
  return (
    <div className="quiz-display">
      <div className="progress">
        Question {currentQuestion + 1} of {quiz.questions.length}
      </div>
      
      {/* Current question */}
      <div className="question-container">
        <h3 className="question-text">
          {quiz.questions[currentQuestion].question}
        </h3>
        
        {/* Answer options */}
        <div className="options-container">
          {quiz.questions[currentQuestion].options.map((option, index) => (
            <button
              key={index}
              className={`option-button ${
                isAnswered
                  ? index === quiz.questions[currentQuestion].correctAnswer
                    ? 'correct'
                    : index === selectedAnswer
                    ? 'incorrect'
                    : ''
                  : ''
              }`}
              onClick={() => handleSelectAnswer(index)}
              disabled={isAnswered}
            >
              {['A', 'B', 'C', 'D'][index]}. {option}
            </button>
          ))}
        </div>
        
        {/* Explanation */}
        {isAnswered && (
          <div className="explanation">
            <h4>Explanation:</h4>
            <p>{quiz.questions[currentQuestion].explanation}</p>
          </div>
        )}
        
        {/* Navigation */}
        <div className="navigation">
          {isAnswered && (
            <Button onClick={handleNextQuestion} disabled={currentQuestion === quiz.questions.length - 1}>
              Next Question
            </Button>
          )}
        </div>
      </div>
      
      {/* Score display */}
      {score.total > 0 && (
        <div className="score-container">
          Score: {score.correct}/{score.total} ({Math.round((score.correct / score.total) * 100)}%)
        </div>
      )}
    </div>
  );
};
```

---

## Generate Notes Workflow

### 1. User Interaction (Frontend)

Notes generation follows a similar pattern but with format options:

```tsx
// File: client/src/components/ai-content/AIContentTabs.tsx (20 lines)
const NotesTab = ({ videoId }: { videoId: string }) => {
  const { generateNotes, isGenerating, error } = useAIContent(videoId);
  const [format, setFormat] = useState<'bullet' | 'outline' | 'detailed'>('outline');
  
  const handleGenerateNotes = () => {
    generateNotes({ 
      format,
      provider: 'gemini'
    });
  };
  
  return (
    <div className="notes-container">
      {!video?.aiNotes ? (
        <div className="notes-generation">
          <div className="format-selector mb-4">
            <label>Notes Format:</label>
            <Select 
              value={format}
              onValueChange={(value) => setFormat(value as any)}
            >
              <SelectItem value="bullet">Bullet Points</SelectItem>
              <SelectItem value="outline">Outline</SelectItem>
              <SelectItem value="detailed">Detailed Notes</SelectItem>
            </Select>
          </div>
          
          <Button 
            onClick={handleGenerateNotes} 
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Notes'}
          </Button>
        </div>
      ) : (
        <NotesDisplay notes={video.aiNotes} />
      )}
    </div>
  );
};
```

### 2. Backend Notes Generation

The notes generation workflow includes specialized formatting:

```javascript
// File: server/controllers/ai/aiController.js (40 lines)
const generateNotes = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { provider = 'gemini', format = 'outline' } = req.body || {};
    const userId = req.user._id;

    // Fetch video and validation (similar to summary workflow)
    // ...

    // Check if notes already exist with the same format
    if (video.aiNotes && video.aiNotes.format === format) {
      return res.status(200).json({
        message: 'Notes already exist with the same format',
        notes: video.aiNotes,
        cached: true
      });
    }

    // Fetch transcript and prepare video data
    const transcript = await youtubeAPI.getVideoTranscript(video.ytVideoId);
    
    const videoData = {
      title: video.title,
      description: video.description,
      transcript: transcript.text || '',
      transcriptSegments: transcript.segments || [],
      videoDuration: video.duration || 0,
      summary: video.summary?.content || '' // Use existing summary if available
    };
    
    // Generate notes with specified format
    const notesResult = await aiHelper.generateNotes(videoData, provider, format);
    
    // Save to database
    video.aiNotes = {
      content: notesResult.content,
      format,
      sections: notesResult.sections || [],
      provider,
      generatedAt: new Date()
    };
    
    await video.save();
    
    res.status(200).json({
      message: 'Notes generated successfully',
      notes: video.aiNotes
    });
    
  } catch (error) {
    console.error('Notes generation error:', error);
    res.status(500).json({
      error: 'Failed to generate notes',
      message: error.message
    });
  }
};
```

### 3. AI Helper Notes Processing

The AI Helper formats notes based on the requested style:

```javascript
// File: server/utils/aiHelper.js (90 lines)
async generateNotes(videoData, provider = this.defaultProvider, format = 'outline') {
  try {
    const { title, description, transcript, transcriptSegments, summary } = videoData;
    
    // Build appropriate prompt based on requested format
    const prompt = this.buildNotesPrompt(
      title, 
      description, 
      transcript, 
      format,
      summary
    );
    
    // Call appropriate AI provider
    let response;
    switch (provider.toLowerCase()) {
      case 'gemini':
        response = await this.callGeminiAPI(prompt, 'notes');
        break;
      case 'openai':
        response = await this.callOpenAIAPI(prompt, 'notes');
        break;
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
    
    // Parse and structure notes based on format
    const { content, sections } = this.parseNotesResponse(
      response, 
      format,
      transcriptSegments
    );
    
    return {
      content,
      sections,
      format
    };
  } catch (error) {
    console.error('AI notes generation error:', error);
    throw new Error(`Failed to generate notes: ${error.message}`);
  }
}

buildNotesPrompt(title, description, transcript, format, summary) {
  let formatInstructions;
  
  switch (format) {
    case 'bullet':
      formatInstructions = `
        Create concise bullet-point notes.
        Use • symbols for main points.
        Use indented - symbols for sub-points.
        Keep points brief and focused.
      `;
      break;
    case 'outline':
      formatInstructions = `
        Create a structured outline with sections.
        Use ## for section headings.
        Use bullet points under each section.
        Include timestamps where relevant.
      `;
      break;
    case 'detailed':
      formatInstructions = `
        Create comprehensive notes with:
        1. An introduction summarizing key concepts
        2. Detailed sections with headers (## format)
        3. Complete explanations of concepts
        4. Examples where applicable
        5. Conclusion or summary
      `;
      break;
    default:
      formatInstructions = `
        Create structured notes with clear sections.
      `;
  }
  
  let basePrompt = `
    Create educational notes for this video:
    
    Title: ${title}
    Description: ${description}
    
    ${summary ? `Summary: ${summary}\n\n` : ''}
    
    Transcript: ${transcript}
    
    ${formatInstructions}
    
    Structure the notes in markdown format.
  `;
  
  return basePrompt;
}

parseNotesResponse(response, format, transcriptSegments) {
  // Process the AI response into structured notes
  const content = response.trim();
  
  // Extract sections based on markdown headers
  const sectionRegex = /##\s+(.*?)(?=\n##|$)/gs;
  const sections = [];
  let match;
  
  while ((match = sectionRegex.exec(content)) !== null) {
    const title = match[1].trim();
    const fullSection = match[0];
    
    // Extract potential timestamp hints
    const timestampHint = fullSection.match(/\[(\d+:\d+)\]|\((\d+:\d+)\)/);
    let timestamp = null;
    
    if (timestampHint) {
      const timeStr = timestampHint[1] || timestampHint[2];
      timestamp = this.convertTimeToSeconds(timeStr);
    } else {
      // Try to match section topic with transcript segments
      timestamp = this.findTimestampForTopic(title, transcriptSegments);
    }
    
    sections.push({
      title,
      content: fullSection,
      timestamp
    });
  }
  
  return {
    content,
    sections
  };
}

findTimestampForTopic(topic, transcriptSegments) {
  // Find the most relevant timestamp for a topic
  // using text similarity with transcript segments
  
  if (!transcriptSegments || transcriptSegments.length === 0) {
    return null;
  }
  
  // Simple implementation - could be enhanced with NLP techniques
  const topicWords = topic.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  
  let bestMatch = {
    score: 0,
    timestamp: 0
  };
  
  transcriptSegments.forEach(segment => {
    const text = segment.text.toLowerCase();
    let score = 0;
    
    topicWords.forEach(word => {
      if (text.includes(word)) {
        score += 1;
      }
    });
    
    if (score > bestMatch.score) {
      bestMatch = {
        score,
        timestamp: segment.startTime
      };
    }
  });
  
  return bestMatch.score > 0 ? bestMatch.timestamp : null;
}
```

---

## AI Provider System

The AI feature implementation uses a provider pattern for different AI services:

```javascript
// File: server/utils/aiHelper.js (45 lines)
// Multi-provider system design
class AIProviderFactory {
  static createProvider(providerName, apiKey, options = {}) {
    switch (providerName.toLowerCase()) {
      case 'gemini':
        return new GeminiProvider(apiKey, options);
      case 'openai':
        return new OpenAIProvider(apiKey, options);
      case 'claude':
        return new ClaudeProvider(apiKey, options);
      default:
        throw new Error(`Unknown provider: ${providerName}`);
    }
  }
}

// Base Provider Interface
class BaseAIProvider {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.options = options;
  }
  
  async generateContent(prompt, type) {
    throw new Error('generateContent must be implemented by subclass');
  }
  
  formatPrompt(data, type) {
    throw new Error('formatPrompt must be implemented by subclass');
  }
  
  parseResponse(response, type) {
    throw new Error('parseResponse must be implemented by subclass');
  }
  
  getConfigForType(type) {
    const defaultConfigs = {
      summary: { temperature: 0.7, maxTokens: 1000 },
      quiz: { temperature: 0.8, maxTokens: 2000 },
      notes: { temperature: 0.6, maxTokens: 1500 },
      tutor: { temperature: 0.9, maxTokens: 800 }
    };
    
    return defaultConfigs[type] || defaultConfigs.summary;
  }
}

// Gemini Implementation
class GeminiProvider extends BaseAIProvider {
  async generateContent(prompt, type) {
    const config = this.getConfigForType(type);
    
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: config.temperature,
            maxOutputTokens: config.maxTokens,
            topP: 0.8,
            topK: 40
          }
        }
      );
      
      return this.parseResponse(response, type);
    } catch (error) {
      console.error('Gemini API error:', error.response?.data || error.message);
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }
  
  parseResponse(response, type) {
    if (!response.data.candidates || !response.data.candidates[0]) {
      throw new Error('Invalid response from Gemini API');
    }
    
    return response.data.candidates[0].content.parts[0].text;
  }
}

// OpenAI Implementation
class OpenAIProvider extends BaseAIProvider {
  async generateContent(prompt, type) {
    const config = this.getConfigForType(type);
    
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: this.getSystemPrompt(type) },
            { role: 'user', content: prompt }
          ],
          temperature: config.temperature,
          max_tokens: config.maxTokens
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return this.parseResponse(response, type);
    } catch (error) {
      console.error('OpenAI API error:', error.response?.data || error.message);
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }
  
  getSystemPrompt(type) {
    const prompts = {
      summary: 'You are an educational content summarizer. Create clear, structured summaries of educational videos.',
      quiz: 'You are an educational quiz creator. Create challenging but fair multiple-choice questions.',
      notes: 'You are an expert note-taker. Create well-structured educational notes.',
      tutor: 'You are an educational tutor. Provide clear, helpful responses to questions about educational content.'
    };
    
    return prompts[type] || 'You are an AI assistant helping with educational content.';
  }
  
  parseResponse(response, type) {
    if (!response.data.choices || !response.data.choices[0]) {
      throw new Error('Invalid response from OpenAI API');
    }
    
    return response.data.choices[0].message.content;
  }
}
```

---

## Transcript Processing Pipeline

YouTube transcript extraction and processing is a key component:

```javascript
// utils/youtubeApi.js - Transcript Extraction
const { YoutubeTranscript } = require('youtube-transcript');

const getVideoTranscript = async (videoId) => {
  try {
    // Fetch raw transcript from YouTube
    const rawTranscript = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (!rawTranscript || rawTranscript.length === 0) {
      return { 
        text: '', 
        segments: [],
        error: 'No transcript available'
      };
    }
    
    // Format transcript segments with proper timestamps
    const segments = rawTranscript.map(item => ({
      startTime: item.offset / 1000, // Convert to seconds
      duration: item.duration,
      text: item.text.trim(),
      // Generate timestamp in MM:SS format
      timestamp: formatTimestamp(item.offset / 1000)
    }));
    
    // Combine all segments into a single text
    const fullText = segments
      .map(segment => segment.text)
      .join(' ')
      .replace(/\s+/g, ' '); // Clean up extra spaces
    
    return {
      text: fullText,
      segments,
      success: true
    };
  } catch (error) {
    console.error('Transcript fetch error:', error);
    return {
      text: '',
      segments: [],
      error: error.message || 'Failed to fetch transcript'
    };
  }
};

// Helper function to format seconds into MM:SS or HH:MM:SS
const formatTimestamp = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
```

### Transcript Preprocessing

For long videos, preprocessing is necessary:

```javascript
// File: server/utils/aiHelper.js (35 lines)
preprocessTranscript(transcript, maxLength = 50000) {
  if (!transcript) return '';
  
  // For very long transcripts
  if (transcript.length > maxLength) {
    console.log(`Transcript too long (${transcript.length} chars), processing in chunks...`);
    
    // Options for transcript reduction:
    
    // 1. Extract key segments only
    const extractedTranscript = this.extractKeySegments(transcript);
    if (extractedTranscript.length <= maxLength) {
      return extractedTranscript;
    }
    
    // 2. Truncate with warning
    console.log(`Truncating transcript to ${maxLength} characters`);
    return transcript.substring(0, maxLength) + 
      '\n\n[Note: Transcript was truncated due to length constraints]';
  }
  
  return transcript;
}

extractKeySegments(transcript) {
  // Simple extraction - could be enhanced with NLP
  
  // Split into paragraphs
  const paragraphs = transcript.split(/\n\n|\.\s+(?=[A-Z])/);
  
  // Keep first 3 paragraphs (introduction)
  const intro = paragraphs.slice(0, 3).join(' ');
  
  // Select paragraphs containing key indicators
  const keywordIndicators = [
    'important', 'key', 'significant', 'essential', 'critical',
    'remember', 'note that', 'keep in mind', 'crucial',
    'first', 'second', 'third', 'finally', 'lastly',
    'in conclusion', 'to summarize', 'in summary'
  ];
  
  const keyParagraphs = paragraphs.filter(para => 
    keywordIndicators.some(keyword => 
      para.toLowerCase().includes(keyword)
    )
  );
  
  // Include last 3 paragraphs (conclusion)
  const conclusion = paragraphs.slice(-3).join(' ');
  
  return [intro, ...keyParagraphs, conclusion].join('\n\n');
}
```

---

## AI Content Caching & Performance

The system implements intelligent caching to improve performance:

```javascript
// controllers/ai/aiController.js - Caching Implementation
const generateSummary = async (req, res) => {
  try {
    // ... initial setup ...
    
    // Caching check - return existing content if available
    if (video.summary && video.summary.content) {
      // Check if regeneration is forced
      if (!req.query.force) {
        return res.status(200).json({
          message: 'Summary already exists',
          summary: video.summary,
          cached: true
        });
      }
    }
    
    // ... proceed with generation ...
  } catch (error) {
    // ... error handling ...
  }
};

// Cache invalidation when video content changes
const refreshVideoContent = async (videoId) => {
  try {
    const video = await Video.findById(videoId);
    if (!video) return;
    
    // Clear AI-generated content to force regeneration
    video.summary = undefined;
    video.quiz = undefined;
    video.aiNotes = undefined;
    
    await video.save();
    return true;
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return false;
  }
};

// Cache cleanup for old/unused content
const cleanupOldAIContent = async () => {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  // Find videos with old AI content that hasn't been accessed recently
  const videos = await Video.find({
    $or: [
      { 'summary.generatedAt': { $lt: oneMonthAgo } },
      { 'quiz.generatedAt': { $lt: oneMonthAgo } },
      { 'aiNotes.generatedAt': { $lt: oneMonthAgo } }
    ],
    'watchProgress.lastWatched': { $lt: oneMonthAgo }
  });
  
  for (const video of videos) {
    // Clear AI content to save database space
    video.summary = undefined;
    video.quiz = undefined;
    video.aiNotes = undefined;
    await video.save();
  }
  
  return videos.length;
};
```

### AI Rate Limiting

The system implements rate limiting for AI operations:

```javascript
// File: server/middleware/rateLimit/rateLimiters.js (15 lines)
const createRateLimiter = require('express-rate-limit');

// Specialized AI rate limiter
const aiLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 AI operations per hour
  message: {
    error: 'Too many AI operations',
    message: 'Please try again later'
  },
  // Use user ID as key for per-user limiting
  keyGenerator: (req) => req.user?._id || req.ip,
  // Skip rate limiting for users with premium subscription
  skip: (req) => req.user?.subscription?.tier === 'premium'
});

module.exports = { aiLimiter };
```

---

## End-to-End AI Feature Execution Path

Here's a complete summary of the execution path for AI features:

1. **User Interaction**
   - User clicks an AI feature in the frontend (e.g., "Generate Summary")
2. **Frontend Component**
   - React component captures the click event
   - Calls the appropriate function from the custom hook (e.g., `generateSummary`)
3. **Custom Hook (`useAIContent`)**
   - Manages the API call and state (loading, error)
   - Calls the API client method (e.g., `aiAPI.generateSummary`)
4. **API Client**
   - Axios instance configured with base URL and interceptors
   - Makes the HTTP request to the backend (e.g., POST `/ai/summary/:videoId`)
5. **Backend Route**
   - Express route receives the request
   - Applies middleware (e.g., rate limiting, validation)
   - Calls the appropriate controller method (e.g., `aiController.generateSummary`)
6. **AI Controller**
   - Contains the business logic for AI feature
   - Interacts with the database and AI helper
   - Returns the response to the frontend
7. **AI Helper**
   - Utility class that interacts with external AI APIs (e.g., Gemini, OpenAI)
   - Formats prompts, calls the API, and parses responses
8. **Database Storage**
   - Saves the AI-generated content (e.g., summary, quiz, notes) to the database
9. **Frontend Update**
   - The UI is updated with the new content
   - React Query or similar library is used to manage and update the data in the frontend
