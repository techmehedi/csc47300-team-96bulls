import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import sessionRoutes from './routes/sessions.js';
import progressRoutes from './routes/progress.js';
import questionsRoutes from './routes/questions.js';
import statsRoutes from './routes/stats.js';
import executeRoutes from './routes/execute.js';
import proposalsRoutes from './routes/proposals.js';
import usersRoutes from './routes/users.js';
import aiInterviewRoutes from './routes/ai-interview.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Warning: Supabase credentials not found in environment variables');
}

// Create a default client for admin operations (if needed)
const supabase: SupabaseClient | null = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Make Supabase config available to routes (client will be created per-request with user token)
app.locals.supabaseUrl = supabaseUrl;
app.locals.supabaseAnonKey = supabaseAnonKey;
app.locals.supabaseServiceKey = supabaseServiceKey;

// CORS configuration - MUST come before other middleware
// Allow both localhost and 127.0.0.1
const allowedOrigins: string[] = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Also allow localhost variants (for development)
    if (origin.includes('localhost:') || origin.includes('127.0.0.1:')) {
      return callback(null, true);
    }
    
    // For development, allow any localhost/127.0.0.1
    if (process.env.NODE_ENV !== 'production' && 
        (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware (after CORS)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make Supabase client available to routes (legacy, routes should use req.supabase from middleware)
app.locals.supabase = supabase;

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    supabase: supabase ? 'connected' : 'not configured'
  });
});

// API Routes
app.use('/api/sessions', sessionRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/execute', executeRoutes);
app.use('/api/proposals', proposalsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/ai-interview', aiInterviewRoutes);

// Error handling middleware
app.use(((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status((err as any).status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}) as ErrorRequestHandler);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
  if (!supabase) {
    console.warn('⚠️  Supabase not configured - set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env');
  }
});

export default app;

