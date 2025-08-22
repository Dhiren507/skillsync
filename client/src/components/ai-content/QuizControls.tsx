import React from 'react';
import { Button, Chip, Slider, Input } from '@heroui/react';
import { Plus, Minus, XCircle, Zap, HelpCircle } from 'lucide-react';
import { Video } from '@/lib/api';

interface QuizControlsProps {
  video: Video;
  questionCount: number;
  setQuestionCount: (count: number) => void;
  onGenerateQuiz: () => void;
  isGenerating: boolean;
}

export default function QuizControls({
  video,
  questionCount,
  setQuestionCount,
  onGenerateQuiz,
  isGenerating,
}: QuizControlsProps) {
  const hasQuestions = video?.quiz?.questions && video.quiz.questions.length > 0;
  
  return (
    <div className="space-y-4 mb-6">
      {/* Question Count Controls - Show only if no questions exist yet */}
      {!hasQuestions && (
        <div className="flex flex-col gap-4 p-4 bg-content1 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary/70" />
              <span className="text-sm font-medium">Number of Questions:</span>
            </div>
            <Chip color="primary" variant="flat" size="sm" className="bg-primary/10">
              {questionCount} Questions
            </Chip>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              color="primary"
              onClick={() => setQuestionCount(Math.max(3, questionCount - 1))}
              disabled={questionCount <= 3 || isGenerating}
              className="min-w-8 h-8 hover:bg-primary/20 transition-all"
            >
              <Minus className="w-3 h-3" />
            </Button>
            
            <div className="flex-1">
              <Slider
                size="sm"
                step={1}
                minValue={3}
                maxValue={10}
                value={questionCount}
                onChange={(value) => setQuestionCount(value as number)}
                className="max-w-full"
                isDisabled={isGenerating}
                showSteps
              />
            </div>
            
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              color="primary"
              onClick={() => setQuestionCount(Math.min(10, questionCount + 1))}
              disabled={questionCount >= 10 || isGenerating}
              className="min-w-8 h-8 hover:bg-primary/20 transition-all"
            >
              <Plus className="w-3 h-3" />
            </Button>
            
            <Input
              type="number"
              min={3}
              max={10}
              value={questionCount.toString()}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 3 && value <= 10) {
                  setQuestionCount(value);
                }
              }}
              size="sm"
              className="w-16 text-center"
              isDisabled={isGenerating}
            />
          </div>
          
          {/* Generate Quiz Button - Only shown when no questions exist */}
          <Button
            color="primary"
            className="w-full mt-2 bg-gradient-to-r from-primary to-secondary text-white shadow-md hover:shadow-lg transition-all"
            onClick={onGenerateQuiz}
            isLoading={isGenerating}
            startContent={!isGenerating && <Zap className="w-4 h-4" />}
          >
            {isGenerating ? 'Generating Quiz...' : `Generate ${questionCount} Questions`}
          </Button>
        </div>
      )}

      {/* Quiz Status - Only shown when questions exist */}
      {hasQuestions && (
        <div className="flex items-center justify-center p-4 bg-content1 rounded-lg shadow-sm">
          <Chip color="success" variant="solid" size="md" className="animate-pulse-slow">
            {video.quiz?.questions?.length || 0} Questions Ready
          </Chip>
        </div>
      )}
    </div>
  );
}
