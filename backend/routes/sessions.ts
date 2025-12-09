import express, { Request, Response } from 'express';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Get all sessions for a user
router.get('/', authenticateUser, async (req: Request, res: Response) => {
  try {
    const supabase = req.supabase || req.app.locals.supabase;
    const { userId } = req;
    
    if (!supabase) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching sessions:', error);
      return res.status(500).json({ error: error.message });
    }
    
    // Map to frontend format
    const sessions = data.map((session: any) => ({
      id: session.id,
      userId: session.user_id,
      sessionType: session.session_type,
      topic: session.topic,
      difficulty: session.difficulty,
      timeLimit: session.time_limit,
      questions: session.questions || [],
      startTime: session.start_time,
      endTime: session.end_time,
      totalTime: session.total_time || 0,
      status: session.status,
      results: session.results || [],
      score: session.score || 0,
      accuracy: session.accuracy || 0,
      createdAt: session.created_at
    }));
    
    res.json(sessions);
  } catch (error: any) {
    console.error('Error in GET /api/sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific session
router.get('/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    const supabase = req.supabase || req.app.locals.supabase;
    const { userId } = req;
    const { id } = req.params;
    
    if (!supabase) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Session not found' });
      }
      return res.status(500).json({ error: error.message });
    }
    
    const session = {
      id: data.id,
      userId: data.user_id,
      sessionType: data.session_type,
      topic: data.topic,
      difficulty: data.difficulty,
      timeLimit: data.time_limit,
      questions: data.questions || [],
      startTime: data.start_time,
      endTime: data.end_time,
      totalTime: data.total_time || 0,
      status: data.status,
      results: data.results || [],
      score: data.score || 0,
      accuracy: data.accuracy || 0,
      createdAt: data.created_at
    };
    
    res.json(session);
  } catch (error: any) {
    console.error('Error in GET /api/sessions/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new session
router.post('/', authenticateUser, async (req: Request, res: Response) => {
  try {
    const supabase = req.supabase || req.app.locals.supabase;
    const { userId } = req;
    const { topic, difficulty, timeLimit, questions, sessionType } = req.body;
    
    if (!supabase) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    if (!topic || !difficulty) {
      return res.status(400).json({ error: 'Topic and difficulty are required' });
    }
    
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        session_type: sessionType || 'practice',
        topic: topic,
        difficulty: difficulty,
        time_limit: timeLimit,
        questions: questions || [],
        start_time: new Date().toISOString(),
        status: 'active',
        results: [],
        score: 0,
        accuracy: 0
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating session:', error);
      return res.status(500).json({ error: error.message });
    }
    
    const session = {
      id: data.id,
      userId: data.user_id,
      sessionType: data.session_type,
      topic: data.topic,
      difficulty: data.difficulty,
      timeLimit: data.time_limit,
      questions: data.questions || [],
      startTime: data.start_time,
      endTime: data.end_time,
      totalTime: data.total_time || 0,
      status: data.status,
      results: data.results || [],
      score: data.score || 0,
      accuracy: data.accuracy || 0,
      createdAt: data.created_at
    };
    
    res.status(201).json(session);
  } catch (error: any) {
    console.error('Error in POST /api/sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a session (for ending/completing)
router.put('/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    const supabase = req.supabase || req.app.locals.supabase;
    const { userId } = req;
    const { id } = req.params;
    const { endTime, status, results, totalTime, score, accuracy } = req.body;
    
    if (!supabase) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const updates: any = {};
    if (endTime !== undefined) updates.end_time = endTime;
    if (status !== undefined) updates.status = status;
    if (results !== undefined) updates.results = results;
    if (totalTime !== undefined) updates.total_time = totalTime;
    if (score !== undefined) updates.score = score;
    if (accuracy !== undefined) updates.accuracy = accuracy;
    updates.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('sessions')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Session not found' });
      }
      console.error('Error updating session:', error);
      return res.status(500).json({ error: error.message });
    }
    
    const session = {
      id: data.id,
      userId: data.user_id,
      sessionType: data.session_type,
      topic: data.topic,
      difficulty: data.difficulty,
      timeLimit: data.time_limit,
      questions: data.questions || [],
      startTime: data.start_time,
      endTime: data.end_time,
      totalTime: data.total_time || 0,
      status: data.status,
      results: data.results || [],
      score: data.score || 0,
      accuracy: data.accuracy || 0,
      createdAt: data.created_at
    };
    
    res.json(session);
  } catch (error: any) {
    console.error('Error in PUT /api/sessions/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a session
router.delete('/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    const supabase = req.supabase || req.app.locals.supabase;
    const { userId } = req;
    const { id } = req.params;
    
    if (!supabase) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error deleting session:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ message: 'Session deleted successfully' });
  } catch (error: any) {
    console.error('Error in DELETE /api/sessions/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

