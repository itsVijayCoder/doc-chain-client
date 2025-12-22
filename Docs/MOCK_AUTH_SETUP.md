# Mock Authentication Setup

## Overview

Mock authentication has been added to allow easy testing of all dashboard pages
without requiring a backend API.

## Test Credentials

### Admin Account

-  **Email:** `admin@docchain.com`
-  **Password:** `admin123`
-  **Role:** `admin`
-  **Access:** Full access to all pages including Admin Dashboard

### Standard User Account

-  **Email:** `user@docchain.com`
-  **Password:** `user123`
-  **Role:** `user`
-  **Access:** User Dashboard and regular features (Admin Dashboard will
   redirect)

## How to Use

1. **Start the dev server:**

   ```bash
   npm run dev
   ```

2. **Navigate to login page:** Open http://localhost:3000/login

3. **Quick Login:**

   -  You'll see a "Test Credentials" section with both accounts
   -  Click "Fill" button next to the account you want to test
   -  Click "Sign in"

4. **Manual Login:**
   -  Enter email and password manually
   -  Click "Sign in"

## Features

### Login Page Enhancements

-  Added test credentials display box (development only)
-  "Fill" buttons to auto-populate login form
-  Clear visual indication this is for testing

### Mock Auth Service

-  Located in: `lib/services/authService.ts`
-  Simulates 500ms network delay for realistic testing
-  Returns proper user objects with correct roles
-  Generates mock tokens for session management
-  Validates credentials like a real API

### Environment Variables

-  **`.env.local`**: Local configuration (git-ignored)
-  **`.env.example`**: Template for configuration
-  **`NEXT_PUBLIC_USE_MOCK_AUTH`**: Toggle mock auth on/off

## Pages You Can Test

### After Login as Standard User:

-  ✅ `/dashboard` - User Dashboard
   -  Stats cards with trends
   -  Quick actions
   -  Recent activity feed
   -  AI suggestions
   -  Blockchain stats

### After Login as Admin:

-  ✅ `/dashboard` - User Dashboard
-  ✅ `/admin-dashboard` - Admin Dashboard
   -  System overview
   -  System health monitoring
   -  Admin activity log
   -  Additional metrics (API requests, database, sessions)

### Not Yet Implemented (Will show empty or placeholder):

-  `/documents` - Document management
-  `/shared` - Shared documents
-  `/favorites` - Favorite documents
-  `/trash` - Deleted documents
-  `/users` - User management (admin only)
-  `/settings` - Settings page

## Implementation Details

### Authentication Flow

1. **Login Request:**

   -  User submits credentials
   -  `authService.login()` checks if mock auth is enabled
   -  If enabled, validates against `MOCK_USERS` object
   -  Returns user object and mock token

2. **Token Storage:**

   -  Mock token stored in localStorage
   -  Format: `mock-admin-token-{timestamp}` or `mock-user-token-{timestamp}`

3. **Protected Routes:**

   -  `useAuth` hook checks for token
   -  Calls `authService.me()` to get current user
   -  Mock service returns user based on token type

4. **Admin Access:**
   -  Admin Dashboard checks `user.role === 'admin'`
   -  Redirects non-admin users to regular dashboard

### Files Modified

1. **`lib/services/authService.ts`**

   -  Added `MOCK_USERS` object
   -  Added `USE_MOCK_AUTH` flag
   -  Modified `login()` to handle mock auth
   -  Modified `me()` to return mock user data

2. **`components/auth/LoginForm.tsx`**

   -  Added test credentials display section
   -  Added "Fill" buttons for quick login
   -  Only visible in development mode

3. **`.env.local`** (created)

   -  Enabled mock auth by default
   -  Documented test credentials

4. **`.env.example`** (created)

   -  Template for environment configuration
   -  Documentation for all variables

5. **`README.md`** (updated)
   -  Added testing section
   -  Documented test credentials
   -  Added environment configuration info

## Switching to Real API

When ready to connect to a real backend:

1. Update `.env.local`:

   ```env
   NEXT_PUBLIC_USE_MOCK_AUTH=false
   NEXT_PUBLIC_API_URL=https://your-api-url.com/api
   ```

2. The auth service will automatically use real API calls

3. No code changes needed - it switches automatically

## Security Notes

-  Mock auth only works in development mode
-  Test credentials section only visible when `NODE_ENV === "development"`
-  Mock tokens are clearly prefixed with "mock-" to avoid confusion
-  Real production builds should have `NEXT_PUBLIC_USE_MOCK_AUTH=false`

## Next Steps

You can now:

1. Test both user and admin dashboards
2. Verify role-based access control
3. Check responsive design on different screen sizes
4. Test navigation between pages
5. Verify all components display correctly

When ready to proceed with Phase 4 (Document Management), all authentication
will be in place and working!
