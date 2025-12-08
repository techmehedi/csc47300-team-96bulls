# 🚀 Quick Start Guide

## One-Command Setup

Run backend and React app together:

```bash
npm run full
```

This starts:
- Backend API on `http://localhost:3000`
- React app on `http://localhost:5173`

## Or Run Separately

**Terminal 1 - Backend:**
```bash
npm start
```

**Terminal 2 - React App:**
```bash
npm run client
```

## First Time Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup database:**
   - Open Supabase SQL Editor
   - Run `backend/migrations/001_react_admin_features.sql`

3. **Create admin users:**
   ```sql
   -- In Supabase SQL Editor
   INSERT INTO admin_users (user_id, role)
   VALUES 
     ('your-admin1-user-id', 'admin1'),
     ('your-admin2-user-id', 'admin2');
   ```

4. **Start the app:**
   ```bash
   npm run full
   ```

5. **Open browser:**
   - Visit `http://localhost:5173`

## 🎯 Test Admin Features

1. **Navigate to**: `http://localhost:5173/admin/login`
2. **Login as Admin 1** or **Admin 2**
3. **Try features**:
   - User management
   - Session management
   - Dynamic routing (click on users/sessions)
   - Soft delete (Admin 2 only)

## 📚 More Documentation

- **Complete Demo Script**: See `DEMO_GUIDE.md`
- **Requirements Checklist**: See `FINAL_CHECKLIST.md`
- **Full Documentation**: See `REACT_README.md`
- **Conversion Summary**: See `CONVERSION_SUMMARY.md`

## ✅ Verify Everything Works

Run through the `FINAL_CHECKLIST.md` before your demo!

---

**You're all set! Good luck!** 🎉
