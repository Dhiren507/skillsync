const axios = require('axios');

class AIHelper {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.defaultProvider = 'gemini';
  }

  /**
   * Generate video summary using AI
   * @param {Object} videoData - Video information
   * @param {string} provider - AI provider ('gemini', 'openai', 'claude')
   * @returns {Object} - Summary with content and timestamps
   */
  async generateSummary(videoData, provider = this.defaultProvider) {
    try {
      const { title, description, transcript, transcriptSegments, videoDuration } = videoData;
      
      // Generate summary content using AI
      const prompt = this.buildSummaryPrompt(title, description, transcript);
      
      let response;
      switch (provider.toLowerCase()) {
        case 'gemini':
          response = await this.callGeminiAPI(prompt, 'summary');
          break;
        case 'openai':
          response = await this.callOpenAIAPI(prompt, 'summary');
          break;
        case 'claude':
          response = await this.callClaudeAPI(prompt, 'summary');
          break;
        default:
          throw new Error(`Unsupported AI provider: ${provider}`);
      }

      const summaryContent = this.parseSummaryContent(response);
      
      // Generate real timestamps from transcript segments
      const realTimestamps = this.generateRealTimestamps(transcriptSegments, summaryContent, videoDuration);
      
      return {
        content: summaryContent,
        timestamps: realTimestamps
      };
    } catch (error) {
      console.error('AI summary generation error:', error);
      throw new Error(`Failed to generate summary: ${error.message}`);
    }
  }

  /**
   * Generate quiz questions using AI
   * @param {string} summary - Video summary content
   * @param {string} provider - AI provider ('gemini', 'openai', 'claude')
   * @param {number} questionCount - Number of questions to generate
   * @returns {Array} - Array of quiz questions
   */
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
        case 'claude':
          response = await this.callClaudeAPI(prompt, 'quiz');
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

  /**
   * Generate structured notes using AI
   * @param {Object} videoData - Video information
   * @param {string} provider - AI provider ('gemini', 'openai', 'claude')
   * @param {string} format - Notes format ('bullet', 'outline', 'detailed')
   * @returns {Object} - Notes with content, format, and sections
   */
  async generateNotes(videoData, provider = this.defaultProvider, format = 'bullet') {
    try {
      const { title, description, transcript } = videoData;
      
      // Handle long transcripts by chunking if necessary
      let processedTranscript = transcript;
      if (transcript && transcript.length > 50000) { // If transcript is very long
        console.log('Long transcript detected, processing in chunks...');
        processedTranscript = this.chunkTranscript(transcript);
      }
      
      const prompt = this.buildNotesPrompt(title, description, processedTranscript, format);
      
      let response;
      switch (provider.toLowerCase()) {
        case 'gemini':
          response = await this.callGeminiAPI(prompt, 'notes');
          break;
        case 'openai':
          response = await this.callOpenAIAPI(prompt, 'notes');
          break;
        case 'claude':
          response = await this.callClaudeAPI(prompt, 'notes');
          break;
        default:
          throw new Error(`Unsupported AI provider: ${provider}`);
      }

      return this.parseNotesResponse(response, format);
    } catch (error) {
      console.error('AI notes generation error:', error);
      throw new Error(`Failed to generate notes: ${error.message}`);
    }
  }

  /**
   * Chunk long transcript into manageable pieces while preserving context
   * @param {string} transcript - Full transcript text
   * @returns {string} - Processed transcript
   */
  chunkTranscript(transcript) {
    const maxChunkSize = 40000; // Keep chunks under token limits
    const overlapSize = 2000; // Overlap to maintain context
    
    if (transcript.length <= maxChunkSize) {
      return transcript;
    }
    
    // Split into sentences to avoid breaking mid-sentence
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
    let chunks = [];
    let currentChunk = '';
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i] + '. ';
      
      if ((currentChunk + sentence).length > maxChunkSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    // If we have multiple chunks, create a comprehensive summary approach
    if (chunks.length > 1) {
      return `[LONG VIDEO TRANSCRIPT - ${chunks.length} PARTS]
      
PART 1: ${chunks[0].substring(0, 20000)}...

PART 2: ${chunks[1] ? chunks[1].substring(0, 20000) + '...' : ''}

PART 3: ${chunks[2] ? chunks[2].substring(0, 20000) + '...' : ''}

[Additional parts available but summarized for brevity. Please create comprehensive notes covering ALL major topics and concepts mentioned throughout the ENTIRE video, not just the beginning portions.]`;
    }
    
    return transcript;
  }

  /**
   * Ask AI tutor a question about the video content
   * @param {Object} videoData - Video information
   * @param {string} question - User's question
   * @param {string} provider - AI provider ('gemini', 'openai', 'claude')
   * @returns {string} - AI tutor response
   */
  async askTutor(videoData, question, provider = this.defaultProvider) {
    try {
      const { title, description, transcript, summary } = videoData;
      
      const prompt = this.buildTutorPrompt(title, description, transcript, summary, question);
      
      let response;
      switch (provider.toLowerCase()) {
        case 'gemini':
          response = await this.callGeminiAPI(prompt, 'tutor');
          break;
        case 'openai':
          response = await this.callOpenAIAPI(prompt, 'tutor');
          break;
        case 'claude':
          response = await this.callClaudeAPI(prompt, 'tutor');
          break;
        default:
          throw new Error(`Unsupported AI provider: ${provider}`);
      }

      return this.parseTutorResponse(response);
    } catch (error) {
      console.error('AI tutor error:', error);
      throw new Error(`Failed to get tutor response: ${error.message}`);
    }
  }

  /**
   * Ask AI tutor a general educational question
   * @param {string} question - User's question
   * @param {string} provider - AI provider ('gemini', 'openai', 'claude')
   * @returns {string} - AI tutor response
   */
  async askGeneralTutor(question, provider = this.defaultProvider) {
    try {
      const prompt = this.buildGeneralTutorPrompt(question);
      
      let response;
      switch (provider.toLowerCase()) {
        case 'gemini':
          response = await this.callGeminiAPI(prompt, 'general-tutor');
          break;
        case 'openai':
          response = await this.callOpenAIAPI(prompt, 'general-tutor');
          break;
        case 'claude':
          response = await this.callClaudeAPI(prompt, 'general-tutor');
          break;
        default:
          throw new Error(`Unsupported AI provider: ${provider}`);
      }

      return this.parseTutorResponse(response);
    } catch (error) {
      console.error('AI general tutor error:', error);
      throw new Error(`Failed to get tutor response: ${error.message}`);
    }
  }

  /**
   * Build summary generation prompt
   * @param {string} title - Video title
   * @param {string} description - Video description
   * @param {string} transcript - Video transcript (optional)
   * @returns {string} - Formatted prompt
   */
  buildSummaryPrompt(title, description, transcript = '') {
    const hasTranscript = transcript && transcript.length > 50;
    
    return `
Create a comprehensive summary for this YouTube video:

Title: "${title}"

Description: "${description}"

${hasTranscript ? `Transcript: "${transcript}"` : ''}

Please provide a detailed summary (200-400 words) covering the main topics and key points that viewers would gain from this video.

${hasTranscript ? 
  'Base your summary on the transcript content, identifying the most important concepts and takeaways.' : 
  'Since no transcript is available, create an educational summary based on the title and description, inferring what a video with this title would likely cover.'
}

Format your response as:
SUMMARY:
[Your detailed summary here]

Important: 
- Make the summary educational and actionable
- If transcript is available, use specific details from it
- If no transcript, make reasonable educational inferences from the title/description
- Focus on key learning points and main concepts
- Keep the summary comprehensive but concise
    `.trim();
  }

  /**
   * Build quiz generation prompt
   * @param {string} summary - Video summary
   * @param {number} questionCount - Number of questions
   * @returns {string} - Formatted prompt
   */
  buildQuizPrompt(summary, questionCount = 5) {
    return `
You are an educational AI creating quiz questions. Based on this content, create exactly ${questionCount} multiple-choice quiz questions.

Content: "${summary}"

Create ${questionCount} educational questions that test understanding of key concepts. Follow this EXACT format:

QUESTION 1:
[Create a question about a key concept from the content]
A) [Plausible but incorrect option]
B) [Correct answer based on the content]
C) [Another plausible but incorrect option]
D) [Another plausible but incorrect option]

CORRECT: B
EXPLANATION: [Brief explanation of why this is correct]

QUESTION 2:
[Another question about a different concept]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]

CORRECT: [A, B, C, or D]
EXPLANATION: [Brief explanation]

Continue this exact pattern for all ${questionCount} questions. Make sure each question:
- Tests understanding of different concepts
- Has 4 plausible options
- Has one clearly correct answer
- Includes a helpful explanation

Do not add any extra text before or after the questions.
    `.trim();
  }

  /**
   * Build notes generation prompt
   * @param {string} title - Video title
   * @param {string} description - Video description
   * @param {string} transcript - Video transcript (optional)
   * @param {string} format - Notes format ('bullet', 'outline', 'detailed')
   * @returns {string} - Formatted prompt
   */
  buildNotesPrompt(title, description, transcript = '', format = 'bullet') {
    const hasTranscript = transcript && transcript.length > 50;
    
    let formatInstructions = '';
    switch (format) {
      case 'bullet':
        formatInstructions = `
Format as bullet points with clear sections:
- Main Topic 1
  • Key point 1
  • Key point 2
- Main Topic 2
  • Key point 1
  • Key point 2`;
        break;
      case 'outline':
        formatInstructions = `
Format as a structured outline:
1. Main Topic 1
   1.1 Sub-topic A
   1.2 Sub-topic B
2. Main Topic 2
   2.1 Sub-topic A
   2.2 Sub-topic B`;
        break;
      case 'detailed':
        formatInstructions = `
Format as detailed paragraphs with clear sections:
Section 1: [Topic Name]
[Detailed explanation with examples and context]

Section 2: [Topic Name]
[Detailed explanation with examples and context]`;
        break;
    }
    
    return `
Create comprehensive ${format} notes for this YouTube video:

Title: "${title}"

Description: "${description}"

${hasTranscript ? `Transcript: "${transcript}"` : ''}

${formatInstructions}

IMPORTANT INSTRUCTIONS:
- Create concise but comprehensive notes covering the main topics
- Focus on key concepts, definitions, and important points
- Include practical examples and explanations
- Organize content logically by topic or chronologically
- Keep each section focused and well-structured
- Aim for clarity and educational value

${hasTranscript ? 
  'TRANSCRIPT ANALYSIS:\n- Analyze the transcript to identify key topics and concepts\n- Create notes for major sections and important points\n- Include relevant examples and explanations from the content\n- Organize information into clear, logical sections' : 
  'Since no transcript is available, create educational notes based on the title and description, inferring what a video with this title would likely cover.'
}

OUTPUT REQUIREMENTS:
- Create well-organized, educational notes
- Keep content concise but comprehensive (aim for 500-2000 words total)
- Focus on the most important learning points
- Ensure each section is clear and actionable
- Include major topics, concepts, and key points
- Provide clear explanations for important concepts
- Avoid overly verbose content - be concise and educational
- Use specific details and examples from the video
- Organize content into clear sections with descriptive headers
- Make notes educational, actionable, and comprehensive
- Focus on learning value and retention
- Ensure no important content is missed or skipped
    `.trim();
  }

  /**
   * Build tutor prompt for answering questions
   * @param {string} title - Video title
   * @param {string} description - Video description
   * @param {string} transcript - Video transcript (optional)
   * @param {string} summary - Video summary (optional)
   * @param {string} question - User's question
   * @returns {string} - Formatted prompt
   */
  buildTutorPrompt(title, description, transcript = '', summary = '', question) {
    const hasTranscript = transcript && transcript.length > 50;
    const hasSummary = summary && summary.length > 50;
    
    return `
You are an AI tutor helping a student understand a YouTube video. Answer their question based on the video content.

Video Title: "${title}"
Video Description: "${description}"

${hasTranscript ? `Video Transcript: "${transcript}"` : ''}
${hasSummary ? `Video Summary: "${summary}"` : ''}

Student Question: "${question}"

Please provide a helpful, educational response that:
- Directly answers the student's question
- Uses specific information from the video content
- Explains concepts clearly and thoroughly
- Provides examples or analogies when helpful
- Encourages further learning and understanding
- Maintains a supportive, encouraging tone

**Use markdown formatting to make your response more readable:**
- Use **bold** for important concepts and key terms
- Use *italic* for emphasis and definitions
- Use bullet points for lists and examples
- Use numbered lists for steps or sequences
- Use \`code\` for technical terms or code snippets
- Use > blockquotes for important quotes or key takeaways
- Use headers (##) to organize different sections if needed
- Use tables for comparing concepts or showing data
- Use task lists (- [ ] and - [x]) for checklists or steps

If the question cannot be answered based on the available video content, politely explain that and suggest what additional information might be needed.

Keep your response focused, educational, and helpful for learning.
    `.trim();
  }

  /**
   * Build general tutor prompt for educational questions
   * @param {string} question - User's question
   * @returns {string} - Formatted prompt
   */
  buildGeneralTutorPrompt(question) {
    return `
You are an AI tutor helping a student understand a general educational concept. Answer their question.

Student Question: "${question}"

Please provide a helpful, educational response that:
- Directly answers the student's question
- Explains concepts clearly and thoroughly
- Provides examples or analogies when helpful
- Encourages further learning and understanding
- Maintains a supportive, encouraging tone

**Use markdown formatting to make your response more readable:**
- Use **bold** for important concepts and key terms
- Use *italic* for emphasis and definitions
- Use bullet points for lists and examples
- Use numbered lists for steps or sequences
- Use \`code\` for technical terms or code snippets
- Use > blockquotes for important quotes or key takeaways
- Use headers (##) to organize different sections if needed
- Use tables for comparing concepts or showing data
- Use task lists (- [ ] and - [x]) for checklists or steps

If the question cannot be answered based on the available knowledge, politely explain that and suggest what additional information might be needed.

Keep your response focused, educational, and helpful for learning.
    `.trim();
  }

  /**
   * Call Gemini API
   * @param {string} prompt - The prompt to send
   * @param {string} type - Request type ('summary' or 'quiz')
   * @returns {string} - AI response
   */
  async callGeminiAPI(prompt, type) {
    try {
      if (!this.geminiApiKey) {
        throw new Error('Gemini API key not configured');
      }

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: type === 'quiz' ? 0.7 : 0.5,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: type === 'quiz' ? 2048 : 
                             type === 'notes' ? 8192 : 
                             type === 'summary' ? 4096 : 1024,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      if (!response.data.candidates || !response.data.candidates[0]) {
        throw new Error('No response from Gemini API');
      }

      return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API error:', error);
      if (error.response) {
        throw new Error(`Gemini API error: ${error.response.status} - ${error.response.data?.error?.message || 'Unknown error'}`);
      }
      throw new Error('Failed to connect to Gemini API');
    }
  }

  /**
   * Call OpenAI API
   * @param {string} prompt - The prompt to send
   * @param {string} type - Request type ('summary' or 'quiz')
   * @returns {string} - AI response
   */
  async callOpenAIAPI(prompt, type) {
    try {
      if (!this.openaiApiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [{
            role: 'user',
            content: prompt
          }],
          temperature: type === 'quiz' ? 0.7 : 0.5,
          max_tokens: type === 'quiz' ? 2048 : 1024,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      if (!response.data.choices || !response.data.choices[0]) {
        throw new Error('No response from OpenAI API');
      }

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      if (error.response) {
        throw new Error(`OpenAI API error: ${error.response.status} - ${error.response.data?.error?.message || 'Unknown error'}`);
      }
      throw new Error('Failed to connect to OpenAI API');
    }
  }

  /**
   * Call Claude API (Anthropic)
   * @param {string} prompt - The prompt to send
   * @param {string} type - Request type ('summary' or 'quiz')
   * @returns {string} - AI response
   */
  async callClaudeAPI(prompt, type) {
    try {
      // Note: This is a placeholder for Claude API integration
      // You would need to implement the actual Claude API call here
      // based on Anthropic's API documentation
      throw new Error('Claude API integration not implemented yet');
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error('Claude API not available');
    }
  }

  /**
   * Parse summary response from AI
   * @param {string} response - Raw AI response
   * @returns {Object} - Parsed summary object
   */
  parseSummaryContent(response) {
    try {
      const summaryPart = response.replace('SUMMARY:', '').trim();
      return summaryPart;
    } catch (error) {
      console.error('Error parsing summary content:', error);
      return response.trim();
    }
  }

  generateRealTimestamps(transcriptSegments, summaryContent, videoDuration = 0) {
    try {
      if (!transcriptSegments || transcriptSegments.length === 0) {
        console.log('No transcript segments available, generating estimated timestamps');
        return this.generateEstimatedTimestamps(summaryContent, videoDuration);
      }

      console.log(`Generating real timestamps from ${transcriptSegments.length} transcript segments`);

      // Extract key topics from summary content
      const keyTopics = this.extractKeyTopics(summaryContent);
      
      // Find relevant segments that match key topics
      const relevantSegments = this.findRelevantSegments(transcriptSegments, keyTopics);
      
      // Convert to timestamp format
      const timestamps = relevantSegments.map(segment => ({
        time: this.secondsToTimestamp(segment.start),
        text: this.truncateText(segment.text, 50)
      }));

      console.log(`Generated ${timestamps.length} real timestamps`);
      return timestamps;
    } catch (error) {
      console.error('Error generating real timestamps:', error);
      console.log('Falling back to estimated timestamps');
      return this.generateEstimatedTimestamps(summaryContent, videoDuration);
    }
  }

  /**
   * Parse quiz response from AI
   * @param {string} response - Raw AI response
   * @returns {Object} - Object with questions array
   */
  parseQuizResponse(response) {
    try {
      console.log('Raw quiz response:', response); // Debug log
      
      const questions = [];
      
      // Split by QUESTION markers
      let questionBlocks = response.split(/QUESTION \d+:/);
      questionBlocks = questionBlocks.slice(1); // Remove first empty element
      
      console.log('Found question blocks:', questionBlocks.length); // Debug log

      for (let blockIndex = 0; blockIndex < questionBlocks.length; blockIndex++) {
        const block = questionBlocks[blockIndex].trim();
        const lines = block.split('\n').map(line => line.trim()).filter(line => line);
        
        console.log(`Processing block ${blockIndex + 1}:`, lines); // Debug log
        
        if (lines.length < 6) continue; // Need at least question + 4 options + correct answer

        const questionText = lines[0];
        const options = [];
        let correctAnswer = -1;
        let explanation = '';
        let foundCorrect = false;
        let foundExplanation = false;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          
          // Skip if we already found correct answer and explanation
          if (foundCorrect && foundExplanation) break;
          
          // Parse correct answer first (to avoid confusion with options)
          if (!foundCorrect && line.match(/^(?:CORRECT|ANSWER):\s*([A-D])/i)) {
            const correctMatch = line.match(/^(?:CORRECT|ANSWER):\s*([A-D])/i);
            if (correctMatch) {
              correctAnswer = correctMatch[1].charCodeAt(0) - 'A'.charCodeAt(0);
              foundCorrect = true;
              continue;
            }
          }
          
          // Parse explanation
          if (!foundExplanation && line.match(/^EXPLANATION:\s*(.+)$/i)) {
            const explanationMatch = line.match(/^EXPLANATION:\s*(.+)$/i);
            if (explanationMatch) {
              explanation = explanationMatch[1].trim();
              foundExplanation = true;
              continue;
            }
          }
          
          // Parse options (A, B, C, D) - only if we don't have 4 options yet
          if (options.length < 4 && line.match(/^([A-D])[\)\.]?\s*(.+)$/)) {
            const optionMatch = line.match(/^([A-D])[\)\.]?\s*(.+)$/);
            if (optionMatch) {
              options.push(optionMatch[2].trim());
              continue;
            }
          }
        }

        // Validate question
        if (questionText && options.length === 4 && correctAnswer >= 0 && correctAnswer < 4) {
          questions.push({
            question: questionText,
            options: options,
            correctAnswer: correctAnswer,
            explanation: explanation || 'No explanation provided.'
          });
          console.log(`Successfully parsed question ${questions.length}`); // Debug log
        } else {
          console.log(`Failed to parse question: text=${!!questionText}, options=${options.length}, correct=${correctAnswer}`); // Debug log
        }
      }

      console.log('Total parsed questions:', questions.length); // Debug log
      
      return { questions };
    } catch (error) {
      console.error('Error parsing quiz response:', error);
      return { questions: [] };
    }
  }

  /**
   * Parse notes response from AI
   * @param {string} response - Raw AI response
   * @param {string} format - Notes format ('bullet', 'outline', 'detailed')
   * @returns {Object} - Parsed notes object
   */
  parseNotesResponse(response, format) {
    try {
      const content = response.trim();
      
      // Extract sections from the content
      const sections = [];
      const lines = content.split('\n');
      let currentSection = null;
      let currentContent = [];

      for (const line of lines) {
        // Check for section headers (## Header or I., II., etc.)
        if (line.match(/^#{1,3}\s+(.+)$/) || line.match(/^[IVX]+\.\s+(.+)$/) || line.match(/^[A-Z]\.\s+(.+)$/)) {
          // Save previous section if exists
          if (currentSection) {
            const sectionContent = currentContent.join('\n').trim();
            const processedSections = this.processSectionContent(currentSection, sectionContent);
            sections.push(...processedSections);
          }
          
          // Start new section
          const headerMatch = line.match(/^#{1,3}\s+(.+)$/) || 
                             line.match(/^[IVX]+\.\s+(.+)$/) || 
                             line.match(/^[A-Z]\.\s+(.+)$/);
          currentSection = headerMatch ? headerMatch[1].trim() : line.trim();
          currentContent = [];
        } else if (line.trim()) {
          // Add content to current section
          currentContent.push(line);
        }
      }

      // Add the last section
      if (currentSection) {
        const sectionContent = currentContent.join('\n').trim();
        const processedSections = this.processSectionContent(currentSection, sectionContent);
        sections.push(...processedSections);
      }

      // If no sections found, create a single section with all content
      if (sections.length === 0) {
        const processedSections = this.processSectionContent('Notes', content);
        sections.push(...processedSections);
      }

      return {
        content: this.truncateText(content, 15000), // Truncate main content too
        format,
        sections
      };
    } catch (error) {
      console.error('Error parsing notes response:', error);
      return {
        content: this.truncateText(response || 'Failed to generate notes', 15000),
        format,
        sections: [{
          title: 'Notes',
          content: this.truncateText(response || 'Failed to generate notes', 10000),
          timestamp: 0
        }]
      };
    }
  }

  /**
   * Parse tutor response from AI
   * @param {string} response - Raw AI response
   * @returns {string} - Parsed tutor response
   */
  parseTutorResponse(response) {
    try {
      return response.trim();
    } catch (error) {
      console.error('Error parsing tutor response:', error);
      return response || 'Failed to get tutor response';
    }
  }

  /**
   * Validate AI provider
   * @param {string} provider - AI provider name
   * @returns {boolean} - True if provider is supported
   */
  isValidProvider(provider) {
    return ['gemini', 'openai', 'claude'].includes(provider.toLowerCase());
  }

  /**
   * Get available AI providers based on configured API keys
   * @returns {Array} - Array of available provider names
   */
  getAvailableProviders() {
    const providers = [];
    
    if (this.geminiApiKey) providers.push('gemini');
    if (this.openaiApiKey) providers.push('openai');
    // Add claude when implemented
    
    return providers;
  }

  /**
   * Test AI provider connectivity
   * @param {string} provider - AI provider to test
   * @returns {boolean} - True if provider is accessible
   */
  async testProvider(provider) {
    try {
      const testPrompt = 'Say "Hello" in one word.';
      const response = await this.callGeminiAPI(testPrompt, 'summary');
      return response.toLowerCase().includes('hello');
    } catch (error) {
      console.error(`Provider ${provider} test failed:`, error);
      return false;
    }
  }

  /**
   * Validate timestamp format
   * @param {string} timestamp - Timestamp string
   * @returns {boolean} - True if valid
   */
  isValidTimestamp(timestamp) {
    // Check if timestamp matches MM:SS or HH:MM:SS format
    const timeRegex = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
    const match = timestamp.match(timeRegex);
    
    if (!match) return false;
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2]);
    const seconds = parseInt(match[3] || '0');
    
    // Validate ranges
    return minutes >= 0 && minutes <= 59 && seconds >= 0 && seconds <= 59;
  }

  /**
   * Parse timestamps using alternative formats
   * @param {string} timestampsPart - Raw timestamps text
   * @returns {Array} - Array of timestamp objects
   */
  parseAlternativeTimestamps(timestampsPart) {
    const timestamps = [];
    const lines = timestampsPart.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Try different timestamp formats
      const patterns = [
        /^[-•]?\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–—]\s*(.+)$/, // Standard format
        /^[-•]?\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*[:]\s*(.+)$/, // Colon separator
        /^[-•]?\s*(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)$/, // Space separator
        /^[-•]?\s*\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*(.+)$/, // Bracket format
      ];
      
      for (const pattern of patterns) {
        const match = trimmedLine.match(pattern);
        if (match) {
          const time = match[1];
          const text = match[2].trim();
          
          if (this.isValidTimestamp(time)) {
            timestamps.push({ time, text });
            break;
          }
        }
      }
    }
    
    return timestamps;
  }

  /**
   * Extract key topics from summary content
   * @param {string} summaryContent - AI generated summary
   * @returns {Array} - Array of key topic keywords
   */
  extractKeyTopics(summaryContent) {
    const topics = [];
    const words = summaryContent.toLowerCase().split(/\s+/);
    
    // Common educational keywords
    const keywords = [
      'introduction', 'overview', 'basics', 'fundamentals', 'concepts',
      'examples', 'demonstration', 'tutorial', 'guide', 'explanation',
      'practice', 'exercise', 'implementation', 'code', 'setup',
      'configuration', 'installation', 'best practices', 'tips',
      'common mistakes', 'troubleshooting', 'advanced', 'summary',
      'conclusion', 'next steps', 'recap', 'review'
    ];
    
    for (const word of words) {
      if (keywords.includes(word) && !topics.includes(word)) {
        topics.push(word);
      }
    }
    
    return topics;
  }

  /**
   * Find relevant transcript segments based on key topics
   * @param {Array} segments - Transcript segments with timestamps
   * @param {Array} keyTopics - Key topics to search for
   * @returns {Array} - Relevant segments with timestamps
   */
  findRelevantSegments(segments, keyTopics) {
    const relevantSegments = [];
    const segmentCount = segments.length;
    const targetCount = Math.min(8, Math.max(5, Math.floor(segmentCount / 10))); // 5-8 timestamps
    
    // Strategy 1: Find segments containing key topics
    for (const segment of segments) {
      const segmentText = segment.text.toLowerCase();
      for (const topic of keyTopics) {
        if (segmentText.includes(topic) && relevantSegments.length < targetCount) {
          relevantSegments.push(segment);
          break;
        }
      }
    }
    
    // Strategy 2: If not enough found, add evenly distributed segments
    if (relevantSegments.length < targetCount) {
      const step = Math.floor(segmentCount / targetCount);
      for (let i = 0; i < targetCount && i * step < segmentCount; i++) {
        const segment = segments[i * step];
        if (!relevantSegments.find(s => s.start === segment.start)) {
          relevantSegments.push(segment);
        }
      }
    }
    
    // Sort by timestamp
    return relevantSegments.sort((a, b) => a.start - b.start);
  }

  /**
   * Convert seconds to MM:SS format
   * @param {number} seconds - Time in seconds
   * @returns {string} - Formatted timestamp
   */
  secondsToTimestamp(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Truncate text to specified length
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} - Truncated text
   */
  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Generate estimated timestamps when transcript is not available
   * @param {string} summaryContent - AI generated summary
   * @param {number} videoDuration - Video duration in seconds
   * @returns {Array} - Array of estimated timestamp objects
   */
  generateEstimatedTimestamps(summaryContent, videoDuration = 0) {
    try {
      console.log('Generating estimated timestamps based on summary content');
      
      // Extract key topics from summary
      const keyTopics = this.extractKeyTopics(summaryContent);
      
      // Default video structure timestamps (if no duration provided)
      const defaultStructure = [
        { percentage: 0.05, label: 'Introduction' },
        { percentage: 0.15, label: 'Overview' },
        { percentage: 0.30, label: 'Main Concepts' },
        { percentage: 0.50, label: 'Examples' },
        { percentage: 0.70, label: 'Advanced Topics' },
        { percentage: 0.85, label: 'Best Practices' },
        { percentage: 0.95, label: 'Summary' }
      ];

      // If we have video duration, use it for more accurate timestamps
      if (videoDuration > 0) {
        const timestamps = defaultStructure.map(item => {
          const seconds = Math.floor(videoDuration * item.percentage);
          return {
            time: this.secondsToTimestamp(seconds),
            text: this.generateSmartDescription(item.label, keyTopics)
          };
        });
        
        console.log(`Generated ${timestamps.length} estimated timestamps based on video duration`);
        return timestamps;
      }

      // Fallback to typical video structure (assuming 15-20 minute video)
      const estimatedDuration = 18 * 60; // 18 minutes in seconds
      const timestamps = defaultStructure.map(item => {
        const seconds = Math.floor(estimatedDuration * item.percentage);
        return {
          time: this.secondsToTimestamp(seconds),
          text: this.generateSmartDescription(item.label, keyTopics)
        };
      });

      console.log(`Generated ${timestamps.length} estimated timestamps with default duration`);
      return timestamps;
    } catch (error) {
      console.error('Error generating estimated timestamps:', error);
      return [];
    }
  }

  /**
   * Process section content to handle character limits
   * @param {string} title - Section title
   * @param {string} content - Section content
   * @returns {Array} - Array of processed sections
   */
  processSectionContent(title, content) {
    const MAX_SECTION_CONTENT = 10000;
    const sections = [];

    // If content is within limit, return as single section
    if (content.length <= MAX_SECTION_CONTENT) {
      sections.push({
        title: this.truncateText(title, 500),
        content: content,
        timestamp: 0
      });
      return sections;
    }

    // Split large content into multiple sections
    console.log(`Section "${title}" exceeds ${MAX_SECTION_CONTENT} characters (${content.length}), splitting into multiple sections`);
    
    const lines = content.split('\n');
    let currentSectionContent = '';
    let sectionIndex = 1;

    for (const line of lines) {
      // Check if adding this line would exceed the limit
      if ((currentSectionContent + line + '\n').length > MAX_SECTION_CONTENT) {
        // Save current section
        if (currentSectionContent.trim()) {
          sections.push({
            title: sectionIndex === 1 ? this.truncateText(title, 500) : `${this.truncateText(title, 400)} (Part ${sectionIndex})`,
            content: currentSectionContent.trim(),
            timestamp: 0
          });
          sectionIndex++;
        }
        
        // Start new section with current line
        currentSectionContent = line + '\n';
      } else {
        // Add line to current section
        currentSectionContent += line + '\n';
      }
    }

    // Add the last section
    if (currentSectionContent.trim()) {
      sections.push({
        title: sectionIndex === 1 ? this.truncateText(title, 500) : `${this.truncateText(title, 400)} (Part ${sectionIndex})`,
        content: currentSectionContent.trim(),
        timestamp: 0
      });
    }

    console.log(`Split "${title}" into ${sections.length} sections`);
    return sections;
  }

  /**
   * Generate smart description for estimated timestamps
   * @param {string} label - Base label (e.g., 'Introduction')
   * @param {Array} keyTopics - Key topics from summary
   * @returns {string} - Smart description
   */
  generateSmartDescription(label, keyTopics) {
    // Map common labels to more specific descriptions based on topics
    const topicMap = {
      'Introduction': ['introduction', 'overview', 'welcome', 'getting started'],
      'Overview': ['basics', 'fundamentals', 'concepts', 'principles'],
      'Main Concepts': ['core concepts', 'main topics', 'key ideas', 'fundamentals'],
      'Examples': ['examples', 'demonstration', 'practical', 'implementation'],
      'Advanced Topics': ['advanced', 'complex', 'advanced techniques', 'deep dive'],
      'Best Practices': ['best practices', 'tips', 'recommendations', 'guidelines'],
      'Summary': ['summary', 'conclusion', 'recap', 'next steps']
    };

    // Find matching topics for this label
    const relevantTopics = topicMap[label] || [];
    const matchingTopics = keyTopics.filter(topic => 
      relevantTopics.some(relevant => topic.includes(relevant))
    );

    if (matchingTopics.length > 0) {
      return `${label}: ${matchingTopics[0]}`;
    }

    // Fallback to smart label based on common patterns
    const smartLabels = {
      'Introduction': 'Introduction and overview',
      'Overview': 'Basic concepts and fundamentals',
      'Main Concepts': 'Core topics and key ideas',
      'Examples': 'Practical examples and demonstrations',
      'Advanced Topics': 'Advanced techniques and concepts',
      'Best Practices': 'Tips and best practices',
      'Summary': 'Summary and next steps'
    };

    return smartLabels[label] || label;
  }
}

// Create singleton instance
const aiHelper = new AIHelper();

module.exports = aiHelper;
