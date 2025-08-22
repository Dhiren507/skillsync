import React from 'react';
import { Spinner, Button, Badge } from '@heroui/react';
import { Brain, FileText } from 'lucide-react';
import { TabKey, TABS } from '@/utils/videoPlayerConstants';
import { AiContentState } from '@/hooks/useAIContent';
import { Video } from '@/lib/api';
import QuizInterface from '@/components/ai-content/QuizInterface';
import ContentRenderer from '@/components/ai-content/ContentRenderer';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

interface AIContentDisplayProps {
  activeTab: TabKey;
  video: Video;
  aiContent: AiContentState;
  loadingTab: TabKey | '';
  aiError: Partial<Record<TabKey, string>>;
  onGenerate: (tabKey: TabKey, video?: any) => void;
  quizInteraction: any; // From useQuizInteraction hook
}

export default function AIContentDisplay({
  activeTab,
  video,
  aiContent,
  loadingTab,
  aiError,
  onGenerate,
  quizInteraction,
}: AIContentDisplayProps) {
  // Loading state
  if (loadingTab === activeTab) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <Spinner color="primary" size="lg" />
        <p className="text-default-500 mt-4 animate-pulse">
          Generating {TABS.find(t => t.key === activeTab)?.label}...
        </p>
      </div>
    );
  }

  // Error state
  if (aiError[activeTab]) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-center">
        <div className="text-danger mb-4">
          <FileText className="w-10 h-10 mx-auto opacity-70" />
        </div>
        <p className="text-danger font-medium">{aiError[activeTab]}</p>
        <p className="text-default-500 text-sm mt-2">
          Use the Generate button below to try again
        </p>
        <Button
          color="primary"
          className="mt-4"
          onClick={() => onGenerate(activeTab, video)}
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Quiz content (special handling)
  if (activeTab === 'quiz' && video?.quiz?.questions) {
    return (
      <QuizInterface
        video={video}
        quizInteraction={quizInteraction}
      />
    );
  }

  // Existing video content (summary, notes)
  if (activeTab === 'summary' && video.summary?.content) {
    return <ContentRenderer content={video.summary} type="summary" />;
  }

  if (activeTab === 'notes' && video.aiNotes?.content) {
    return <ContentRenderer content={video.aiNotes} type="notes" />;
  }

  // Video description content
  if (activeTab === 'desc' && video.description) {
    return (
      <div className="space-y-4">
        <div className="bg-content1 p-4 rounded-lg">
          <h4 className="font-semibold text-lg mb-3 text-primary flex items-center gap-2">
            <span>📝</span> Description
          </h4>
          <MarkdownRenderer 
            content={video.description} 
            className="text-foreground" 
          />
        </div>
        <div className="text-center">
          <Badge color="success" variant="flat" size="sm">
            ✨ Video Description
          </Badge>
        </div>
      </div>
    );
  }

  // Generated AI content (with markdown support)
  if (aiContent[activeTab]) {
    return (
      <div className="bg-content1 p-4 rounded-lg">
        <h4 className="font-semibold text-lg mb-3 text-primary flex items-center gap-2">
          {(() => {
            const tab = TABS.find(t => t.key === activeTab);
            const Icon = tab?.icon || FileText;
            return (
              <>
                <Icon className="w-5 h-5" />
                <span>{tab?.label}</span>
              </>
            );
          })()}
        </h4>
        <MarkdownRenderer 
          content={aiContent[activeTab]} 
          className="text-foreground" 
        />
        <div className="text-center mt-4">
          <Badge color="success" variant="flat" size="sm">
            ✨ Generated with AI
          </Badge>
        </div>
      </div>
    );
  }

  // Empty state with generation button
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
      <div className="text-default-300 mb-4">
        {(() => {
          const tab = TABS.find(t => t.key === activeTab);
          if (tab) {
            const Icon = tab.icon;
            return <Icon className="w-10 h-10 mx-auto" />;
          }
          return null;
        })()}
      </div>
      <p className="text-default-400 mb-6">
        No {TABS.find(t => t.key === activeTab)?.label} generated yet.
      </p>
      <Button
        color="primary"
        className="bg-gradient-to-r from-primary to-secondary text-white font-medium"
        onClick={() => onGenerate(activeTab, video)}
        isLoading={loadingTab === activeTab}
        startContent={loadingTab !== activeTab && <Brain className="w-4 h-4" />}
        size="lg"
        disabled={Boolean(
          (activeTab === 'summary' && video?.summary?.content) ||
          (activeTab === 'notes' && video?.aiNotes?.content) ||
          (activeTab === 'desc' && video?.description)
        )}
      >
        {(() => {
          if (loadingTab === activeTab) {
            return `Generating ${TABS.find(t => t.key === activeTab)?.label}...`;
          }
          const hasContent = 
            (activeTab === 'summary' && video?.summary?.content) ||
            (activeTab === 'notes' && video?.aiNotes?.content) ||
            (activeTab === 'desc' && video?.description);
          return hasContent 
            ? `${TABS.find(t => t.key === activeTab)?.label} Ready`
            : `Generate ${TABS.find(t => t.key === activeTab)?.label}`;
        })()}
      </Button>
      <Badge 
        color={
          (activeTab === 'quiz' && video?.quiz?.questions && video.quiz.questions.length > 0) ||
          (activeTab === 'summary' && video?.summary?.content) ||
          (activeTab === 'notes' && video?.aiNotes?.content) ||
          (activeTab === 'desc' && video?.description)
            ? 'success' 
            : 'default'
        } 
        variant="flat" 
        size="sm"
        className="mt-3"
      >
        {
          activeTab === 'quiz' && video?.quiz?.questions && video.quiz.questions.length > 0
            ? `${video.quiz.questions.length} Questions`
            : (activeTab === 'summary' && video?.summary?.content) ||
              (activeTab === 'notes' && video?.aiNotes?.content) ||
              (activeTab === 'desc' && video?.description)
            ? 'Generated' 
            : ''
        }
      </Badge>
    </div>
  );
}
