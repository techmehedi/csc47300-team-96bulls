import express, { Request, Response } from 'express';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

interface SessionResult {
  isCorrect: boolean;
  [key: string]: any;
}

interface Session {
  status: string;
  results?: SessionResult[];
  total_time?: number;
  end_time?: string;
  [key: string]: any;
}

interface Progress {
  id: string;
  user_id: string;
  topic: string;
  difficulty: string;
  total_attempted?: number;
  total_correct?: number;
  total_time_spent?: number;
  average_time?: number;
  accuracy?: number;
  streak?: number;
  last_practiced?: string;
  mastery_level?: string;
  updated_at?: string;
}

// Get user statistics
router.get('/', authenticateUser, async (req: Request, res: Response) => {
  try {
    const supabase = req.supabase || req.app.locals.supabase;
    const { userId } = req;
    
    if (!supabase) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    // Get all sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId);
    
    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return res.status(500).json({ error: sessionsError.message });
    }
    
    // Get all progress
    const { data: progress, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId);
    
    if (progressError) {
      console.error('Error fetching progress:', progressError);
      return res.status(500).json({ error: progressError.message });
    }
    
    // Calculate stats from completed sessions
    const completedSessions = (sessions || []).filter((s: Session) => s.status === 'completed' && s.results);
    
    const totalSolved = completedSessions.reduce((sum: number, session: Session) => {
      const correctCount = (session.results || []).filter((r: SessionResult) => r.isCorrect === true).length;
      return sum + correctCount;
    }, 0);
    
    const totalTime = (sessions || []).reduce((sum: number, session: Session) => {
      return sum + (session.total_time || 0);
    }, 0);
    
    let accuracy = 0;
    if (completedSessions.length > 0) {
      const totalAccuracy = completedSessions.reduce((sum: number, session: Session) => {
        if (session.results && session.results.length > 0) {
          const sessionAccuracy = (session.results.filter((r: SessionResult) => r.isCorrect === true).length) / session.results.length;
          return sum + sessionAccuracy;
        }
        return sum;
      }, 0);
      accuracy = totalAccuracy / completedSessions.length;
    }
    
    const streak = calculateStreak(sessions || []);
    
    const mappedProgress = (progress || []).map((p: Progress) => ({
      id: p.id,
      userId: p.user_id,
      topic: p.topic,
      difficulty: p.difficulty,
      totalAttempted: p.total_attempted || 0,
      totalCorrect: p.total_correct || 0,
      totalTimeSpent: p.total_time_spent || 0,
      averageTime: p.average_time || 0,
      accuracy: p.accuracy || 0,
      streak: p.streak || 0,
      lastPracticed: p.last_practiced,
      masteryLevel: p.mastery_level,
      updatedAt: p.updated_at
    }));
    
    res.json({
      totalSolved: totalSolved || 0,
      totalTime: totalTime || 0,
      accuracy: Math.round(accuracy * 100) || 0,
      streak: streak || 0,
      progress: mappedProgress
    });
  } catch (error: any) {
    console.error('Error in GET /api/stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function calculateStreak(sessions: Session[]): number {
  if (sessions.length === 0) return 0;
  
  const sortedSessions = sessions
    .filter((s: Session) => s.status === 'completed' && s.end_time)
    .sort((a: Session, b: Session) => new Date(b.end_time!).getTime() - new Date(a.end_time!).getTime());
  
  if (sortedSessions.length === 0) return 0;
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  for (const session of sortedSessions) {
    const sessionDate = new Date(session.end_time!);
    sessionDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === streak) {
      streak++;
      currentDate = sessionDate;
    } else if (daysDiff > streak) {
      break;
    }
  }
  
  return streak;
}

export default router;

