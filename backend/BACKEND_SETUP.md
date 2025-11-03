# Express Backend Setup Guide

## 📋 Overview

The Express backend provides a RESTful API for the AI Interviewer application, serving as an intermediary between the frontend and Supabase database.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5500

# Supabase Configuration (same as frontend)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Optional: Use service role key for admin operations (more secure)
SUPABASE_SERVICE_KEY=your-service-role-key
```

### 3. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3000`

## 📡 API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Sessions
- `GET /api/sessions?userId={userId}` - Get all sessions for a user
- `GET /api/sessions/:id?userId={userId}` - Get a specific session
- `POST /api/sessions` - Create a new session
- `PUT /api/sessions/:id` - Update a session
- `DELETE /api/sessions/:id?userId={userId}` - Delete a session

### Progress
- `GET /api/progress?userId={userId}` - Get all progress for a user
- `GET /api/progress/:topic/:difficulty?userId={userId}` - Get progress for specific topic/difficulty
- `POST /api/progress` - Update or create progress

### Questions
- `GET /api/questions?topic={topic}&difficulty={difficulty}&limit={limit}` - Get questions
- `GET /api/questions/:id` - Get a specific question
- `GET /api/questions/meta/topics` - Get available topics

### Statistics
- `GET /api/stats?userId={userId}` - Get user statistics

## 🔐 Authentication

Currently, the API uses a simple `userId` query parameter or Authorization header for authentication. For production:

1. Use Supabase JWT tokens in the Authorization header
2. Verify tokens server-side using `verifySupabaseSession` middleware
3. Update routes to use `verifySupabaseSession` instead of `authenticateUser`

## 📁 Project Structure

```
backend/
├── middleware/
│   └── auth.js          # Authentication middleware
├── routes/
│   ├── sessions.js      # Session routes
│   ├── progress.js      # Progress routes
│   ├── questions.js     # Question routes
│   └── stats.js         # Statistics routes
server.js                 # Main server file
package.json              # Dependencies
.env                      # Environment variables (not in git)
```

## 🔄 Frontend Integration

The frontend automatically uses the Express backend if:
1. `backend-api.js` is loaded
2. `window.API_URL` is set (defaults to `http://localhost:3000/api`)
3. Backend server is running

The frontend falls back to direct Supabase calls if the backend is unavailable.

## 🛠️ Development

### Adding New Routes

1. Create a new route file in `backend/routes/`
2. Import and use it in `server.js`:
   ```javascript
   import newRoutes from './backend/routes/new.js';
   app.use('/api/new', newRoutes);
   ```

### Testing

Test endpoints using:
- Browser DevTools
- Postman
- curl
- Fetch API in console

Example:
```javascript
fetch('http://localhost:3000/api/health')
  .then(r => r.json())
  .then(console.log);
```

## 🚨 Troubleshooting

### Server won't start
- Check if port 3000 is already in use
- Verify all dependencies are installed (`npm install`)
- Check for syntax errors in `server.js`

### API calls fail
- Verify backend server is running
- Check CORS settings match your frontend URL
- Ensure Supabase credentials are correct in `.env`
- Check browser console for CORS errors

### Database errors
- Verify Supabase tables are created (run `supabase-schema.sql`)
- Check Row Level Security (RLS) policies allow your operations
- Ensure service role key is set for admin operations

## 📝 Notes

- The backend serves as an API layer over Supabase
- All data operations go through Supabase
- Frontend can work with or without the backend
- Backend provides centralized API, logging, and future business logic

