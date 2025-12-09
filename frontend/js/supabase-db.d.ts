import type { Session, SessionCreateData, SessionUpdateData, Progress, Stats } from './types.js';
declare global {
    interface Window {
        SupabaseDB: typeof SupabaseDB;
        supabaseDB: SupabaseDB | null;
    }
}
declare class SupabaseDB {
    private client;
    constructor();
    createSession(sessionData: SessionCreateData): Promise<Session>;
    updateSession(sessionId: string, updates: SessionUpdateData): Promise<Session>;
    getUserSessions(userId: string): Promise<Session[]>;
    updateUserProgress(userId: string, session: Session): Promise<Progress>;
    getUserProgress(userId: string): Promise<Progress[]>;
    getUserStats(userId: string): Promise<Stats>;
    private mapSessionFromDB;
    private mapProgressFromDB;
    private calculateMasteryLevel;
    private calculateStreak;
}
export {};
