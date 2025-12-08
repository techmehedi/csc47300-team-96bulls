import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Get all users (with soft delete support)
router.get('/', async (req, res) => {
  try {
    const { includeDeleted } = req.query;
    
    const supabase = createClient(
      req.app.locals.supabaseUrl,
      req.app.locals.supabaseServiceKey
    );

    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (includeDeleted !== 'true') {
      query = query.is('deleted_at', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: error.message });
    }

    const users = data.map(user => ({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role || 'user',
      createdAt: user.created_at,
      deleted: !!user.deleted_at,
    }));

    res.json(users);
  } catch (error) {
    console.error('Error in GET /admin/users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const supabase = createClient(
      req.app.locals.supabaseUrl,
      req.app.locals.supabaseServiceKey
    );

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      role: data.role || 'user',
      createdAt: data.created_at,
      deleted: !!data.deleted_at,
    };

    res.json(user);
  } catch (error) {
    console.error('Error in GET /admin/users/:userId:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create user (Admin2 only - would need middleware)
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    
    const supabase = createClient(
      req.app.locals.supabaseUrl,
      req.app.locals.supabaseServiceKey
    );

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Create user profile
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        first_name: firstName,
        last_name: lastName,
        email,
        role: role || 'user',
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      role: data.role,
    });
  } catch (error) {
    console.error('Error in POST /admin/users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, email, role } = req.body;
    
    const supabase = createClient(
      req.app.locals.supabaseUrl,
      req.app.locals.supabaseServiceKey
    );

    const updates = {};
    if (firstName) updates.first_name = firstName;
    if (lastName) updates.last_name = lastName;
    if (email) updates.email = email;
    if (role) updates.role = role;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      role: data.role,
    });
  } catch (error) {
    console.error('Error in PUT /admin/users/:userId:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Soft delete user (Admin2 only)
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const supabase = createClient(
      req.app.locals.supabaseUrl,
      req.app.locals.supabaseServiceKey
    );

    const { data, error } = await supabase
      .from('users')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'User soft deleted successfully', id: userId });
  } catch (error) {
    console.error('Error in DELETE /admin/users/:userId:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Restore deleted user (Admin2 only)
router.post('/:userId/restore', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const supabase = createClient(
      req.app.locals.supabaseUrl,
      req.app.locals.supabaseServiceKey
    );

    const { data, error } = await supabase
      .from('users')
      .update({ deleted_at: null })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'User restored successfully', id: userId });
  } catch (error) {
    console.error('Error in POST /admin/users/:userId/restore:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
