// Shared types for AI Interviewer application

// Extended Supabase client interfaces
export interface FullSupabaseClient {
  from(table: string): any;
  auth: {
    persistSession: boolean;
    autoRefreshToken: boolean;
    storage: Storage;
    detectSessionInUrl: boolean;
    flowType: string;
    getSession(): Promise<{ data: { session: { user?: User } | null }; error: any }>;
    getUser(): Promise<{ data: { user: User | null }; error: any }>;
    onAuthStateChange(callback: (event: string, session: any) => void): { data: { subscription: any } };
    signOut(): Promise<{ error: any }>;
  };
}

export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    username?: string;
    firstName?: string;
    lastName?: string;
  };
}

// Global Window interface extensions
declare global {
  interface Window {
    API_URL?: string;
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
    supabaseClient?: any; // Use 'any' to avoid conflicts with other declarations
    addTestCase?: () => void;
    removeTestCase?: (btn: HTMLElement) => void;
  }
}

// Note: Global Window interface extensions are declared above

export interface SessionResult {
  questionId: string;
  isCorrect: boolean;
  timeSpent: number;
  attempts: number;
  hintsUsed: number;
  solution?: string;
}

export interface Session {
  id: string;
  userId: string;
  sessionType: 'practice' | 'mock-interview';
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number; // minutes, 0 for unlimited
  questions: string[]; // array of question IDs
  startTime: string; // ISO datetime string
  endTime?: string; // ISO datetime string
  totalTime: number; // seconds
  status: 'active' | 'completed' | 'abandoned';
  results: SessionResult[];
  score: number; // 0-100
  accuracy: number; // 0-1
  createdAt: string; // ISO datetime string
}

export interface Progress {
  id: string;
  userId: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  totalAttempted: number;
  totalCorrect: number;
  totalTimeSpent: number; // seconds
  averageTime: number; // seconds
  accuracy: number; // 0-1
  streak: number;
  lastPracticed: string; // ISO datetime string
  masteryLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  updatedAt: string; // ISO datetime string
}

export interface Stats {
  totalSolved: number;
  totalTime: number; // seconds
  accuracy: number; // 0-100 (percentage)
  streak: number;
  progress: Progress[];
}

export interface SessionCreateData {
  userId: string;
  sessionType?: 'practice' | 'mock-interview';
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  questions?: string[];
}

export interface SessionUpdateData {
  endTime?: string;
  status?: 'active' | 'completed' | 'abandoned';
  results?: SessionResult[];
  totalTime?: number;
  score?: number;
  accuracy?: number;
}

export interface ProgressUpdateData {
  userId: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  totalAttempted?: number;
  totalCorrect?: number;
  totalTimeSpent?: number;
  accuracy?: number;
}

export interface CodeExecutionResult {
  success: boolean;
  output: string | null;
  stderr: string | null;
  error: string | null;
  executionTime?: string | null;
}

export interface Question {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  hints?: string[];
  testCases?: any[];
  solution?: string;
}


