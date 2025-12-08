import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Helper to create Supabase client
const getSupabase = (req) => {
    const supabaseUrl = req.app.locals.supabaseUrl;
    const supabaseAnonKey = req.app.locals.supabaseAnonKey;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase not configured');
    }

    return createClient(supabaseUrl, supabaseAnonKey);
};

// POST /api/auth/signup - Register a new user
router.post('/signup', async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const supabase = getSupabase(req);

        // Sign up with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                }
            }
        });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Return user data and session token
        res.status(201).json({
            user: {
                id: data.user?.id,
                email: data.user?.email,
                firstName: data.user?.user_metadata?.first_name,
                lastName: data.user?.user_metadata?.last_name,
            },
            token: data.session?.access_token,
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: error.message || 'Signup failed' });
    }
});

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const supabase = getSupabase(req);

        // Sign in with Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return res.status(401).json({ error: error.message });
        }

        res.json({
            user: {
                id: data.user?.id,
                email: data.user?.email,
                firstName: data.user?.user_metadata?.first_name,
                lastName: data.user?.user_metadata?.last_name,
            },
            token: data.session?.access_token,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message || 'Login failed' });
    }
});

// POST /api/auth/logout - Logout user
router.post('/logout', async (req, res) => {
    try {
        const supabase = getSupabase(req);
        await supabase.auth.signOut();
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
});

// GET /api/auth/me - Get current user
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const supabase = getSupabase(req);

        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        res.json({
            id: data.user.id,
            email: data.user.email,
            firstName: data.user.user_metadata?.first_name,
            lastName: data.user.user_metadata?.last_name,
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

export default router;
