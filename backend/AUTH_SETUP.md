# Authentication Setup Guide

## Simplified Authentication (No Email Verification)

This guide explains how to set up authentication without email verification and enable admin/user account types.

## 1. Supabase Configuration

### Disable Email Confirmation

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Settings**
3. Under **Email Auth**, find **"Enable email confirmations"**
4. **Disable** this option (uncheck the box)
5. Save the changes

This allows users to sign up and immediately log in without email verification.

### Alternative: Auto-Confirm Users

If you prefer to keep email confirmation enabled but auto-confirm users:

1. Go to **Authentication** → **Settings**
2. Under **Email Auth**, enable **"Enable email confirmations"**
3. In your Supabase SQL Editor, run:

```sql
-- Auto-confirm all new users (optional - only if you want to keep email confirmation enabled)
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;
```

**Note:** We recommend disabling email confirmation entirely for simplicity.

## 2. Database Setup

Run the SQL schema in your Supabase SQL Editor:

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy and paste the contents of `backend/config/supabase-schema.sql`
3. Click **Run**

This will create:
- `question_proposals` table
- `user_roles` table
- Automatic role creation trigger (defaults to 'user')
- All necessary RLS policies

## 3. Account Types

### Default Behavior

- All new users are automatically assigned the **'user'** role
- Users can select **'admin'** or **'user'** during signup
- The selected role is stored in the `user_roles` table

### Making a User an Admin

#### Option 1: During Signup
- Select "Admin" in the account type dropdown when signing up
- The role will be automatically created

#### Option 2: Manually via SQL
```sql
-- Make a specific user an admin
UPDATE user_roles 
SET role = 'admin' 
WHERE user_id = 'USER_ID_HERE';

-- Or insert if role doesn't exist
INSERT INTO user_roles (user_id, role)
VALUES ('USER_ID_HERE', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

#### Option 3: Via Backend API
```bash
POST http://localhost:3000/api/users/role
Content-Type: application/json

{
  "userId": "USER_ID_HERE",
  "role": "admin"
}
```

## 4. Testing

1. **Sign up as a regular user:**
   - Go to `signup.html`
   - Select "User" as account type
   - Complete signup
   - You should be automatically logged in

2. **Sign up as an admin:**
   - Go to `signup.html`
   - Select "Admin" as account type
   - Complete signup
   - You should be automatically logged in
   - The admin panel link should appear in the dashboard

3. **Verify roles:**
   - Check the `user_roles` table in Supabase
   - All users should have a role entry

## 5. Features

### User Features
- Submit question proposals
- View own proposals
- Practice with questions

### Admin Features
- Review and approve/reject question proposals
- Access admin panel at `/admin.html`
- View all proposals (pending, approved, rejected)

## Troubleshooting

### Users not being auto-logged in after signup
- Check that email confirmation is disabled in Supabase settings
- Check browser console for errors
- Verify Supabase credentials are correct

### Admin panel not showing
- Verify user has 'admin' role in `user_roles` table
- Check browser console for API errors
- Ensure backend is running on port 3000

### Role not being created
- Check that the database trigger is installed
- Verify RLS policies allow role insertion
- Check backend logs for errors

## Security Notes

- The backend uses service key for role creation (bypasses RLS)
- Users can only view their own proposals (unless admin)
- Admins can view and modify all proposals
- RLS policies enforce data access restrictions


