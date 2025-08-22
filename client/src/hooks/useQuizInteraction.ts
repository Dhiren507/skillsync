import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aiAPI, Video } from '@/lib/api';

export type QuizScore = { correct: number; total: number; percentage: number };

export function useQuizInteraction(videoId: string | undefined) {
  const queryClient = useQueryClient();
  const [questionCount, setQuestionCount] = useState(5);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<QuizScore | null>(null);

  // Quiz mutations
  const quizMutation = useMutation({ 
    mutationFn: () => aiAPI.generateQuiz(videoId!, { provider: 'gemini', questionCount }), 
    onSuccess: (res) => { 
      queryClient.invalidateQueries({ queryKey: ['video', videoId] });
      // Reset quiz state when new quiz is generated
      setQuizAnswers([]);
      setQuizSubmitted(false);
      setQuizScore(null);
    }, 
    onError: (err: any) => { 
      console.error('Failed to generate quiz:', err);
    }, 
  });

  const clearQuizMutation = useMutation({
    mutationFn: () => aiAPI.clearQuiz(videoId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video', videoId] });
      // Reset quiz state
      setQuizAnswers([]);
      setQuizSubmitted(false);
      setQuizScore(null);
    },
    onError: (err: any) => {
      console.error('Failed to clear quiz:', err);
    }
  });

  // Quiz interaction handlers
  const handleQuizAnswer = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...quizAnswers];
    newAnswers[questionIndex] = answerIndex;
    setQuizAnswers(newAnswers);
  };
  
  const handleSubmitQuiz = (video: Video) => {
    if (!video?.quiz?.questions) return;
    
    const totalQuestions = video.quiz.questions.length;
    const correctAnswers = video.quiz.questions.reduce((correct, question, index) => {
      return correct + (quizAnswers[index] === question.correctAnswer ? 1 : 0);
    }, 0);
    
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    setQuizScore({ correct: correctAnswers, total: totalQuestions, percentage });
    setQuizSubmitted(true);
  };
  
  const handleRetakeQuiz = () => {
    setQuizAnswers([]);
    setQuizSubmitted(false);
    setQuizScore(null);
  };

  const handleGenerateQuiz = () => {
    quizMutation.mutate();
  };

  return {
    // State
    questionCount,
    setQuestionCount,
    quizAnswers,
    quizSubmitted,
    quizScore,
    
    // Handlers
    handleQuizAnswer,
    handleSubmitQuiz,
    handleRetakeQuiz,
    handleGenerateQuiz,
    
    // Mutations
    quizMutation,
    clearQuizMutation,
  };
}
