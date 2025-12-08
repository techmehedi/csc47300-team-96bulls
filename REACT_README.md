# AI Interviewer - React Application

## 🚀 React Conversion Complete!

The application has been converted to **React with Client-Side Rendering (CSR)** to meet the final project requirements.

## 📋 Features Implemented

### ✅ Required Features

1. **React with CSR** - Full React app with client-side rendering
2. **React Router** - Dynamic routing with drill-down capabilities:
   - `/admin/users/:userId` - User profile and history
   - `/admin/sessions/:sessionId` - Session details
3. **Axios** - HTTP client for API communication
4. **Admin Authentication** - Two-tier admin system:
   - **Admin 1** - CRU privileges (Create, Read, Update)
   - **Admin 2** - Full CRUD + user management + see deleted records
5. **Soft Delete** - Records are flagged, not actually deleted
   - Admin 1 cannot see deleted records
   - Admin 2 can see and restore deleted records
6. **Full Admin Interface** - Complete CRUD operations for:
   - Users
   - Sessions
   - Questions
7. **Express Backend** - All business logic on API server

## 🛠️ Technology Stack

- **Frontend**: React 18 + Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Backend**: Express.js (Node.js)
- **Database**: Supabase (PostgreSQL)
- **Styling**: CSS3 (reusing existing styles)

## 📁 Project Structure

```
src/
├── components/          # Reusable React components
│   ├── Header.jsx
│   ├── Footer.jsx
│   └── LoadingSpinner.jsx
├── pages/              # Page components
│   ├── Home.jsx
│   ├── Login.jsx
│   ├── Signup.jsx
│   ├── Dashboard.jsx
│   ├── Practice.jsx
│   └── admin/          # Admin pages
│       ├── AdminLogin.jsx
│       ├── AdminDashboard.jsx
│       ├── UserManagement.jsx
│       ├── UserDetails.jsx       # Dynamic: /admin/users/:userId
│       ├── SessionManagement.jsx
│       ├── SessionDetails.jsx    # Dynamic: /admin/sessions/:sessionId
│       └── QuestionManagement.jsx
├── services/           # API service layer
│   ├── api.js          # Axios configuration
│   └── apiService.js   # API methods
├── context/            # React Context
│   └── AuthContext.jsx # Authentication state
├── App.jsx             # Main app with routes
└── main.jsx            # Entry point

backend/
├── routes/
│   ├── admin-auth.js   # Admin authentication
│   ├── admin-users.js  # User management with soft delete
│   ├── admin-stats.js  # Admin statistics
│   ├── sessions.js     # Updated with soft delete
│   └── ...
└── server.js           # Updated with admin routes
```

## 🚦 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Backend Server

```bash
npm start
# or for development with auto-reload:
npm run dev
```

Backend runs on `http://localhost:3000`

### 3. Start React Client

```bash
npm run client
```

React app runs on `http://localhost:5173`

### 4. Build for Production

```bash
npm run client:build
```

## 🔐 Admin Accounts

Create admin users in your Supabase database:

```sql
-- Create admin_users table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('admin1', 'admin2')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert admin users
INSERT INTO admin_users (user_id, role)
VALUES 
  ('your-user-id', 'admin1'),
  ('another-user-id', 'admin2');
```

## 🗃️ Database Schema Updates

Add soft delete columns to existing tables:

```sql
-- Add deleted_at column to users table
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;

-- Add deleted_at column to sessions table
ALTER TABLE sessions ADD COLUMN deleted_at TIMESTAMPTZ;

-- Add deleted_at column to questions table (if exists)
ALTER TABLE questions ADD COLUMN deleted_at TIMESTAMPTZ;
```

## 🎯 Admin Privileges

### Admin 1 (CRU)
- ✅ Create users, sessions, questions
- ✅ Read all data
- ✅ Update users, sessions, questions
- ❌ Cannot delete
- ❌ Cannot see deleted records
- ❌ Cannot create other admins

### Admin 2 (Full CRUD + Management)
- ✅ All Admin 1 privileges
- ✅ Delete records (soft delete)
- ✅ View deleted records
- ✅ Restore deleted records
- ✅ Create new admin users

## 📍 Dynamic Routes

### User Details
```
/admin/users/:userId
```
Shows:
- User profile information
- Practice history (all sessions)
- Statistics
- User ID in URL

### Session Details
```
/admin/sessions/:sessionId
```
Shows:
- Session information
- Associated user
- Questions attempted
- Results and scores
- Session ID in URL

## 🔄 API Endpoints

### Admin Authentication
- `POST /api/admin/auth/login` - Admin login
- `GET /api/admin/auth/me` - Get admin profile

### User Management
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/:userId` - Get user details
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:userId` - Update user
- `DELETE /api/admin/users/:userId` - Soft delete user
- `POST /api/admin/users/:userId/restore` - Restore user

### Session Management
- `GET /api/sessions` - List sessions
- `GET /api/sessions/:sessionId` - Get session details
- `DELETE /api/sessions/:sessionId` - Soft delete session
- `POST /api/sessions/:sessionId/restore` - Restore session

### Statistics
- `GET /api/admin/stats` - Get admin dashboard stats

## 📊 Demo Instructions

### 1. Show React Implementation
- Navigate through pages - all React components
- Show React DevTools
- Demonstrate CSR (view source - minimal HTML)

### 2. Show Dynamic Routing
- Click on a user → URL changes to `/admin/users/:userId`
- Click on a session → URL changes to `/admin/sessions/:sessionId`
- Show user history and drill-down functionality

### 3. Show Admin Roles
- Login as Admin 1 - show CRU only (no delete button)
- Login as Admin 2 - show full CRUD + deleted records

### 4. Show Soft Delete
- Delete a user/session as Admin 2
- Show it's hidden from Admin 1
- Show it's visible to Admin 2 with "Deleted" badge
- Restore the record

### 5. Show Code
- Show React components using Axios
- Show API routes with Express
- Show soft delete logic (deleted_at column)
- Show most work done on API server

## ✅ Requirements Checklist

- [x] React with CSR
- [x] React Router with dynamic routing
- [x] Axios for HTTP requests
- [x] Express backend
- [x] Admin authentication (2 levels)
- [x] Full CRUD interface
- [x] Soft delete (not actual deletion)
- [x] Most work done on API server
- [x] Admin 1: CRU only
- [x] Admin 2: Full CRUD + user management
- [x] Dynamic routes show user/session details
- [x] User ID and Session ID in URLs

## 🎓 Presentation Tips

1. Start with React app running
2. Show regular user flow first
3. Then admin login
4. Demonstrate CRUD operations
5. Show dynamic routing (click through to details)
6. Show difference between Admin 1 and Admin 2
7. Demonstrate soft delete
8. Show code structure and organization
9. Show backend API handling the logic

## 📝 Notes

- All original frontend code preserved in `frontend/` directory
- React app uses existing CSS from `frontend/css/main.css`
- Backend fully backward compatible
- Can run both versions side by side for comparison
- Database schema extensible for future features

## 🐛 Troubleshooting

If you encounter issues:

1. **Backend not connecting**: Check `.env` file and Supabase credentials
2. **CORS errors**: Backend configured for `localhost:5173`
3. **Missing data**: Run database migrations first
4. **Admin login fails**: Create admin users in `admin_users` table

## 🚀 Deployment

For production:

```bash
# Build React app
npm run client:build

# Serve from Express
# Add static file serving in server.js
```

Good luck with your demo! 🎉
