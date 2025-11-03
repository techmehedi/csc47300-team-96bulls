// Supabase database operations for sessions and progress
class SupabaseDB {
  constructor() {
    this.client = window.supabaseClient;
  }

  // Sessions
  async createSession(sessionData) {
    if (!this.client) throw new Error('Supabase client not initialized');
    
    const { data, error } = await this.client
      .from('sessions')
      .insert({
        user_id: sessionData.userId,
        session_type: sessionData.sessionType || 'practice',
        topic: sessionData.topic,
        difficulty: sessionData.difficulty,
        time_limit: sessionData.timeLimit,
        questions: sessionData.questions || [],
        start_time: new Date().toISOString(),
        status: 'active',
        results: [],
        score: 0,
        accuracy: 0
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapSessionFromDB(data);
  }

  async updateSession(sessionId, updates) {
    if (!this.client) throw new Error('Supabase client not initialized');
    
    console.log('Updating session in Supabase:', sessionId, updates);
    
    const dbUpdates = {};
    if (updates.endTime) dbUpdates.end_time = updates.endTime;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.results) dbUpdates.results = updates.results; // Store as JSONB
    if (updates.totalTime !== undefined) dbUpdates.total_time = updates.totalTime;
    if (updates.score !== undefined) dbUpdates.score = updates.score;
    if (updates.accuracy !== undefined) dbUpdates.accuracy = updates.accuracy;
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await this.client
      .from('sessions')
      .update(dbUpdates)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating session in Supabase:', error);
      throw error;
    }
    
    console.log('Session updated in Supabase successfully:', data.id);
    return this.mapSessionFromDB(data);
  }

  async getUserSessions(userId) {
    if (!this.client) throw new Error('Supabase client not initialized');
    
    const { data, error } = await this.client
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(s => this.mapSessionFromDB(s));
  }

  // Progress
  async updateUserProgress(userId, session) {
    if (!this.client) throw new Error('Supabase client not initialized');

    const topic = session.topic;
    const difficulty = session.difficulty;

    console.log('Updating user progress:', { userId, topic, difficulty, resultsCount: session.results?.length });

    // Get or create progress record
    let { data: progressData, error: fetchError } = await this.client
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('topic', topic)
      .eq('difficulty', difficulty)
      .single();

    // If no record exists and error is "not found", that's okay - we'll create one
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching progress:', fetchError);
      throw fetchError;
    }

    // Calculate new stats
    const correctAnswers = (session.results || []).filter(r => r.isCorrect === true).length;
    const resultsLength = session.results?.length || 0;
    const totalAttempted = (progressData?.total_attempted || 0) + resultsLength;
    const totalCorrect = (progressData?.total_correct || 0) + correctAnswers;
    const totalTimeSpent = (progressData?.total_time_spent || 0) + (session.totalTime || 0);
    const accuracy = totalAttempted > 0 ? totalCorrect / totalAttempted : 0;
    
    console.log('Progress stats:', { correctAnswers, totalAttempted, totalCorrect, totalTimeSpent, accuracy });

    const progressUpdate = {
      user_id: userId,
      topic: topic,
      difficulty: difficulty,
      total_attempted: totalAttempted,
      total_correct: totalCorrect,
      total_time_spent: totalTimeSpent,
      average_time: totalTimeSpent / totalAttempted,
      accuracy: accuracy,
      last_practiced: new Date().toISOString(),
      mastery_level: this.calculateMasteryLevel(accuracy),
      updated_at: new Date().toISOString()
    };

    if (progressData) {
      // Update existing
      const { data, error } = await this.client
        .from('user_progress')
        .update(progressUpdate)
        .eq('id', progressData.id)
        .select()
        .single();
      
      if (error) throw error;
      return this.mapProgressFromDB(data);
    } else {
      // Create new
      const { data, error } = await this.client
        .from('user_progress')
        .insert(progressUpdate)
        .select()
        .single();
      
      if (error) throw error;
      return this.mapProgressFromDB(data);
    }
  }

  async getUserProgress(userId) {
    if (!this.client) throw new Error('Supabase client not initialized');
    
    const { data, error } = await this.client
      .from('user_progress')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data.map(p => this.mapProgressFromDB(p));
  }

  async getUserStats(userId) {
    if (!this.client) throw new Error('Supabase client not initialized');

    const sessions = await this.getUserSessions(userId);
    const progress = await this.getUserProgress(userId);

    // Calculate total solved from completed sessions only
    const completedSessions = sessions.filter(s => s.status === 'completed' && s.results);
    const totalSolved = completedSessions.reduce((sum, session) => {
      const correctCount = session.results.filter(r => r.isCorrect === true).length;
      return sum + correctCount;
    }, 0);
    
    // Calculate total time from all sessions
    const totalTime = sessions.reduce((sum, session) => {
      return sum + (session.totalTime || 0);
    }, 0);
    
    // Calculate accuracy from completed sessions with results
    let accuracy = 0;
    if (completedSessions.length > 0) {
      const totalAccuracy = completedSessions.reduce((sum, session) => {
        if (session.results && session.results.length > 0) {
          const sessionAccuracy = session.results.filter(r => r.isCorrect === true).length / session.results.length;
          return sum + sessionAccuracy;
        }
        return sum;
      }, 0);
      accuracy = totalAccuracy / completedSessions.length;
    }

    const streak = this.calculateStreak(sessions);

    return {
      totalSolved: totalSolved || 0,
      totalTime: totalTime || 0,
      accuracy: Math.round(accuracy * 100) || 0,
      streak: streak || 0,
      progress: progress || []
    };
  }

  // Helper methods
  mapSessionFromDB(dbSession) {
    return {
      id: dbSession.id,
      userId: dbSession.user_id,
      sessionType: dbSession.session_type,
      topic: dbSession.topic,
      difficulty: dbSession.difficulty,
      timeLimit: dbSession.time_limit,
      questions: dbSession.questions || [],
      startTime: dbSession.start_time,
      endTime: dbSession.end_time,
      totalTime: dbSession.total_time || 0,
      status: dbSession.status,
      results: dbSession.results || [],
      score: dbSession.score || 0,
      accuracy: dbSession.accuracy || 0,
      createdAt: dbSession.created_at
    };
  }

  mapProgressFromDB(dbProgress) {
    return {
      id: dbProgress.id,
      userId: dbProgress.user_id,
      topic: dbProgress.topic,
      difficulty: dbProgress.difficulty,
      totalAttempted: dbProgress.total_attempted,
      totalCorrect: dbProgress.total_correct,
      totalTimeSpent: dbProgress.total_time_spent,
      averageTime: dbProgress.average_time,
      accuracy: dbProgress.accuracy,
      streak: dbProgress.streak || 0,
      lastPracticed: dbProgress.last_practiced,
      masteryLevel: dbProgress.mastery_level,
      updatedAt: dbProgress.updated_at
    };
  }

  calculateMasteryLevel(accuracy) {
    if (accuracy >= 0.8) return 'expert';
    if (accuracy >= 0.6) return 'advanced';
    if (accuracy >= 0.4) return 'intermediate';
    return 'beginner';
  }

  calculateStreak(sessions) {
    if (sessions.length === 0) return 0;
    
    const sortedSessions = sessions
      .filter(s => s.status === 'completed' && s.endTime)
      .sort((a, b) => new Date(b.endTime) - new Date(a.endTime));
    
    if (sortedSessions.length === 0) return 0;
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const session of sortedSessions) {
      const sessionDate = new Date(session.endTime);
      sessionDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((currentDate - sessionDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
        currentDate = sessionDate;
      } else if (daysDiff > streak) {
        break;
      }
    }
    
    return streak;
  }
}

// Initialize when Supabase client is ready
window.SupabaseDB = SupabaseDB;
window.supabaseDB = null;

(function() {
  function initSupabaseDB() {
    if (window.supabaseClient) {
      window.supabaseDB = new SupabaseDB();
    } else {
      setTimeout(initSupabaseDB, 100);
    }
  }
  initSupabaseDB();
})();

