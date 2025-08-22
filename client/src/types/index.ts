/**
 * Common types used throughout the application
 */

// Re-export types from API
export * from '@/lib/api';

/**
 * Type for tab keys used in AI content tabs
 */
export type TabKey = 'notes' | 'summary' | 'quiz' | 'desc';

/**
 * Tab definition interface
 */
export interface TabDefinition {
  key: TabKey;
  label: string;
  icon: React.FC<any>; // Icon component
}

/**
 * AI Content state interface
 */
export interface AIContentState {
  notes: string;
  summary: string;
  quiz: string;
  desc: string;
}

/**
 * Quiz Score interface
 */
export interface QuizScore {
  correct: number;
  total: number;
  percentage: number;
}
