import { Request, Response, NextFunction } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';

// Extend Express Request type to include custom properties
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: any;
      supabase?: SupabaseClient;
      userRole?: string;
    }
  }
}

// Authentication middleware for Express routes
export async function authenticateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  const supabaseUrl = req.app.locals.supabaseUrl;
  const supabaseAnonKey = req.app.locals.supabaseAnonKey || req.app.locals.supabaseServiceKey;
  const supabaseServiceKey = req.app.locals.supabaseServiceKey;
  const { createClient } = await import('@supabase/supabase-js');
  const authHeader = req.headers.authorization;
  
  // Try to get user ID from JWT token first
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    if (supabaseUrl && supabaseAnonKey) {
      try {
        // Create a client with the user's JWT token for RLS
        // Use anon key (not service key) so RLS policies apply
        const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          },
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        });
        
        // Verify token and get user
        const { data: { user }, error } = await userSupabase.auth.getUser();
        
        if (!error && user) {
          req.userId = user.id;
          req.user = user;
          req.userRole = user.user_metadata?.accountType || user.user_metadata?.role || 'user';
          // Store user-scoped Supabase client for this request (with user token)
          req.supabase = userSupabase;
          return next();
        }
      } catch (error) {
        console.error('Token verification error:', error);
      }
    }
  }
  
  // Fallback: use service key (bypasses RLS, less secure)
  if (supabaseUrl && supabaseServiceKey) {
    req.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  
  // Fallback to userId from query or body
  const userId = req.query.userId || req.body.userId;
  
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized - user ID or token required' });
    return;
  }
  
  req.userId = userId;
  next();
}

// Verify Supabase user session
export async function verifySupabaseSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Prefer a request-scoped client so routes can use req.supabase
  let supabase = req.supabase;
  const supabaseUrl = req.app.locals.supabaseUrl;
  const supabaseAnonKey = req.app.locals.supabaseAnonKey;
  const supabaseServiceKey = req.app.locals.supabaseServiceKey;

  if (!supabase) {
    // Try to reuse the app-level service client
    supabase = req.app.locals.supabase;
  }

  if (!supabase && supabaseUrl && (supabaseServiceKey || supabaseAnonKey)) {
    // Lazily create a client if none was attached yet
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
  }

  if (!supabase) {
    res.status(500).json({ error: 'Supabase not configured' });
    return;
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized - token required' });
    return;
  }
  
  const token = authHeader.substring(7);
  
  try {
    // Prefer a per-request client that carries the user token
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseWithToken = supabaseUrl && (supabaseAnonKey || supabaseServiceKey)
      ? createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false }
        })
      : supabase;

    // Set the auth token and get user
    const { data: { user }, error } = await supabaseWithToken.auth.getUser();
    
    if (error || !user) {
      res.status(401).json({ error: 'Unauthorized - invalid token' });
      return;
    }
    
    req.userId = user.id;
    req.user = user;
    
    // Check account_type from user_roles table first (most reliable)
    // Use service client to bypass RLS for this lookup
    let accountType = user.user_metadata?.accountType || user.user_metadata?.role || 'user';
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: roleData } = await serviceSupabase
          .from('user_roles')
          .select('account_type, role')
          .eq('user_id', user.id)
          .single();
        
        if (roleData?.account_type) {
          accountType = roleData.account_type;
        } else if (roleData?.role) {
          accountType = roleData.role;
        }
      } catch (roleError) {
        console.error('Error fetching user role from database:', roleError);
        // Fall back to metadata
      }
    }
    
    req.userRole = accountType;
    // Attach scoped client to the request for downstream routes
    req.supabase = supabaseWithToken;
    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(401).json({ error: 'Unauthorized - token verification failed' });
    return;
  }
}

