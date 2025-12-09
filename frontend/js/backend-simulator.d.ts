import type { Session, SessionResult, Progress, Stats, Question } from './types.js';
interface SessionData {
    userId: string;
    sessionType?: string;
    topic: string;
    difficulty: string;
    timeLimit: number;
    questions?: string[];
}
declare global {
    interface Window {
        BackendSimulator: typeof BackendSimulator;
    }
}
declare class BackendSimulator {
    private data;
    constructor();
    initializeData(): Promise<void>;
    loadJSON(filename: string): Promise<any>;
    authenticateUser(email: string, password: string): Promise<any>;
    registerUser(userData: any): Promise<any>;
    createSession(sessionData: SessionData): Promise<Session>;
    updateSession(sessionId: string, updates: Partial<Session>): Promise<Session>;
    endSession(sessionId: string, results: SessionResult[]): Promise<Session>;
    updateUserProgress(userId: string, session: Session): Promise<Progress>;
    getUserProgress(userId: string): Promise<Progress[]>;
    getUserSessions(userId: string): Promise<Session[]>;
    getUserStats(userId: string): Promise<Stats>;
    calculateStreak(sessions: Session[]): number;
    getQuestions(topic: string, difficulty: string, limit?: number): Promise<Question[]>;
    shuffleArray<T>(array: T[]): T[];
    saveData(filename: string, data: any): Promise<void>;
    loadData(filename: string): Promise<any>;
}
export {};
