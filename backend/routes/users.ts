import express, { Request, Response } from 'express';
import { verifySupabaseSession } from '../middleware/auth.js';

const router = express.Router();

// Create user role after signup (called from frontend after user creation)
// This endpoint uses service client to bypass RLS since user might not be authenticated yet
router.post('/role', async (req: Request, res: Response) => {
  try {
    const supabaseUrl = req.app.locals.supabaseUrl;
    const supabaseServiceKey = req.app.locals.supabaseServiceKey;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    // Use service client to bypass RLS (needed during signup)
    const { createClient } = await import('@supabase/supabase-js');
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({ error: 'userId and role are required' });
    }

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "user" or "admin"' });
    }

    // Check if role already exists
    const { data: existingRole } = await serviceSupabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingRole) {
      // Update existing role - set both role and account_type
      const { data, error } = await serviceSupabase
        .from('user_roles')
        .update({ 
          role: role,
          account_type: role  // account_type should match role
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user role:', error);
        return res.status(500).json({ error: 'Failed to update user role', details: error.message });
      }

      return res.json(data);
    }

    // Create new role - set both role and account_type
    const { data, error } = await serviceSupabase
      .from('user_roles')
      .insert([{ 
        user_id: userId, 
        role: role,
        account_type: role  // account_type should match role
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating user role:', error);
      return res.status(500).json({ error: 'Failed to create user role', details: error.message });
    }

    res.status(201).json(data);
  } catch (error: any) {
    console.error('Error in POST /api/users/role:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get user role (authenticated)
router.get('/role', verifySupabaseSession, async (req: Request, res: Response) => {
  try {
    const supabaseUrl = req.app.locals.supabaseUrl;
    const supabaseServiceKey = req.app.locals.supabaseServiceKey;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    // Use service client to bypass RLS
    const { createClient } = await import('@supabase/supabase-js');
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await serviceSupabase
      .from('user_roles')
      .select('role, account_type')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user role:', error);
      return res.status(500).json({ error: 'Failed to fetch user role', details: error.message });
    }

    // Return account_type if available, otherwise role, otherwise 'user'
    const accountType = data?.account_type || data?.role || 'user';
    res.json({ role: accountType, account_type: accountType });
  } catch (error: any) {
    console.error('Error in GET /api/users/role:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Debug endpoint to check user's account type (authenticated)
router.get('/debug', verifySupabaseSession, async (req: Request, res: Response) => {
  try {
    const supabaseUrl = req.app.locals.supabaseUrl;
    const supabaseServiceKey = req.app.locals.supabaseServiceKey;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const userId = req.userId;
    const user = req.user;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    // Use service client to bypass RLS
    const { createClient } = await import('@supabase/supabase-js');
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get role from database
    const { data: roleData, error: roleError } = await serviceSupabase
      .from('user_roles')
      .select('role, account_type')
      .eq('user_id', userId)
      .single();

    // Get user metadata
    const userMetadata = user?.user_metadata || {};

    res.json({
      userId,
      email: user?.email,
      userMetadata: {
        accountType: userMetadata.accountType,
        role: userMetadata.role
      },
      databaseRole: roleData ? {
        role: roleData.role,
        account_type: roleData.account_type
      } : null,
      roleError: roleError ? {
        code: roleError.code,
        message: roleError.message
      } : null,
      reqUserRole: req.userRole,
      isAdmin: req.userRole === 'admin' || roleData?.account_type === 'admin' || roleData?.role === 'admin'
    });
  } catch (error: any) {
    console.error('Error in GET /api/users/debug:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

export default router;


