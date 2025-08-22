import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aiAPI } from '@/lib/api';
import { TabKey } from '@/utils/videoPlayerConstants';

export type AiContentState = { notes: string; summary: string; quiz: string; desc: string; };

// Helper function to format content as markdown
const formatAsMarkdown = (content: string, type: 'notes' | 'summary'): string => {
  if (!content) return content;
  
  // If content is already markdown-formatted, return as is
  if (content.includes('#') || content.includes('**') || content.includes('*') || content.includes('-')) {
    return content;
  }
  
  // Basic formatting for plain text content
  const lines = content.split('\n').filter(line => line.trim());
  
  if (type === 'summary') {
    return `# Summary\n\n${lines.map(line => `${line}\n`).join('\n')}`;
  }
  
  if (type === 'notes') {
    return `# Notes\n\n${lines.map(line => `- ${line}`).join('\n')}`;
  }
  
  return content;
};

export function useAIContent(videoId: string | undefined) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('notes');
  const [aiContent, setAiContent] = useState<AiContentState>({ 
    notes: '', summary: '', quiz: '', desc: '' 
  });
  const [loadingTab, setLoadingTab] = useState<TabKey | ''>('');
  const [aiError, setAiError] = useState<Partial<Record<TabKey, string>>>({});

  // AI Mutations
  const notesMutation = useMutation({ 
    mutationFn: () => aiAPI.generateNotes(videoId!, { format: 'detailed', provider: 'gemini' }), 
    onSuccess: (res) => { 
      const notesContent = res.data.notes?.content || 'No notes generated.';
      // Ensure content is formatted as markdown
      const formattedContent = formatAsMarkdown(notesContent, 'notes');
      setAiContent((prev) => ({ ...prev, notes: formattedContent })); 
      setAiError((prev) => ({ ...prev, notes: '' })); 
    }, 
    onError: (err: any) => { 
      setAiError((prev) => ({ ...prev, notes: err?.response?.data?.message || 'Failed to generate notes.' })); 
    }, 
    onSettled: () => setLoadingTab(''), 
  });
  
  const summaryMutation = useMutation({ 
    mutationFn: () => aiAPI.generateSummary(videoId!, 'gemini'), 
    onSuccess: (res) => { 
      const summaryContent = res.data.summary?.content || 'No summary generated.';
      // Ensure content is formatted as markdown
      const formattedContent = formatAsMarkdown(summaryContent, 'summary');
      setAiContent((prev) => ({ ...prev, summary: formattedContent })); 
      setAiError((prev) => ({ ...prev, summary: '' })); 
    }, 
    onError: (err: any) => { 
      setAiError((prev) => ({ ...prev, summary: err?.response?.data?.message || 'Failed to generate summary.' })); 
    }, 
    onSettled: () => setLoadingTab(''), 
  });

  // Content generation handler
  const handleGenerate = (tabKey: TabKey, video?: any) => { 
    setLoadingTab(tabKey); 
    
    if (tabKey === 'notes') {
      notesMutation.mutate();
    } else if (tabKey === 'summary') {
      summaryMutation.mutate();
    } else if (tabKey === 'desc') {
      setTimeout(() => { 
        setAiContent((prev) => ({ ...prev, desc: video?.description || 'No description.' })); 
        setLoadingTab(''); 
      }, 500);
    }
  };

  return {
    // State
    activeTab,
    setActiveTab,
    aiContent,
    loadingTab,
    aiError,
    
    // Handlers
    handleGenerate,
    
    // Mutations
    notesMutation,
    summaryMutation,
  };
}
