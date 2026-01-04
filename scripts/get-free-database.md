# 🎵 TapTap Matrix - Free PostgreSQL Database Setup

Since your Supabase project is paused, here are **3 quick options** for a free PostgreSQL database:

## 🚀 Option 1: Neon (Recommended - 30 seconds setup)

1. **Visit**: https://neon.tech
2. **Sign up** with GitHub (instant)
3. **Create project** → Name: "TapTap Matrix Dev"
4. **Copy connection string** from dashboard
5. **Update .env**:
   ```bash
   DATABASE_URL="postgresql://username:password@host.neon.tech/database?sslmode=require"
   ```

**Free tier**: 3GB storage, 100 hours compute/month

## ⚡ Option 2: Supabase (New Project)

1. **Visit**: https://supabase.com
2. **Create new project** (different from your paused one)
3. **Get connection string** from Settings → Database
4. **Update .env** with new connection string

**Free tier**: 500MB storage, 2 projects

## 🐳 Option 3: Local Docker (When Docker Desktop is running)

```bash
# Start PostgreSQL container
docker run -d --name taptap-postgres \
  -e POSTGRES_DB=taptap_dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:15-alpine

# Update .env
DATABASE_URL="postgresql://postgres:password@localhost:5432/taptap_dev"
```

## 🔧 After Getting Database URL:

1. **Update .env file**:
   ```bash
   DATABASE_URL="your-connection-string-here"
   ```

2. **Apply schema**:
   ```bash
   pnpm run prisma:push
   ```

3. **Seed database**:
   ```bash
   pnpm run db:seed
   ```

4. **Start development**:
   ```bash
   pnpm run dev:fast
   ```

## 💡 Recommendation

**Go with Neon** - it's the fastest to set up and has the best free tier for development!

Once you have the connection string, just let me know and I'll help you complete the setup! 🎯
