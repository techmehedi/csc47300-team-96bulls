import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Get admin statistics
router.get('/', async (req, res) => {
  try {
    const supabase = createClient(
      req.app.locals.supabaseUrl,
      req.app.locals.supabaseServiceKey
    );

    // Get counts
    const [usersResult, sessionsResult] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('sessions').select('id', { count: 'exact', head: true }),
    ]);

    // Get active users (users with sessions in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: activeSessions } = await supabase
      .from('sessions')
      .select('user_id')
      .gte('created_at', sevenDaysAgo.toISOString());

    const activeUsers = new Set(activeSessions?.map(s => s.user_id) || []).size;

    res.json({
      totalUsers: usersResult.count || 0,
      totalSessions: sessionsResult.count || 0,
      totalQuestions: 75, // From NeetCode 75
      activeUsers,
    });
  } catch (error) {
    console.error('Error getting admin stats:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

export default router;
