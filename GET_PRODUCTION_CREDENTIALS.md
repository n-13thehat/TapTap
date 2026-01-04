# 🔑 Get Your Production Credentials

Quick guide to get your Neon and Upstash credentials for Vercel deployment.

---

## 1️⃣ Get Neon Database URL

### Option A: From Neon Dashboard

1. **Go to**: https://console.neon.tech
2. **Sign in** with your account
3. **Select your project** (or create one if needed)
4. **Click "Connection Details"** or "Dashboard"
5. **Copy the connection string** - it looks like:
   ```
   postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Option B: Create New Neon Project (if needed)

1. Go to: https://console.neon.tech
2. Click "Create Project"
3. Name: `taptap-matrix-prod`
4. Region: Choose closest to your users (e.g., US East)
5. Click "Create"
6. Copy the connection string shown

### What to Copy:
- **DATABASE_URL**: The full connection string
- **DIRECT_URL**: Same as DATABASE_URL (for Prisma)

---

## 2️⃣ Get Upstash Redis Credentials

### Option A: From Upstash Dashboard

1. **Go to**: https://console.upstash.com
2. **Sign in** with your account
3. **Select your Redis database** (or create one)
4. **Click on the database name**
5. **Scroll to "REST API"** section
6. **Copy**:
   - `UPSTASH_REDIS_REST_URL` (e.g., https://xxx.upstash.io)
   - `UPSTASH_REDIS_REST_TOKEN` (long token string)

### Option B: Create New Upstash Database (if needed)

1. Go to: https://console.upstash.com
2. Click "Create Database"
3. Name: `taptap-matrix-prod`
4. Type: Regional
5. Region: Choose closest to your Vercel region
6. Click "Create"
7. Copy REST URL and REST Token

---

## 3️⃣ Add to Vercel

Once you have both credentials:

1. **Go to**: https://vercel.com/n-13thehats-projects/tap-tap/settings/environment-variables

2. **Add these variables**:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `DATABASE_URL` | Your Neon connection string | Production |
   | `DIRECT_URL` | Same as DATABASE_URL | Production |
   | `UPSTASH_REDIS_REST_URL` | Your Upstash URL | Production |
   | `UPSTASH_REDIS_REST_TOKEN` | Your Upstash token | Production |
   | `NEXTAUTH_URL` | `https://tap-tap.vercel.app` | Production |
   | `NEXTAUTH_SECRET` | `c0fYc76EdNAz2vE5DiyPTZZ9DNaTil6ncLQUkBfz6ck=` | Production |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://gffzfwfprcbwirsjdbvn.supabase.co` | Production |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (from .env.local) | Production |
   | `SUPABASE_SERVICE_ROLE_KEY` | (from .env.local) | Production |
   | `NEXT_PUBLIC_APP_URL` | `https://tap-tap.vercel.app` | Production |
   | `NODE_ENV` | `production` | Production |

3. **Click "Save"** for each variable

---

## 4️⃣ Migrate Database

After adding credentials, run migrations:

```bash
# Copy your Neon DATABASE_URL from above
$env:DATABASE_URL="postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Push schema to Neon
npm run prisma:push
```

You should see:
```
✔ Database synchronized with Prisma schema
✔ Generated Prisma Client
```

---

## 5️⃣ Deploy

### Option A: Redeploy in Vercel
1. Go to: https://vercel.com/n-13thehats-projects/tap-tap
2. Click "Deployments"
3. Click "..." menu on latest deployment
4. Click "Redeploy"

### Option B: Push to GitHub
```bash
git add .
git commit -m "Update production configuration"
git push
```

Vercel will auto-deploy!

---

## ✅ Verification

After deployment:

1. **Visit**: https://tap-tap.vercel.app
2. **Test**:
   - Homepage loads ✅
   - Can sign up/login ✅
   - Can upload a track ✅
   - Database works ✅
   - Redis caching works ✅

---

## 🚨 Troubleshooting

### "Can't find Neon project"
- Create a new one: https://console.neon.tech
- Free tier gives you 0.5 GB storage

### "Can't find Upstash database"
- Create a new one: https://console.upstash.com
- Free tier gives you 10K commands/day

### "Database connection failed"
- Check connection string has `?sslmode=require` at the end
- Check Neon database is not paused (visit dashboard to wake it)

### "Build failed on Vercel"
- Check build logs in Vercel dashboard
- TypeScript errors should be ignored (we have `ignoreBuildErrors: true`)

---

## 📞 Quick Links

- **Neon Console**: https://console.neon.tech
- **Upstash Console**: https://console.upstash.com
- **Vercel Dashboard**: https://vercel.com/n-13thehats-projects/tap-tap
- **Vercel Env Vars**: https://vercel.com/n-13thehats-projects/tap-tap/settings/environment-variables

---

**Need help? Let me know which step you're on!** 🚀

