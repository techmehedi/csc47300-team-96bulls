import type { Session, SessionCreateData, SessionUpdateData, Progress, ProgressUpdateData, Stats, Question, CodeExecutionResult } from './types.js';
declare global {
    interface Window {
        API_URL?: string;
        BACKEND_ENABLED?: boolean;
        supabaseClient?: any;
        BackendAPI: typeof BackendAPI;
        backendAPI: BackendAPI;
    }
}
declare class BackendAPI {
    private baseURL;
    private getAuthToken;
    private available;
    constructor();
    private pingBackend;
    private request;
    getSessions(userId: string): Promise<Session[]>;
    getSession(sessionId: string, userId: string): Promise<Session>;
    createSession(sessionData: SessionCreateData): Promise<Session>;
    updateSession(sessionId: string, updates: SessionUpdateData): Promise<Session>;
    deleteSession(sessionId: string, userId: string): Promise<void>;
    getProgress(userId: string): Promise<Progress[]>;
    getProgressByTopic(userId: string, topic: string, difficulty: string): Promise<Progress>;
    updateProgress(userId: string, progressData: ProgressUpdateData): Promise<Progress>;
    getQuestions(topic: string, difficulty: string, limit?: number): Promise<Question[]>;
    getQuestion(questionId: string): Promise<Question>;
    getTopics(): Promise<string[]>;
    getStats(userId: string): Promise<Stats>;
    executeCode(code: string, language?: string): Promise<CodeExecutionResult>;
}
export {};
