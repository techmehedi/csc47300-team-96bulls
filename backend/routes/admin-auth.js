import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const supabase = createClient(
      req.app.locals.supabaseUrl,
      req.app.locals.supabaseAnonKey
    );

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user has admin role
    const { data: profile, error: profileError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ error: 'Not authorized as admin' });
    }

    res.json({
      token: data.session.access_token,
      admin: {
        id: data.user.id,
        email: data.user.email,
        role: profile.role, // 'admin1' or 'admin2'
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get admin profile
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const supabase = createClient(
      req.app.locals.supabaseUrl,
      req.app.locals.supabaseAnonKey
    );

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { data: profile } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .single();

    res.json({
      id: user.id,
      email: user.email,
      role: profile?.role || 'admin1',
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

export default router;
