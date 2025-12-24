# 🚀 Vercel Demo Setup - Quick Start

## Step-by-Step Guide

### 1️⃣ Open Vercel Dashboard

Go to [vercel.com/dashboard](https://vercel.com/dashboard) and select your
**doc-chain-client** project

### 2️⃣ Add Environment Variable

1. Click **Settings** (top navigation)
2. Click **Environment Variables** (left sidebar)
3. Add new variable:
   -  **Name:** `NEXT_PUBLIC_DEMO_MODE`
   -  **Value:** `true`
   -  **Environment:** Check ✅ **Production**
4. Click **Save**

### 3️⃣ Redeploy

**Option A: Automatic**

-  Git push to your main branch
-  Vercel will auto-deploy

**Option B: Manual**

1. Go to **Deployments** tab
2. Click **⋯** on latest deployment
3. Click **Redeploy**

### 4️⃣ Test It

Visit your site at `your-project.vercel.app/login`

You should see **"🎭 Demo Credentials"** box with:

-  Admin: admin@docchain.com / admin123
-  User: user@docchain.com / user123

## ✅ That's It!

Click the **Fill** button and **Sign in** to test.

---

## 🔒 Important Notes

-  ⚠️ Only use demo mode for testing/demo sites
-  For real production, set `NEXT_PUBLIC_DEMO_MODE=false` or remove the variable
-  Consider using separate Vercel projects for demo vs production

## 📸 Screenshot Guide

### Adding Environment Variable in Vercel:

```
Vercel Dashboard
  └─ Your Project
      └─ Settings
          └─ Environment Variables
              └─ Add New
                  Name: NEXT_PUBLIC_DEMO_MODE
                  Value: true
                  Environment: ✅ Production
                  [Save]
```

## 🎯 Current Setup

Since you're already on Vercel, just:

1. Add `NEXT_PUBLIC_DEMO_MODE=true`
2. Redeploy
3. Done! 🎉

## 🆘 Need Help?

Check the full guide: [DEMO_MODE.md](./DEMO_MODE.md)
