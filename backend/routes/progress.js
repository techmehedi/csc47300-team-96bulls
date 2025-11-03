import express from 'express';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Get all progress for a user
router.get('/', authenticateUser, async (req, res) => {
  try {
    const supabase = req.supabase || req.app.locals.supabase;
    const { userId } = req;
    
    if (!supabase) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching progress:', error);
      return res.status(500).json({ error: error.message });
    }
    
    const progress = data.map(p => ({
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
    
    res.json(progress);
  } catch (error) {
    console.error('Error in GET /api/progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get progress for a specific topic/difficulty
router.get('/:topic/:difficulty', authenticateUser, async (req, res) => {
  try {
    const supabase = req.supabase || req.app.locals.supabase;
    const { userId } = req;
    const { topic, difficulty } = req.params;
    
    if (!supabase) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('topic', topic)
      .eq('difficulty', difficulty)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Progress not found' });
      }
      return res.status(500).json({ error: error.message });
    }
    
    const progress = {
      id: data.id,
      userId: data.user_id,
      topic: data.topic,
      difficulty: data.difficulty,
      totalAttempted: data.total_attempted || 0,
      totalCorrect: data.total_correct || 0,
      totalTimeSpent: data.total_time_spent || 0,
      averageTime: data.average_time || 0,
      accuracy: data.accuracy || 0,
      streak: data.streak || 0,
      lastPracticed: data.last_practiced,
      masteryLevel: data.mastery_level,
      updatedAt: data.updated_at
    };
    
    res.json(progress);
  } catch (error) {
    console.error('Error in GET /api/progress/:topic/:difficulty:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update or create progress
router.post('/', authenticateUser, async (req, res) => {
  try {
    const supabase = req.supabase || req.app.locals.supabase;
    const { userId } = req;
    const { topic, difficulty, sessionData } = req.body;
    
    if (!supabase) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    if (!topic || !difficulty || !sessionData) {
      return res.status(400).json({ error: 'Topic, difficulty, and sessionData are required' });
    }
    
    // Get or create progress record
    let { data: progressData, error: fetchError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('topic', topic)
      .eq('difficulty', difficulty)
      .single();
    
    // Calculate new stats
    const results = sessionData.results || [];
    const correctAnswers = results.filter(r => r.isCorrect === true).length;
    const totalAttempted = (progressData?.total_attempted || 0) + results.length;
    const totalCorrect = (progressData?.total_correct || 0) + correctAnswers;
    const totalTimeSpent = (progressData?.total_time_spent || 0) + (sessionData.totalTime || 0);
    const accuracy = totalAttempted > 0 ? totalCorrect / totalAttempted : 0;
    
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
      mastery_level: calculateMasteryLevel(accuracy),
      updated_at: new Date().toISOString()
    };
    
    let result;
    if (progressData && !fetchError) {
      // Update existing
      const { data, error } = await supabase
        .from('user_progress')
        .update(progressUpdate)
        .eq('id', progressData.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Create new
      const { data, error } = await supabase
        .from('user_progress')
        .insert(progressUpdate)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }
    
    const progress = {
      id: result.id,
      userId: result.user_id,
      topic: result.topic,
      difficulty: result.difficulty,
      totalAttempted: result.total_attempted || 0,
      totalCorrect: result.total_correct || 0,
      totalTimeSpent: result.total_time_spent || 0,
      averageTime: result.average_time || 0,
      accuracy: result.accuracy || 0,
      streak: result.streak || 0,
      lastPracticed: result.last_practiced,
      masteryLevel: result.mastery_level,
      updatedAt: result.updated_at
    };
    
    res.status(progressData ? 200 : 201).json(progress);
  } catch (error) {
    console.error('Error in POST /api/progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function calculateMasteryLevel(accuracy) {
  if (accuracy >= 0.8) return 'expert';
  if (accuracy >= 0.6) return 'advanced';
  if (accuracy >= 0.4) return 'intermediate';
  return 'beginner';
}

export default router;

