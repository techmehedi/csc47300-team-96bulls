# Authentication Testing Guide

This project includes comprehensive tests to verify authentication functionality.

## Test Files

### 1. Browser-Based Test Suite (`frontend/test-auth.html`)

A visual, interactive test suite that runs in your browser. This is the easiest way to test authentication.

**How to run:**
1. Open `frontend/test-auth.html` in your browser
2. Click "Run All Tests" to execute all tests
3. Review the results in the visual interface

**What it tests:**
- ✅ Environment configuration (Supabase URL/Key)
- ✅ Supabase client initialization
- ✅ Authentication system initialization
- ✅ Form validation
- ✅ Login functionality
- ✅ Signup functionality
- ✅ Session management
- ✅ Error handling

**Features:**
- Real-time test results
- Visual pass/fail indicators
- Manual test forms for login/signup
- Detailed console logging

### 2. TypeScript Unit Tests (`frontend/ts/auth.test.ts`)

Unit tests written in TypeScript using Jest. These can be run from the command line.

**How to run:**
```bash
# Install test dependencies (if not already installed)
npm install --save-dev jest @types/jest ts-jest

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

**What it tests:**
- Environment configuration
- Login functionality (success, failure, network errors)
- Signup functionality (success, duplicate email)
- Form validation (email, password, username)
- Session management (localStorage)
- Error handling
- User data mapping

## Manual Testing Checklist

### Login Tests
- [ ] Login with valid credentials → Should redirect to dashboard
- [ ] Login with invalid email → Should show error message
- [ ] Login with invalid password → Should show error message
- [ ] Login with missing fields → Should show validation error
- [ ] Login with network offline → Should show network error
- [ ] "Remember me" checkbox → Should persist session

### Signup Tests
- [ ] Signup with valid data → Should create account
- [ ] Signup with duplicate email → Should show error
- [ ] Signup with weak password → Should show validation error
- [ ] Signup with invalid email format → Should show error
- [ ] Signup with missing required fields → Should show validation error
- [ ] Email confirmation flow → Should send confirmation email

### Session Tests
- [ ] Login persists session → Refresh page, should stay logged in
- [ ] Logout clears session → Should redirect to login
- [ ] Session timeout → Should handle expired sessions
- [ ] Multiple tabs → Should sync session across tabs

### Error Handling Tests
- [ ] Invalid Supabase URL → Should show configuration error
- [ ] Missing Supabase key → Should show configuration error
- [ ] Network errors → Should show user-friendly error
- [ ] API errors → Should display error message

## Debugging Tips

### Check Browser Console
Open browser DevTools (F12) and check the console for:
- `=== LOGIN ATTEMPT STARTED ===`
- `Supabase client initialized successfully`
- `Login API call successful`
- Any error messages

### Verify Configuration
Run in browser console:
```javascript
console.log('Supabase URL:', window.SUPABASE_URL);
console.log('Supabase Key:', window.SUPABASE_ANON_KEY ? 'Present' : 'Missing');
console.log('Supabase Client:', window.supabaseClient ? 'Initialized' : 'Not initialized');
```

### Common Issues

1. **"Supabase is not initialized"**
   - Check that `supabase-config.js` loads before `supabaseClient.js`
   - Verify Supabase CDN script is loaded
   - Check browser console for loading errors

2. **"Invalid login credentials"**
   - Verify user exists in Supabase
   - Check email confirmation status
   - Verify password is correct

3. **"Network error"**
   - Check internet connection
   - Verify Supabase URL is correct
   - Check CORS settings in Supabase dashboard

4. **Tests not running**
   - Ensure all scripts load in correct order
   - Wait for Supabase client to initialize
   - Check for JavaScript errors in console

## Test Results

After running tests, you should see:
- ✅ All environment tests passing
- ✅ All client initialization tests passing
- ✅ All form validation tests passing
- ✅ Login/Signup functionality working

If any tests fail, check the console output for detailed error messages.

