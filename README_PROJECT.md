# 🤖 AI Interviewer Web App

## 📘 Project Description  
AI Interviewer is a comprehensive web application designed to help developers practice technical interviews through interactive coding challenges. The platform provides a structured learning environment with adaptive difficulty, real-time feedback, and detailed progress tracking.

**Key Technologies:** HTML5, CSS3, JavaScript (ES6+), Chart.js, Font Awesome Icons, Express.js, Supabase  
**Architecture:** Frontend + Express Backend + Supabase Database  
**Target Audience:** Software developers preparing for technical interviews

---

## 🚀 Features

### 🔐 Feature 1: User Authentication System  
**Description:**    
Complete user registration and login system with form validation, password strength checking, and secure session management.

**Key Components:**
- Email/password registration and login via Supabase
- Password strength validation with visual indicators
- Form validation with error handling
- Persistent session management across pages
- Secure token-based authentication

**Code Link:**    
[View Implementation](./login.html) | [Authentication Logic](./auth.js)

---

### 🎯 Feature 2: Interactive Practice Sessions  
**Description:**    
Comprehensive practice environment with customizable sessions, real-time timer, code editor, and intelligent question generation. Includes NeetCode 75 problems.

**Key Components:**
- Session configuration (topic, difficulty, time limit)
- Real-time timer with pause/resume functionality
- Code editor with syntax highlighting
- Question generation from NeetCode 75 and custom database
- Hint system and solution reveal
- Session results and performance analytics

**Code Link:**    
[View Implementation](./practice.html) | [Practice Logic](./practice.js)

---

### 📊 Feature 3: Progress Dashboard & Analytics  
**Description:**    
Advanced analytics dashboard providing detailed insights into user performance, progress tracking, and personalized recommendations. Features interactive charts and comprehensive statistics.

**Key Components:**
- Real-time statistics (streak, accuracy, time spent)
- Interactive progress charts using Chart.js
- Topic-wise performance analysis
- Goal setting and tracking
- Recent activity feed
- Achievement system

**Code Link:**    
[View Implementation](./dashboard.html) | [Dashboard Logic](./dashboard.js)

---

## 📄 Additional Information  

### 🛠️ Setup Instructions

#### Frontend Only
1. Clone the repository
2. Open `index.html` in a modern web browser
3. No additional setup required - all dependencies are CDN-hosted

#### With Express Backend (Recommended)
1. Install Node.js dependencies: `npm install`
2. Create `.env` file (see [BACKEND_SETUP.md](./BACKEND_SETUP.md))
3. Start backend: `npm run dev` or `npm start`
4. Open `index.html` in a browser
5. Backend will be used automatically if running

### 🔐 Supabase Authentication Setup
1. Create a project at Supabase (`https://supabase.com`) and go to Project Settings → API.
2. Copy your Project URL and anon public key.
3. Use a `.env` file:
   - Create a file named `.env` in the project root with:
     SUPABASE_URL=your-url
     SUPABASE_ANON_KEY=your-anon-key
   - Run `node inject-env.mjs` to generate `supabase-config.js` from `.env`.
   - Open the app as usual.
4. Set up Supabase Database:
   - In Supabase, go to SQL Editor.
   - Run the SQL commands from `supabase-schema.sql` to create the `sessions` and `user_progress` tables.
   - This enables storing practice sessions and progress in Supabase.
5. In Supabase Authentication settings:
   - Enable Email/Password sign in.
6. Session persistence is handled automatically - users stay logged in across page navigations.

Notes:
- The app uses Supabase sessions for authentication and mirrors minimal user info into `localStorage` for UI.
- `dashboard.html` requires an authenticated session and will redirect to `login.html` if not signed in.
- The dashboard fetches real data from Supabase when tables are set up, with fallback to local simulator.
- NeetCode 75 problems are included in `neetcode-75.json` with topics and difficulties.

### 💾 Data Storage
- **Primary:** Supabase PostgreSQL database (sessions, progress, user data)
- **Backend API:** Express.js server provides RESTful API over Supabase
- **Frontend:** Direct Supabase calls with backend API fallback
- **Questions:** NeetCode 75 problems in `neetcode-75.json` + custom questions in `data-structures.json`
- **Legacy:** Local storage used for session mirroring and UI state

### 🎨 Design Features
- Responsive design for all screen sizes
- Modern UI with smooth animations
- Accessibility-compliant navigation
- Mobile-first approach

### 🔧 Technical Implementation
- Pure JavaScript (no frameworks)
- Modular code architecture
- Express.js REST API backend
- Supabase for authentication and database
- Chart.js for data visualization
- Progressive enhancement (works with or without backend)

### 🌐 Backend API
- Express.js server running on port 3000 (configurable)
- RESTful API endpoints for sessions, progress, questions, and stats
- See [BACKEND_SETUP.md](./BACKEND_SETUP.md) for detailed API documentation
