import React from 'react';
import { Card, CardBody, CardHeader, CardFooter, Button, Chip } from '@heroui/react';
import { CheckCircle, XCircle, ClipboardList } from 'lucide-react';
import { Video } from '@/lib/api';

interface QuizInterfaceProps {
  video: Video;
  quizInteraction: any; // From useQuizInteraction hook
}

export default function QuizInterface({ video, quizInteraction }: QuizInterfaceProps) {
  const {
    quizAnswers,
    quizSubmitted,
    quizScore,
    handleQuizAnswer,
    handleSubmitQuiz,
    handleRetakeQuiz,
  } = quizInteraction;

  if (!video?.quiz?.questions) {
    return (
      <div className="text-center py-8">
        <p className="text-default-500">No quiz questions available</p>
      </div>
    );
  }

  const hasAnsweredAll = video.quiz.questions.length > 0 && 
    quizAnswers.filter((a: any) => a !== undefined).length === video.quiz.questions.length;

  return (
    <div className="space-y-6">
      {!quizSubmitted ? (
        // Interactive Quiz Interface
        <>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Interactive Quiz</h3>
            <Chip 
              color={hasAnsweredAll ? "success" : "primary"} 
              variant="flat" 
              size="sm"
              className={hasAnsweredAll ? "bg-success/10" : "bg-primary/10"}
            >
              {quizAnswers.filter((a: any) => a !== undefined).length} / {video.quiz.questions.length} answered
            </Chip>
          </div>
          
          {video.quiz.questions.map((q, idx) => (
            <Card key={idx} className="mb-3 shadow-sm border-none">
              <CardHeader className="pb-1">
                <h4 className="font-semibold text-base">{idx + 1}. {q.question}</h4>
              </CardHeader>
              <CardBody className="py-1">
                <div className="space-y-1">
                  {q.options.map((opt, oidx) => (
                    <button
                      key={oidx}
                      onClick={() => handleQuizAnswer(idx, oidx)}
                      className={`w-full p-2 rounded-lg transition-all duration-200 text-left ${
                        quizAnswers[idx] === oidx
                          ? 'bg-primary/20 border border-primary/30 font-medium text-primary'
                          : 'bg-content1 border border-content2 hover:bg-primary/10 hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          quizAnswers[idx] === oidx
                            ? 'bg-primary/30 text-primary'
                            : 'bg-content2 text-foreground'
                        }`}>
                          {String.fromCharCode(65 + oidx)}
                        </div>
                        <div>{opt}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}
          
          {/* Only show Submit button if all questions are answered */}
          {video.quiz.questions.length > 0 && (
            <div className="flex justify-center gap-4 mt-6">
              <Button
                color="success"
                size="lg"
                onClick={() => handleSubmitQuiz(video)}
                disabled={!hasAnsweredAll}
                startContent={<CheckCircle className="w-4 h-4" />}
                className={`shadow-md hover:shadow-lg transition-all ${
                  hasAnsweredAll ? 'animate-pulse-slow' : ''
                }`}
              >
                Submit Quiz
              </Button>
            </div>
          )}
        </>
      ) : (
        // Quiz Results
        <>
          <div className="text-center mb-4">
            <div className="mb-4">
              {quizScore && (
                <div className="space-y-4">
                  <div className="text-4xl font-bold text-primary">
                    {quizScore.percentage}%
                  </div>
                  <div className="text-lg">
                    {quizScore.correct} out of {quizScore.total} correct
                  </div>
                  <div className="flex justify-center">
                    <Chip 
                      color={quizScore.percentage >= 80 ? 'success' : quizScore.percentage >= 60 ? 'warning' : 'danger'} 
                      variant="flat" 
                      size="lg"
                    >
                      {quizScore.percentage >= 80 ? 'Excellent!' : quizScore.percentage >= 60 ? 'Good!' : 'Keep Learning!'}
                    </Chip>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {video.quiz.questions.map((q, idx) => (
            <Card key={idx} className="mb-4 shadow-sm border-none">
              <CardHeader className="pb-1">
                <h4 className="font-semibold text-lg">{idx + 1}. {q.question}</h4>
              </CardHeader>
              <CardBody className="py-2">
                <div className="space-y-2">
                  {q.options.map((opt, oidx) => (
                    <div 
                      key={oidx} 
                      className={`p-3 rounded-lg transition-all duration-200 ${
                        q.correctAnswer === oidx 
                          ? 'bg-success/20 border border-success/30 font-medium text-success' 
                          : quizAnswers[idx] === oidx && quizAnswers[idx] !== q.correctAnswer
                          ? 'bg-danger/20 border border-danger/30 font-medium text-danger'
                          : 'bg-content1 border border-content2'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          q.correctAnswer === oidx 
                            ? 'bg-success/30 text-success' 
                            : quizAnswers[idx] === oidx && quizAnswers[idx] !== q.correctAnswer
                            ? 'bg-danger/30 text-danger'
                            : 'bg-content2 text-foreground'
                        }`}>
                          {String.fromCharCode(65 + oidx)}
                        </div>
                        <div>{opt}</div>
                        {q.correctAnswer === oidx && (
                          <CheckCircle className="w-4 h-4 text-success ml-auto" />
                        )}
                        {quizAnswers[idx] === oidx && quizAnswers[idx] !== q.correctAnswer && (
                          <XCircle className="w-4 h-4 text-danger ml-auto" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
              {q.explanation && (
                <CardFooter className="pt-0 text-sm">
                  <div className="bg-content1 p-3 rounded-lg w-full">
                    <span className="font-medium">Explanation:</span> {q.explanation}
                  </div>
                </CardFooter>
              )}
            </Card>
          ))}
          
          <div className="flex justify-center gap-4 mt-6">
            <Button
              color="primary"
              size="lg"
              onClick={handleRetakeQuiz}
              startContent={<ClipboardList className="w-4 h-4" />}
              className="shadow-md hover:shadow-lg transition-all bg-gradient-to-r from-primary/80 to-primary"
            >
              Retake Quiz
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
