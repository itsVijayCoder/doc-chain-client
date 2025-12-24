# Demo Mode Setup Guide

This guide explains how to deploy DocChain with demo accounts enabled for UI
testing and demonstrations.

## 🎭 Demo Accounts

When demo mode is enabled, you can login with these credentials:

### Admin Account

-  **Email:** `admin@docchain.com`
-  **Password:** `admin123`
-  **Role:** Administrator
-  **Permissions:** Full access to all features

### Standard User Account

-  **Email:** `user@docchain.com`
-  **Password:** `user123`
-  **Role:** Viewer
-  **Permissions:** Standard user access

## 🚀 Enabling Demo Mode

### Option 1: Vercel Environment Variables

1. Go to your Vercel dashboard
2. Select your project
3. Navigate to: **Settings → Environment Variables**
4. Add the following variable:
   -  **Name:** `NEXT_PUBLIC_DEMO_MODE`
   -  **Value:** `true`
   -  **Environment:** Select "Production" (and "Preview" if desired)
5. Click **Save**
6. Redeploy: Go to **Deployments** → Select latest → Click **Redeploy**

### Option 2: Cloudflare Pages Environment Variables

1. Go to your Cloudflare Pages dashboard
2. Navigate to: **Settings → Environment Variables**
3. Add the following variable:
   ```
   NEXT_PUBLIC_DEMO_MODE=true
   ```
4. Redeploy your application

### Option 3: Local Production Build

1. Create `.env.production.local` file:

   ```bash
   cp .env.production.example .env.production.local
   ```

2. Edit `.env.production.local` and set:

   ```env
   NEXT_PUBLIC_DEMO_MODE=true
   ```

3. Build and start:
   ```bash
   npm run build
   npm start
   ```

### Option 4: Demo Deployment

For a dedicated demo environment:

```bash
# Use the demo environment file
npm run build
# Set NODE_ENV and load .env.demo
npm start
```

## 📋 Vercel Setup Steps

### Step 1: Set Environment Variables

In Vercel dashboard:

1. Go to **Settings → Environment Variables**
2. Add these variables:

| Variable Name               | Value  | Environment |
| --------------------------- | ------ | ----------- |
| `NEXT_PUBLIC_DEMO_MODE`     | `true` | Production  |
| `NEXT_PUBLIC_USE_MOCK_AUTH` | `true` | Production  |

3. Click **Save** for each variable

### Step 2: Redeploy

**Option A: Automatic (Recommended)**

-  Just push to your connected Git branch
-  Vercel will auto-deploy with new environment variables

**Option B: Manual**

-  Go to **Deployments** tab
-  Find the latest deployment
-  Click **⋯ (three dots)** → **Redeploy**

### Step 3: Verify

1. Visit your deployed URL
2. Go to the login page
3. You should see a "🎭 Demo Credentials" section
4. Click "Fill" on either Admin or Standard User
5. Click "Sign in"

## 🔒 Security Considerations

### ⚠️ IMPORTANT

-  **NEVER** enable `NEXT_PUBLIC_DEMO_MODE` on your real production environment
   with real user data
-  Demo mode should **only** be used for:
   -  UI testing
   -  Product demonstrations
   -  Staging environments
   -  Client previews

### Best Practices

1. **Separate Deployments:**

   -  Production: `docchain.com` (demo mode OFF)
   -  Demo: `demo.docchain.com` (demo mode ON)
   -  Staging: `staging.docchain.com` (demo mode ON)

2. **Environment Separation:**

   ```
   production.docchain.com  → NEXT_PUBLIC_DEMO_MODE=false
   demo.docchain.com        → NEXT_PUBLIC_DEMO_MODE=true
   staging.docchain.com     → NEXT_PUBLIC_DEMO_MODE=true
   ```

3. **Password Protection:**
   -  Use Cloudflare Access to add password protection to demo sites
   -  Settings → Access → Add Access Policy

## 🎬 What Demo Mode Does

When `NEXT_PUBLIC_DEMO_MODE=true`:

1. **Mock Authentication:**

   -  Login works without a backend API
   -  Demo credentials are accepted
   -  JWT tokens are simulated

2. **Credential Helper:**

   -  Shows demo credentials on login page
   -  "Fill" buttons auto-populate forms
   -  Easy testing without remembering passwords

3. **Development Features:**
   -  Same behavior as development mode
   -  All UI features visible and functional
   -  No real data storage (everything is mocked)

## 🔄 Disabling Demo Mode

### For Real Production:

1. Remove or set to false in Cloudflare Pages:

   ```
   NEXT_PUBLIC_DEMO_MODE=false
   ```

2. Or simply delete the environment variable

3. Redeploy

### Verification:

-  Visit login page
-  Demo credentials section should NOT appear
-  Only real authentication will work

## 📝 Usage Examples

### Example 1: Vercel (Demo Site)

```bash
# In Vercel dashboard:
# Settings → Environment Variables
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_USE_MOCK_AUTH=true
```

### Example 2: Vercel (Real Production)

```bash
# In Vercel dashboard:
# Settings → Environment Variables
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_API_URL=https://api.docchain.com
```

### Example 3: Cloudflare Pages (Demo Site)

```bash
# In Cloudflare Pages dashboard:
# Environment Variables → Production
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_USE_MOCK_AUTH=true
```

### Example 4: Cloudflare Pages (Real Production)

```bash
# In Cloudflare Pages dashboard:
# Environment Variables → Production
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_API_URL=https://api.docchain.com
```

### Example 5: Multiple Vercel Projects

Create separate Vercel projects:

1. **docchain-demo**

   -  Git Branch: `main`
   -  `NEXT_PUBLIC_DEMO_MODE=true`
   -  Custom domain: `demo.docchain.com`

2. **docchain-production**
   -  Git Branch: `production`
   -  `NEXT_PUBLIC_DEMO_MODE=false`
   -  Custom domain: `docchain.com`

### Example 6: Multiple Cloudflare Pages Projects

Create separate Cloudflare Pages projects:

1. **docchain-demo**

   -  Branch: `main`
   -  `NEXT_PUBLIC_DEMO_MODE=true`
   -  Custom domain: `demo.docchain.com`

2. **docchain-production**
   -  Branch: `production`
   -  `NEXT_PUBLIC_DEMO_MODE=false`
   -  Custom domain: `docchain.com`

## 🧪 Testing Demo Mode

1. **Local Test:**

   ```bash
   # Create .env.production.local
   echo "NEXT_PUBLIC_DEMO_MODE=true" > .env.production.local

   # Build and run
   npm run build
   npm start

   # Visit http://localhost:3000/login
   ```

2. **Verify Features:**
   -  [ ] Demo credentials visible on login
   -  [ ] Admin login works
   -  [ ] Standard user login works
   -  [ ] Dashboard loads
   -  [ ] All UI features accessible

## 💡 Tips

1. **Quick Login:** Use the "Fill" buttons for instant credential input
2. **Role Testing:** Switch between admin and standard user to test different
   permissions
3. **Session:** Logout and login to switch between accounts
4. **Mock Data:** All data is generated client-side, no backend needed

## 🐛 Troubleshooting

### Demo credentials not showing:

-  Check `NEXT_PUBLIC_DEMO_MODE=true` is set
-  Clear browser cache
-  Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
-  Check browser console for environment variable

### Login fails:

-  Ensure credentials exactly match (case-sensitive)
-  Check `NEXT_PUBLIC_USE_MOCK_AUTH=true` is set
-  Verify no real API is configured

### Vercel deployment issues:

-  Verify environment variables in Vercel dashboard (Settings → Environment
   Variables)
-  Check that variables are enabled for "Production" environment
-  Go to Deployments tab and check build logs
-  Try redeploying: Deployments → ⋯ → Redeploy

### Cloudflare deployment issues:

-  Verify environment variables in Cloudflare dashboard
-  Check build logs for errors
-  Ensure `npm run pages:build` succeeds locally

## 📚 Related Files

-  `lib/services/authService.ts` - Authentication logic
-  `components/auth/LoginForm.tsx` - Login UI with demo credentials
-  `.env.production.example` - Production environment template
-  `.env.demo` - Demo environment configuration

## 🔗 Useful Links

-  [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
-  [Vercel Deployments](https://vercel.com/docs/deployments/overview)
-  [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
-  [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
