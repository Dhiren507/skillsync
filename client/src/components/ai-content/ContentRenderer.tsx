import React from 'react';
import { Chip } from '@heroui/react';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

interface ContentRendererProps {
  content: any;
  type: 'summary' | 'notes';
}

export default function ContentRenderer({ content, type }: ContentRendererProps) {
  if (type === 'summary') {
    return (
      <div className="space-y-4">
        <div className="bg-content1 p-4 rounded-lg">
          <h4 className="font-semibold text-lg mb-3 text-primary flex items-center gap-2">
            <span>📝</span> AI Summary
          </h4>
          <MarkdownRenderer 
            content={content.content} 
            className="text-foreground" 
          />
        </div>
        
        {content.keyPoints && content.keyPoints.length > 0 && (
          <div className="bg-content1 p-4 rounded-lg">
            <h4 className="font-semibold text-lg mb-3 text-primary flex items-center gap-2">
              <span>🔑</span> Key Points
            </h4>
            <div className="space-y-2">
              {content.keyPoints.map((point: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <MarkdownRenderer 
                    content={point} 
                    className="text-foreground flex-1" 
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="text-center">
          <Chip color="success" variant="flat" size="sm">
            ✨ Summary generated with AI
          </Chip>
        </div>
      </div>
    );
  }

  if (type === 'notes') {
    return (
      <div className="space-y-4">
        <div className="bg-content1 p-4 rounded-lg">
          <h4 className="font-semibold text-lg mb-3 text-primary flex items-center gap-2">
            <span>📋</span> AI Notes ({content.format || 'markdown'})
          </h4>
          <MarkdownRenderer 
            content={content.content} 
            className="text-foreground" 
          />
        </div>
        
        {content.sections && content.sections.length > 0 && (
          <div className="bg-content1 p-4 rounded-lg">
            <h4 className="font-semibold text-lg mb-3 text-primary flex items-center gap-2">
              <span>📚</span> Structured Sections
            </h4>
            <div className="space-y-4">
              {content.sections.map((section: any, idx: number) => (
                <div key={idx} className="border-l-4 border-primary pl-4">
                  <h5 className="font-medium text-foreground mb-2">{section.title}</h5>
                  <MarkdownRenderer 
                    content={section.content} 
                    className="text-foreground text-sm" 
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="text-center">
          <Chip color="success" variant="flat" size="sm">
            ✨ Notes generated with {content.provider || 'AI'}
          </Chip>
        </div>
      </div>
    );
  }

  return null;
}
