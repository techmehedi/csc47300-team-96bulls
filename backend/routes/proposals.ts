import express, { Request, Response } from 'express';
import { verifySupabaseSession } from '../middleware/auth.js';

const router = express.Router();

interface QuestionProposal {
  id?: string;
  user_id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  test_cases: any[];
  constraints?: string[];
  examples?: any[];
  hints?: string[];
  solution?: string;
  time_complexity?: string;
  space_complexity?: string;
  tags?: string[];
  status?: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

// Submit a new question proposal (authenticated users)
router.post('/', verifySupabaseSession, async (req: Request, res: Response) => {
  try {
    const supabase = req.supabase;
    const serviceSupabase = req.app.locals.supabase || supabase;
    if (!serviceSupabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const {
      title,
      description,
      difficulty,
      topic,
      test_cases,
      constraints,
      examples,
      hints,
      solution,
      time_complexity,
      space_complexity,
      tags
    } = req.body;

    // Validation
    if (!title || !description || !difficulty || !topic || !test_cases || !Array.isArray(test_cases)) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, description, difficulty, topic, and test_cases are required' 
      });
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty. Must be easy, medium, or hard' });
    }

    if (test_cases.length === 0) {
      return res.status(400).json({ error: 'At least one test case is required' });
    }

    const proposal: QuestionProposal = {
      user_id: userId,
      title,
      description,
      difficulty,
      topic,
      test_cases,
      constraints: constraints || [],
      examples: examples || [],
      hints: hints || [],
      solution: solution || null,
      time_complexity: time_complexity || null,
      space_complexity: space_complexity || null,
      tags: tags || [],
      status: 'pending'
    };

    // Use service client to bypass RLS recursion on user_roles policies
    const { data, error } = await serviceSupabase
      .from('question_proposals')
      .insert([proposal])
      .select()
      .single();

    if (error) {
      console.error('Error creating proposal:', error);
      return res.status(500).json({ error: 'Failed to create proposal', details: error.message });
    }

    res.status(201).json(data);
  } catch (error: any) {
    console.error('Error in POST /api/proposals:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get proposals (public - no authentication required)
router.get('/', async (req: Request, res: Response) => {
  try {
    const supabaseUrl = req.app.locals.supabaseUrl;
    const supabaseServiceKey = req.app.locals.supabaseServiceKey;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    // Use service client to bypass RLS
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { status } = req.query;

    // Allow all authenticated users to see all proposals
    let query = supabase
      .from('question_proposals')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status && ['pending', 'approved', 'rejected'].includes(status as string)) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching proposals:', error);
      return res.status(500).json({ error: 'Failed to fetch proposals', details: error.message });
    }

    // Fetch user emails for proposals using service client
    const serviceSupabase = req.app.locals.supabase;
    const proposalsWithUsers = await Promise.all((data || []).map(async (proposal: any) => {
      try {
        if (supabaseUrl && supabaseServiceKey) {
          const { createClient } = await import('@supabase/supabase-js');
          const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);
          const { data: userData } = await serviceSupabase.auth.admin.getUserById(proposal.user_id);
          return {
            ...proposal,
            user: {
              email: userData?.user?.email || 'Unknown',
              raw_user_meta_data: userData?.user?.user_metadata || {}
            }
          };
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
      return {
        ...proposal,
        user: {
          email: 'Unknown',
          raw_user_meta_data: {}
        }
      };
    }));

    res.json(proposalsWithUsers);
  } catch (error: any) {
    console.error('Error in GET /api/proposals:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get a specific proposal (public - no authentication required)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const supabaseUrl = req.app.locals.supabaseUrl;
    const supabaseServiceKey = req.app.locals.supabaseServiceKey;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    // Use service client to bypass RLS
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { id } = req.params;

    // Allow anyone to view any proposal
    let query = supabase
      .from('question_proposals')
      .select('*')
      .eq('id', id)
      .single();

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching proposal:', error);
      return res.status(500).json({ error: 'Failed to fetch proposal', details: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Fetch user email using service client
    const supabaseUrlForUser = req.app.locals.supabaseUrl;
    const supabaseServiceKeyForUser = req.app.locals.supabaseServiceKey;
    try {
      if (supabaseUrlForUser && supabaseServiceKeyForUser) {
        const { createClient } = await import('@supabase/supabase-js');
        const serviceSupabase = createClient(supabaseUrlForUser, supabaseServiceKeyForUser);
        const { data: userData } = await serviceSupabase.auth.admin.getUserById(data.user_id);
        data.user = {
          email: userData?.user?.email || 'Unknown',
          raw_user_meta_data: userData?.user?.user_metadata || {}
        };
      } else {
        data.user = {
          email: 'Unknown',
          raw_user_meta_data: {}
        };
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      data.user = {
        email: 'Unknown',
        raw_user_meta_data: {}
      };
    }

    res.json(data);
  } catch (error: any) {
    console.error('Error in GET /api/proposals/:id:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Approve or reject a proposal (public - no authentication required)
router.patch('/:id/review', async (req: Request, res: Response) => {
  try {
    const supabaseUrl = req.app.locals.supabaseUrl;
    const supabaseServiceKey = req.app.locals.supabaseServiceKey;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    // Use service client to bypass RLS
    const { createClient } = await import('@supabase/supabase-js');
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);

    const { id } = req.params;
    const { status, admin_notes } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be "approved" or "rejected"' });
    }

    const updateData: any = {
      status,
      reviewed_by: null, // No user ID required - set to null since it's a UUID foreign key
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (admin_notes) {
      updateData.admin_notes = admin_notes;
    }

    // If approved, we could also add it to the question bank here
    // For now, we'll just update the status
    const { data, error } = await serviceSupabase
      .from('question_proposals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating proposal:', error);
      return res.status(500).json({ error: 'Failed to update proposal', details: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // If approved, add to question bank (neetcode-75.json or database)
    if (status === 'approved') {
      // TODO: Add logic to insert into question bank
      // This could involve adding to a questions table or updating JSON files
    }

    res.json(data);
  } catch (error: any) {
    console.error('Error in PATCH /api/proposals/:id/review:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Check if user is admin
router.get('/check/admin', verifySupabaseSession, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    // Always check database first (most reliable source)
    const supabaseUrl = req.app.locals.supabaseUrl;
    const supabaseServiceKey = req.app.locals.supabaseServiceKey;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase not configured for admin check');
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check database for account_type
    const { data: roleData, error: roleError } = await serviceSupabase
      .from('user_roles')
      .select('account_type, role')
      .eq('user_id', userId)
      .single();

    let isAdmin = false;
    
    if (roleData) {
      // Database has role - use account_type first, then role
      isAdmin = roleData.account_type === 'admin' || roleData.role === 'admin';
      console.log(`Admin check for user ${userId}: account_type=${roleData.account_type}, role=${roleData.role}, isAdmin=${isAdmin}`);
    } else if (roleError && roleError.code === 'PGRST116') {
      // No role found in database - check user metadata as fallback
      const userMetadata = req.user?.user_metadata || {};
      isAdmin = userMetadata.accountType === 'admin' || userMetadata.role === 'admin';
      console.log(`No role in database for user ${userId}, checking metadata: accountType=${userMetadata.accountType}, role=${userMetadata.role}, isAdmin=${isAdmin}`);
      console.warn(`User ${userId} has no role in database. They should sign up again or have their role created.`);
    } else {
      // Error querying database
      console.error('Error checking user role:', roleError);
      // Fallback to req.userRole or metadata
      isAdmin = req.userRole === 'admin' || req.user?.user_metadata?.accountType === 'admin';
    }

    res.json({ 
      isAdmin,
      debug: {
        userId,
        reqUserRole: req.userRole,
        databaseRole: roleData,
        userMetadata: req.user?.user_metadata
      }
    });
  } catch (error: any) {
    console.error('Error in GET /api/proposals/check/admin:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

export default router;

