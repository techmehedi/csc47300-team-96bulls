// Authentication middleware for Express routes
export async function authenticateUser(req, res, next) {
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
    return res.status(401).json({ error: 'Unauthorized - user ID or token required' });
  }
  
  req.userId = userId;
  next();
}

// Verify Supabase user session
export async function verifySupabaseSession(req, res, next) {
  const supabase = req.app.locals.supabase;
  
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }
  
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - token required' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    // Set the auth token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized - invalid token' });
    }
    
    req.userId = user.id;
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(401).json({ error: 'Unauthorized - token verification failed' });
  }
}

