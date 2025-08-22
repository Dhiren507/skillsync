import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Tabs, Tab, Divider } from '@heroui/react';
import { TABS, TabKey } from '@/utils/videoPlayerConstants';
import AIContentDisplay from '@/components/ai-content/AIContentDisplay';
import QuizControls from '@/components/ai-content/QuizControls';
import { Video } from '@/lib/api';
import { useAIContent } from '@/hooks/useAIContent';
import { useQuizInteraction } from '@/hooks/useQuizInteraction';

interface AIContentTabsProps {
  video: Video;
  videoId: string;
}

export default function AIContentTabs({ video, videoId }: AIContentTabsProps) {
  const aiContent = useAIContent(videoId);
  const quizInteraction = useQuizInteraction(videoId);

  return (
    <div className="w-full md:w-1/2 flex flex-col bg-background/95 backdrop-blur-lg overflow-hidden">
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Card className="shadow-2xl backdrop-blur-lg border-none hover:shadow-xl transition-all duration-300 overflow-hidden bg-background/80 glass-effect">
            <CardBody className="p-6">
              {/* Enhanced Tabs */}
              <Tabs
                selectedKey={aiContent.activeTab}
                onSelectionChange={aiContent.setActiveTab as any}
                variant="underlined"
                color="primary"
                classNames={{ 
                  tabList: 'gap-6 w-full relative rounded-none border-b border-divider/50',
                  tab: 'px-4 py-3 max-w-fit text-sm font-medium transition-all duration-200',
                  cursor: 'w-full bg-gradient-to-r from-primary to-secondary h-0.5',
                  tabContent: 'group-data-[selected=true]:text-primary group-data-[hover=true]:text-primary/80 transition-colors'
                }}
              >
                {TABS.map(tab => (
                  <Tab 
                    key={tab.key} 
                    title={
                      <motion.div 
                        className="flex items-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <tab.icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                        {/* Content indicator badges */}
                        {tab.key === 'quiz' && video?.quiz?.questions && video.quiz.questions.length > 0 && (
                          <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                        )}
                        {tab.key === 'summary' && video?.summary?.content && (
                          <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                        )}
                        {tab.key === 'notes' && video?.aiNotes?.content && (
                          <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
                        )}
                        {tab.key === 'desc' && video?.description && (
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        )}
                      </motion.div>
                    } 
                  />
                ))}
              </Tabs>
              
              {/* Quiz Controls - Only show for quiz tab */}
              {aiContent.activeTab === 'quiz' && (
                <QuizControls
                  video={video}
                  questionCount={quizInteraction.questionCount}
                  setQuestionCount={quizInteraction.setQuestionCount}
                  onGenerateQuiz={quizInteraction.handleGenerateQuiz}
                  isGenerating={quizInteraction.quizMutation.isPending}
                />
              )}
              
              {/* Content Display Area */}
              <div className="custom-scrollbar overflow-y-auto pr-1 max-h-[calc(100vh-250px)]">
                <AIContentDisplay
                  activeTab={aiContent.activeTab}
                  video={video}
                  aiContent={aiContent.aiContent}
                  loadingTab={aiContent.loadingTab}
                  aiError={aiContent.aiError}
                  onGenerate={aiContent.handleGenerate}
                  quizInteraction={quizInteraction}
                />
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
