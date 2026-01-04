# 🚀 TapTap Matrix - Production Deployment Guide

## Quick Start (Recommended: Vercel + Neon)

### Prerequisites
- [ ] GitHub account
- [ ] Vercel account (free tier works)
- [ ] Neon account (free tier works)
- [ ] Upstash account (free tier works)

---

## Step 1: Set Up Production Database (Neon)

### Why Neon?
- ✅ Free tier with 0.5GB storage
- ✅ Serverless PostgreSQL (perfect for Next.js)
- ✅ Auto-scaling
- ✅ Built-in connection pooling

### Setup Instructions:

1. **Go to [Neon](https://neon.tech)** and sign up
2. **Create a new project** called "taptap-matrix-prod"
3. **Copy your connection string** (looks like):
   ```
   postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. **Save this for later** - you'll need it for Vercel

---

## Step 2: Set Up Redis (Upstash)

### Why Upstash?
- ✅ Free tier with 10,000 commands/day
- ✅ Serverless Redis (perfect for Vercel)
- ✅ REST API (works in edge functions)

### Setup Instructions:

1. **Go to [Upstash](https://upstash.com)** and sign up
2. **Create a new Redis database** called "taptap-matrix-prod"
3. **Select region**: Choose closest to your users (e.g., US East)
4. **Copy REST URL and Token**:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
5. **Save these for later**

---

## Step 3: Deploy to Vercel

### Option A: Deploy via GitHub (Recommended)

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```

2. **Go to [Vercel](https://vercel.com)** and sign in with GitHub

3. **Import your repository**:
   - Click "Add New Project"
   - Select your TapTap Matrix repository
   - Click "Import"

4. **Configure Environment Variables**:
   Click "Environment Variables" and add these:

   ```env
   # Authentication
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

   # Database (from Neon)
   DATABASE_URL=<your-neon-connection-string>
   DIRECT_URL=<your-neon-connection-string>

   # Supabase (existing)
   NEXT_PUBLIC_SUPABASE_URL=<from .env.local>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<from .env.local>
   SUPABASE_SERVICE_ROLE_KEY=<from .env.local>

   # Redis (from Upstash)
   UPSTASH_REDIS_REST_URL=<from-upstash>
   UPSTASH_REDIS_REST_TOKEN=<from-upstash>

   # APIs (existing)
   OPENAI_API_KEY=<from .env.local>
   YOUTUBE_API_KEY=<from .env.local>

   # App
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   NODE_ENV=production
   ```

5. **Deploy**:
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete

6. **Run Database Migrations**:
   After deployment, run migrations from your local machine:
   ```bash
   # Set production DATABASE_URL temporarily
   $env:DATABASE_URL="<your-neon-connection-string>"
   npm run prisma:push
   ```

---

## Step 4: Post-Deployment Setup

### 1. Test Your Deployment
- Visit your Vercel URL
- Try signing up/logging in
- Upload a track
- Check if all features work

### 2. Set Up Custom Domain (Optional)
1. Go to Vercel project settings
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as instructed
5. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your custom domain

### 3. Enable Monitoring
1. **Vercel Analytics**: Already enabled automatically
2. **Sentry** (optional):
   - Sign up at [sentry.io](https://sentry.io)
   - Create a new Next.js project
   - Add `NEXT_PUBLIC_SENTRY_DSN` to Vercel env vars

---

## Alternative: Deploy to Railway

### Why Railway?
- ✅ Includes PostgreSQL + Redis in one platform
- ✅ Simple pricing
- ✅ Great for full-stack apps

### Setup Instructions:

1. **Go to [Railway](https://railway.app)** and sign up
2. **Create new project** from GitHub repo
3. **Add PostgreSQL service**
4. **Add Redis service**
5. **Configure environment variables** (same as Vercel)
6. **Deploy**

---

## Security Checklist

Before going live, ensure:

- [ ] All environment variables are set in production
- [ ] `NEXTAUTH_SECRET` is different from development
- [ ] Database credentials are production-only
- [ ] API keys are production-only (not the same as dev)
- [ ] CORS is configured correctly
- [ ] Rate limiting is enabled
- [ ] SSL/HTTPS is enabled (automatic on Vercel)
- [ ] `.env.production` is in `.gitignore`

---

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- TypeScript errors? Run `npm run typecheck` locally first

### Database Connection Fails
- Verify connection string format
- Ensure `?sslmode=require` is at the end
- Check Neon dashboard for connection limits

### API Routes Timeout
- Check function timeout settings (default: 10s, max: 60s on Pro)
- Optimize slow database queries
- Add indexes to frequently queried fields

---

## Cost Estimate (Free Tier)

| Service | Free Tier | Upgrade Cost |
|---------|-----------|--------------|
| Vercel | 100GB bandwidth/month | $20/month Pro |
| Neon | 0.5GB storage | $19/month |
| Upstash | 10K commands/day | $0.20/100K |
| Supabase | 500MB storage | $25/month |
| **Total** | **$0/month** | ~$64/month |

**You can run TapTap Matrix completely free for initial launch!**

---

## Next Steps After Deployment

1. **Monitor Performance**:
   - Check Vercel Analytics
   - Monitor database query performance in Neon
   - Set up alerts for errors

2. **Optimize**:
   - Add database indexes for slow queries
   - Enable caching for frequently accessed data
   - Optimize images with Next.js Image component

3. **Scale**:
   - Upgrade Neon when you hit 0.5GB
   - Upgrade Vercel for more bandwidth
   - Consider CDN for static assets

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Neon Docs**: https://neon.tech/docs
- **Next.js Docs**: https://nextjs.org/docs

---

**Ready to launch? Let's go! 🚀**

