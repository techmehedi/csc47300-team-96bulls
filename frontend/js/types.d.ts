export interface FullSupabaseClient {
    from(table: string): any;
    auth: {
        persistSession: boolean;
        autoRefreshToken: boolean;
        storage: Storage;
        detectSessionInUrl: boolean;
        flowType: string;
        getSession(): Promise<{
            data: {
                session: {
                    user?: User;
                } | null;
            };
            error: any;
        }>;
        getUser(): Promise<{
            data: {
                user: User | null;
            };
            error: any;
        }>;
        onAuthStateChange(callback: (event: string, session: any) => void): {
            data: {
                subscription: any;
            };
        };
        signOut(): Promise<{
            error: any;
        }>;
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
declare global {
    interface Window {
        API_URL?: string;
        SUPABASE_URL?: string;
        SUPABASE_ANON_KEY?: string;
        supabaseClient?: any;
        addTestCase?: () => void;
        removeTestCase?: (btn: HTMLElement) => void;
    }
}
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
    timeLimit: number;
    questions: string[];
    startTime: string;
    endTime?: string;
    totalTime: number;
    status: 'active' | 'completed' | 'abandoned';
    results: SessionResult[];
    score: number;
    accuracy: number;
    createdAt: string;
}
export interface Progress {
    id: string;
    userId: string;
    topic: string;
    difficulty: 'easy' | 'medium' | 'hard';
    totalAttempted: number;
    totalCorrect: number;
    totalTimeSpent: number;
    averageTime: number;
    accuracy: number;
    streak: number;
    lastPracticed: string;
    masteryLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    updatedAt: string;
}
export interface Stats {
    totalSolved: number;
    totalTime: number;
    accuracy: number;
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
