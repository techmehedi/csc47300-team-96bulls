# 🏗️ Project Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER                                  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │           React App (http://localhost:5173)            │    │
│  │                                                          │    │
│  │  Components:                                            │    │
│  │  ├─ Header.jsx                                          │    │
│  │  ├─ Footer.jsx                                          │    │
│  │  └─ LoadingSpinner.jsx                                  │    │
│  │                                                          │    │
│  │  Pages:                                                 │    │
│  │  ├─ Home, About, Services, Contact                     │    │
│  │  ├─ Login, Signup                                       │    │
│  │  ├─ Dashboard, Practice                                 │    │
│  │  └─ Admin/                                              │    │
│  │     ├─ AdminLogin                                       │    │
│  │     ├─ AdminDashboard                                   │    │
│  │     ├─ UserManagement                                   │    │
│  │     ├─ UserDetails (/users/:userId) ← Dynamic Route   │    │
│  │     ├─ SessionManagement                               │    │
│  │     ├─ SessionDetails (/sessions/:sessionId) ← Dynamic│    │
│  │     └─ QuestionManagement                              │    │
│  │                                                          │    │
│  │  Services (Axios):                                      │    │
│  │  ├─ api.js (interceptors, config)                      │    │
│  │  └─ apiService.js (all API methods)                    │    │
│  │                                                          │    │
│  │  Context:                                               │    │
│  │  └─ AuthContext (user/admin state)                     │    │
│  │                                                          │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ↕ Axios HTTP                         │
└─────────────────────────────────────────────────────────────────┘

                              ↓

┌─────────────────────────────────────────────────────────────────┐
│             Express Backend (http://localhost:3000)              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                      server.js                          │    │
│  │  ├─ CORS middleware                                     │    │
│  │  ├─ JWT authentication                                  │    │
│  │  └─ Route handlers                                      │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ↓                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                   API Routes                            │    │
│  │                                                          │    │
│  │  User Routes:                                           │    │
│  │  ├─ POST /api/auth/login                               │    │
│  │  ├─ POST /api/auth/signup                              │    │
│  │  └─ GET  /api/auth/me                                  │    │
│  │                                                          │    │
│  │  Admin Routes:                                          │    │
│  │  ├─ POST /api/admin/auth/login                         │    │
│  │  ├─ GET  /api/admin/auth/me                            │    │
│  │  ├─ GET  /api/admin/stats                              │    │
│  │  ├─ GET  /api/admin/users                              │    │
│  │  ├─ GET  /api/admin/users/:userId ← Dynamic            │    │
│  │  ├─ POST /api/admin/users                              │    │
│  │  ├─ PUT  /api/admin/users/:userId                      │    │
│  │  ├─ DELETE /api/admin/users/:userId (soft)             │    │
│  │  └─ POST /api/admin/users/:userId/restore              │    │
│  │                                                          │    │
│  │  Session Routes:                                        │    │
│  │  ├─ GET  /api/sessions                                 │    │
│  │  ├─ GET  /api/sessions/:sessionId ← Dynamic            │    │
│  │  ├─ POST /api/sessions                                 │    │
│  │  ├─ PUT  /api/sessions/:sessionId                      │    │
│  │  ├─ DELETE /api/sessions/:sessionId (soft)             │    │
│  │  └─ POST /api/sessions/:sessionId/restore              │    │
│  │                                                          │    │
│  │  Other Routes:                                          │    │
│  │  ├─ /api/progress                                       │    │
│  │  ├─ /api/questions                                      │    │
│  │  └─ /api/stats                                          │    │
│  │                                                          │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ↓                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Business Logic Layer                       │    │
│  │  ├─ Authentication & Authorization                      │    │
│  │  ├─ Role-based Access Control (Admin1/Admin2)          │    │
│  │  ├─ Data Validation                                     │    │
│  │  ├─ Soft Delete Logic                                   │    │
│  │  └─ Error Handling                                      │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ↓                                     │
└─────────────────────────────────────────────────────────────────┘

                              ↓

┌─────────────────────────────────────────────────────────────────┐
│              Supabase (PostgreSQL Database)                      │
│                                                                  │
│  Tables:                                                         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ users                                                   │    │
│  │  ├─ id (UUID)                                           │    │
│  │  ├─ first_name, last_name, email                        │    │
│  │  ├─ role (user/admin1/admin2)                           │    │
│  │  ├─ created_at, updated_at                              │    │
│  │  └─ deleted_at ← Soft Delete Flag                       │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ sessions                                                │    │
│  │  ├─ id (UUID)                                           │    │
│  │  ├─ user_id (FK to users)                               │    │
│  │  ├─ topic, difficulty, status                           │    │
│  │  ├─ questions (JSONB)                                   │    │
│  │  ├─ results (JSONB)                                     │    │
│  │  ├─ score, accuracy, total_time                         │    │
│  │  ├─ created_at, updated_at                              │    │
│  │  └─ deleted_at ← Soft Delete Flag                       │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ admin_users                                             │    │
│  │  ├─ id (UUID)                                           │    │
│  │  ├─ user_id (FK to auth.users)                          │    │
│  │  ├─ role (admin1/admin2)                                │    │
│  │  └─ created_at, updated_at                              │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ user_progress                                           │    │
│  │  ├─ id, user_id, topic, difficulty                      │    │
│  │  ├─ total_attempted, total_correct                      │    │
│  │  └─ avg_time, last_practiced                            │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Examples

### Example 1: Admin 1 Views Users

```
1. Admin1 logs in
   → React: AdminLogin → POST /api/admin/auth/login
   → Express: Validates credentials
   → DB: Checks admin_users table (role = 'admin1')
   → Returns JWT token

2. Admin1 navigates to User Management
   → React: UserManagement → GET /api/admin/users
   → Express: Checks auth, filters out deleted (deleted_at IS NULL)
   → DB: SELECT * FROM users WHERE deleted_at IS NULL
   → Returns list of active users only

3. Admin1 clicks on a user
   → React Router: Navigate to /admin/users/:userId
   → React: UserDetails → GET /api/admin/users/:userId
   → Express: Fetches user data
   → DB: SELECT * FROM users WHERE id = :userId
   → Returns user profile + practice history
```

### Example 2: Admin 2 Soft Deletes User

```
1. Admin2 clicks delete button
   → React: UserManagement → DELETE /api/admin/users/:userId
   → Express: Checks role (must be admin2), performs soft delete
   → DB: UPDATE users SET deleted_at = NOW() WHERE id = :userId
   → User remains in DB but marked deleted

2. Admin2 enables "Show Deleted"
   → React: UserManagement → GET /api/admin/users?includeDeleted=true
   → Express: Returns all users including deleted
   → DB: SELECT * FROM users (no filter)
   → UI shows deleted users with badge

3. Admin2 restores user
   → React: UserManagement → POST /api/admin/users/:userId/restore
   → Express: Clears deleted flag
   → DB: UPDATE users SET deleted_at = NULL WHERE id = :userId
   → User becomes active again
```

### Example 3: Dynamic Routing

```
User clicks on session in UserDetails page:
1. React Router URL changes: /admin/users/abc123 
                         →   /admin/sessions/xyz789

2. React Router matches route: <Route path="/admin/sessions/:sessionId">

3. SessionDetails component:
   const { sessionId } = useParams(); // Gets 'xyz789' from URL

4. API call: GET /api/sessions/xyz789

5. Express route: router.get('/:id', ...) // :id = 'xyz789'

6. Returns session data with user link back to /admin/users/abc123

7. Full drill-down navigation!
```

## Technology Stack Flow

```
┌─────────────┐
│   Browser   │ ← User interacts here
└──────┬──────┘
       ↓
┌─────────────┐
│    React    │ ← Components render UI
│  (Vite)     │ ← Routing happens here
└──────┬──────┘
       ↓
┌─────────────┐
│    Axios    │ ← HTTP requests
│  (Service)  │ ← Auth tokens added
└──────┬──────┘
       ↓
┌─────────────┐
│   Express   │ ← Routes handle requests
│  (Node.js)  │ ← Business logic here
└──────┬──────┘
       ↓
┌─────────────┐
│  Supabase   │ ← Data persistence
│ (PostgreSQL)│ ← Soft deletes stored
└─────────────┘
```

## Key Architectural Decisions

1. **CSR (Client-Side Rendering)**
   - All pages rendered by React in browser
   - Better UX, faster navigation after initial load

2. **Service Layer Pattern**
   - API calls isolated in `apiService.js`
   - Easy to maintain and test
   - Single source of truth for endpoints

3. **Context API for State**
   - Global auth state available everywhere
   - No prop drilling
   - Easy role checking

4. **Soft Delete Pattern**
   - Data recovery capability
   - Audit trail maintained
   - Admin 2 exclusive feature

5. **Dynamic Routes**
   - RESTful URL structure
   - Shareable links
   - Proper SPA routing

6. **Most Work on Server**
   - React just displays data
   - Server handles validation, permissions
   - Business logic centralized

## Security Flow

```
Request → Axios Interceptor (adds JWT)
       → Express CORS check
       → Express Auth Middleware
       → Role-based Route Handler
       → Database (filtered by role)
       → Response
```

---

This architecture satisfies all final project requirements while maintaining clean separation of concerns and professional code organization! 🚀
