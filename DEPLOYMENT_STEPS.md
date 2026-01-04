# 🚀 TapTap Matrix - Production Deployment Guide

**Follow these steps in order to deploy to production.**

---

## ✅ Step 1: Get Neon Database Credentials (2 minutes)

### Instructions:

1. **Open Neon Console:**
   👉 https://console.neon.tech

2. **Sign in or Create Account**
   - Use your GitHub account for easy login

3. **Create New Project:**
   - Click **"Create Project"**
   - Name: `taptap-production`
   - Region: **US East (Ohio)** or closest to you
   - PostgreSQL version: **16** (latest)
   - Click **"Create Project"**

4. **Copy Connection String:**
   - After creation, you'll see a connection string
   - Click **"Copy"** next to the connection string
   - It looks like:
     ```
     postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```

5. **Save it temporarily:**
   - Paste it in a notepad
   - You'll need it for Step 2

---

## ✅ Step 2: Get Upstash Redis Credentials (2 minutes)

### Instructions:

1. **Open Upstash Console:**
   👉 https://console.upstash.com

2. **Sign in or Create Account**
   - Use your GitHub account for easy login

3. **Create New Database:**
   - Click **"Create Database"**
   - Name: `taptap-production`
   - Type: **Regional** (free tier)
   - Region: **US-EAST-1** (same as Neon)
   - Click **"Create"**

4. **Get REST API Credentials:**
   - Click on your new database
   - Go to **"REST API"** tab
   - Copy both:
     - **UPSTASH_REDIS_REST_URL** (e.g., `https://xxx-xxx.upstash.io`)
     - **UPSTASH_REDIS_REST_TOKEN** (long token string)

5. **Save them temporarily:**
   - Paste both in your notepad
   - You'll need them for Step 3

---

## ✅ Step 3: Add Environment Variables to Vercel (5 minutes)

### Instructions:

1. **Open Vercel Environment Variables:**
   👉 https://vercel.com/n-13thehats-projects/tap-tap/settings/environment-variables

2. **Add Variables One by One:**

   Click **"Add New"** for each variable below:

   ### Required Variables (Replace with your credentials):

   **DATABASE_URL**
   - Value: `[Paste your Neon connection string from Step 1]`
   - Environment: ✅ Production ✅ Preview ✅ Development

   **DIRECT_URL**
   - Value: `[Same as DATABASE_URL]`
   - Environment: ✅ Production ✅ Preview ✅ Development

   **UPSTASH_REDIS_REST_URL**
   - Value: `[Paste from Step 2]`
   - Environment: ✅ Production ✅ Preview ✅ Development

   **UPSTASH_REDIS_REST_TOKEN**
   - Value: `[Paste from Step 2]`
   - Environment: ✅ Production ✅ Preview ✅ Development

   ### NextAuth (Copy as-is):

   **NEXTAUTH_URL**
   - Value: `https://tap-tap.vercel.app`
   - Environment: ✅ Production only

   **NEXTAUTH_SECRET**
   - Value: `c0fYc76EdNAz2vE5DiyPTZZ9DNaTil6ncLQUkBfz6ck=`
   - Environment: ✅ Production ✅ Preview ✅ Development

   ### Supabase (Copy as-is):

   **NEXT_PUBLIC_SUPABASE_URL**
   - Value: `https://gffzfwfprcbwirsjdbvn.supabase.co`
   - Environment: ✅ Production ✅ Preview ✅ Development

   **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmZnpmd2ZwcmNid2lyc2pkYnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2Nzc0ODIsImV4cCI6MjA3NTI1MzQ4Mn0.bLs2jwnwFvoscQGJITeut0nHPLQl7ragK2Lz-MMC0k8`
   - Environment: ✅ Production ✅ Preview ✅ Development

   **SUPABASE_SERVICE_ROLE_KEY**
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmZnpmd2ZwcmNid2lyc2pkYnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY3NzQ4MiwiZXhwIjoyMDc1MjUzNDgyfQ.5Hk0veAkWfRhHiGActyy6QPYRfIVOl7vmOMa06Yoq98`
   - Environment: ✅ Production ✅ Preview ✅ Development

3. **Save All Variables**
   - Click **"Save"** after adding each one

---

## ✅ Step 4: Connect GitHub to Vercel (2 minutes)

### Instructions:

1. **Open Git Settings:**
   👉 https://vercel.com/n-13thehats-projects/tap-tap/settings/git

2. **Connect Repository:**
   - Click **"Connect Git Repository"**
   - Select **GitHub**
   - Choose: `n-13thehat/TapTap`
   - Production Branch: `master`
   - Click **"Connect"**

---

## ✅ Step 5: Deploy! (1 minute)

### Option A: Automatic Deploy (Recommended)

Vercel will automatically deploy when you push to GitHub. Since we just pushed, it should already be deploying!

**Check deployment status:**
👉 https://vercel.com/n-13thehats-projects/tap-tap

### Option B: Manual Deploy

If automatic deploy didn't trigger:

1. Go to: https://vercel.com/n-13thehats-projects/tap-tap
2. Click **"Deployments"** tab
3. Click **"Redeploy"** on the latest deployment
4. Or click **"Deploy"** button

---

## ✅ Step 6: Run Database Migrations (1 minute)

After deployment succeeds:

1. **Open Vercel Project:**
   👉 https://vercel.com/n-13thehats-projects/tap-tap

2. **Go to Deployments tab**

3. **Click on the latest deployment**

4. **Open the deployment URL** (e.g., `https://tap-tap.vercel.app`)

5. **The app will automatically run migrations on first load**

---

## 🎉 Step 7: Verify Deployment

### Test Your App:

1. **Visit:** https://tap-tap.vercel.app

2. **Test Sign Up:**
   - Click "Sign Up"
   - Create a test account
   - Verify email works

3. **Test Login:**
   - Log in with your test account
   - Check dashboard loads

4. **Test Basic Features:**
   - Upload a track (if applicable)
   - Browse library
   - Check player works

---

## 🎊 You're LIVE!

**Your app is now deployed at:**
👉 **https://tap-tap.vercel.app**

**Next Steps:**
- Add custom domain (optional)
- Set up monitoring (Sentry)
- Invite beta users
- Celebrate! 🎉

---

## 📝 Troubleshooting

### If deployment fails:

1. **Check build logs:**
   - Go to Vercel deployment
   - Click "View Build Logs"
   - Look for errors

2. **Verify environment variables:**
   - All required variables added?
   - Correct values?
   - Correct environments selected?

3. **Check database connection:**
   - Neon database is running?
   - Connection string is correct?
   - Firewall allows Vercel IPs?

### Need help?
- Check deployment logs
- Verify all environment variables
- Test database connection
- Contact me for assistance

---

**Created:** 2026-01-04  
**Status:** Ready to Deploy! 🚀

