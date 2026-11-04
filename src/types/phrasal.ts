export type MasteryLevel = 'new' | 'learning' | 'mastered';

export interface VerbMeaning {
  id: string;
  meaningNumber: number;
  usageNote?: string;
  explanation: string;
  examples: string[];
}

export interface PhrasalVerb {
  id: string;
  verb: string;
  baseVerb: string;
  particle: string;
  wordCount: number;
  focusNumber: number;
  focusTitle: string;
  meanings: VerbMeaning[];
  tags: string[];
}

export interface FocusSection {
  focusNumber: number;
  title: string;
  verbs: PhrasalVerb[];
}

export interface UserProgress {
  mastery: Record<string, MasteryLevel>;
  bookmarks: string[];
  notes: Record<string, string>;
  quizHistory: {
    date: string;
    score: number;
    total: number;
    focusFilter: string;
  }[];
  lastStudiedVerbId?: string;
}

export interface QuizQuestion {
  id: string;
  type: 'sentence-blank' | 'meaning-match';
  verbId: string;
  verb: string;
  focusNumber: number;
  focusTitle: string;
  prompt: string;
  contextHint: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  fullExample: string;
}
