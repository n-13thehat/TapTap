# 🚀 Vercel Deployment - Quick Setup Guide

## ✅ Prerequisites Completed
- ✅ Vercel CLI installed
- ✅ `.vercelignore` created
- ✅ `vercel.json` configured
- ✅ Production build tested

---

## 🔐 Step 1: Login to Vercel

Run this command and follow the prompts:

```bash
vercel login
```

Choose your preferred login method:
- GitHub (recommended)
- GitLab
- Bitbucket
- Email

---

## 🎯 Step 2: Link Your Project

```bash
vercel link
```

Answer the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account/team
- **Link to existing project?** → No (create new)
- **Project name?** → taptap-matrix (or your choice)
- **Directory?** → ./ (current directory)

---

## 🔑 Step 3: Add Environment Variables

### Required Variables:

```bash
# Auth
vercel env add NEXTAUTH_URL
# Value: https://your-project.vercel.app (Vercel will provide this)

vercel env add NEXTAUTH_SECRET
# Value: Generate with: openssl rand -base64 32
# Or use: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Database (Get from Neon: https://console.neon.tech)
vercel env add DATABASE_URL
# Value: postgresql://user:pass@host/db?sslmode=require

vercel env add DIRECT_URL
# Value: postgresql://user:pass@host/db?sslmode=require

# Redis (Get from Upstash: https://console.upstash.com)
vercel env add UPSTASH_REDIS_REST_URL
# Value: https://your-redis.upstash.io

vercel env add UPSTASH_REDIS_REST_TOKEN
# Value: Your Upstash token
```

### Optional Variables:

```bash
# Supabase (for file storage)
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# OpenAI (for AI features)
vercel env add OPENAI_API_KEY

# YouTube (for video features)
vercel env add YOUTUBE_API_KEY

# Sentry (for error monitoring)
vercel env add SENTRY_DSN
```

**Tip:** For each variable, select:
- Environment: **Production, Preview, Development** (all three)

---

## 🚀 Step 4: Deploy

```bash
vercel --prod
```

This will:
1. Build your application
2. Upload to Vercel
3. Deploy to production
4. Provide you with a URL

---

## 🗄️ Step 5: Setup Database

After deployment, run migrations:

```bash
# Set your production DATABASE_URL
export DATABASE_URL="your-neon-url"

# Push schema to production database
npx prisma db push

# Optional: Seed with initial data
npm run db:seed
```

---

## ✅ Step 6: Verify Deployment

1. **Visit your app:** https://your-project.vercel.app
2. **Check health:** https://your-project.vercel.app/api/health
3. **Test signup/login**
4. **Test music playback**

---

## 🔧 Troubleshooting

### Build Fails
- Check Vercel logs in dashboard
- Verify all environment variables are set
- Ensure DATABASE_URL is accessible from Vercel

### Database Connection Issues
- Verify Neon allows connections from Vercel IPs
- Check DATABASE_URL format
- Ensure SSL mode is enabled

### Environment Variables Not Working
- Redeploy after adding variables: `vercel --prod`
- Check variable names (case-sensitive)
- Verify no trailing spaces

---

## 📊 Monitoring

### Vercel Dashboard
- **Deployments:** View build logs
- **Analytics:** Track performance
- **Logs:** Real-time error logs

### Health Check
```bash
curl https://your-project.vercel.app/api/health?detailed=true
```

---

## 🎉 Next Steps

1. ✅ Configure custom domain (optional)
2. ✅ Set up monitoring (Sentry)
3. ✅ Enable analytics
4. ✅ Test all features
5. ✅ Invite beta users

---

## 📞 Quick Commands

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel

# View logs
vercel logs

# List deployments
vercel ls

# Remove deployment
vercel rm [deployment-url]

# Open dashboard
vercel dashboard
```

---

**🚀 You're ready to deploy! Run `vercel login` to get started!**

