# 🐳 Deploy TapTap Matrix ZION with Docker Desktop

**Using your existing Docker Desktop database for production**

---

## 🎯 Overview

You already have Docker Desktop running with:
- ✅ PostgreSQL database (port 5432)
- ✅ Redis cache (port 6379)
- ✅ All data persisted in Docker volumes

This guide shows you how to deploy your app while keeping your Docker database.

---

## 📊 Current Setup

### **Local Development** (Already Working)
```
DATABASE_URL=postgresql://postgres:password@127.0.0.1:5432/taptap_dev
```

### **Docker Containers Running**
- `taptap-postgres` - PostgreSQL 15
- `taptap-redis` - Redis 7
- Data stored in Docker volumes (persisted)

---

## 🚀 Deployment Options with Docker

### **Option 1: Local Production (Easiest)** ⭐

Run production build on your local machine using Docker database.

**Pros:**
- No cloud costs
- Use existing database
- Full control
- Fast deployment

**Cons:**
- Only accessible on your network
- Need to keep computer running
- No automatic scaling

**Steps:**

1. **Ensure Docker is Running**
   ```bash
   docker ps
   # Should show taptap-postgres and taptap-redis
   ```

2. **Update Production Environment**
   ```bash
   # Copy .env.local to .env.production.local
   cp .env.local .env.production.local
   
   # Edit .env.production.local
   # Change NODE_ENV to production
   # Keep DATABASE_URL pointing to Docker
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

4. **Start Production Server**
   ```bash
   npm run start
   # App runs on http://localhost:3000
   ```

5. **Access Locally**
   - Your app: http://localhost:3000
   - Database: Running in Docker
   - Redis: Running in Docker

---

### **Option 2: Expose to Internet (ngrok/Cloudflare Tunnel)**

Make your local app accessible from the internet.

**Using ngrok:**
```bash
# Install ngrok
npm install -g ngrok

# Start your app
npm run start

# In another terminal, expose it
ngrok http 3000

# You'll get a public URL like: https://abc123.ngrok.io
```

**Using Cloudflare Tunnel (Free):**
```bash
# Install cloudflared
# Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

# Start tunnel
cloudflared tunnel --url http://localhost:3000

# You'll get a public URL
```

**Update NEXTAUTH_URL:**
```bash
# In .env.production.local
NEXTAUTH_URL=https://your-ngrok-or-cloudflare-url.com
```

---

### **Option 3: Deploy App to Cloud, Keep Docker DB**

Deploy Next.js app to Vercel/Railway, connect to your Docker database.

**Requirements:**
- Expose Docker PostgreSQL to internet (not recommended for security)
- Or use VPN/tunnel to connect cloud app to local DB

**Better Alternative:** Migrate database to cloud (see Option 4)

---

### **Option 4: Migrate to Cloud Database** (Recommended for Production)

Keep your data, move database to cloud.

#### **Step 1: Export Your Data**

```bash
# Export from Docker PostgreSQL
docker exec taptap-postgres pg_dump -U postgres taptap_dev > backup.sql
```

#### **Step 2: Set Up Cloud Database**

**Option A: Neon (Free PostgreSQL)**
1. Go to https://neon.tech
2. Create project
3. Copy connection string

**Option B: Supabase (You already have this!)**
```
Your Supabase DB is already configured in .env.local:
SUPABASE_DATABASE_URL=postgresql://postgres:Reddington00245152!@db.gffzfwfprcbwirsjdbvn.supabase.co:5432/postgres
```

#### **Step 3: Import Your Data**

**To Neon:**
```bash
psql "your-neon-connection-string" < backup.sql
```

**To Supabase:**
```bash
psql "postgresql://postgres:Reddington00245152!@db.gffzfwfprcbwirsjdbvn.supabase.co:5432/postgres?sslmode=require" < backup.sql
```

#### **Step 4: Update Environment**

```bash
# In .env.production.local
DATABASE_URL=your-cloud-database-url
DIRECT_URL=your-cloud-database-url
```

#### **Step 5: Deploy to Vercel**

```bash
npm i -g vercel
vercel --prod
# Add environment variables in Vercel dashboard
```

---

## 🔧 Production Configuration

### **For Local Production (Option 1)**

Edit `.env.production.local`:

```bash
NODE_ENV=production
PORT=3000

# Keep Docker database
DATABASE_URL=postgresql://postgres:password@127.0.0.1:5432/taptap_dev?sslmode=disable
DIRECT_URL=postgresql://postgres:password@127.0.0.1:5432/taptap_dev?sslmode=disable

# Update this if using ngrok/cloudflare
NEXTAUTH_URL=http://localhost:3000

# Use existing NextAuth secret (already generated)
NEXTAUTH_SECRET=c0fYc76EdNAz2vE5DiyPTZZ9DNaTil6ncLQUkBfz6ck=

# Keep your existing Supabase config
NEXT_PUBLIC_SUPABASE_URL=https://gffzfwfprcbwirsjdbvn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional services
SENTRY_DSN=
OPENAI_API_KEY=jpik4AmsP0CcgecKW1hAFflxMjoART8oL8dXMiLjdI_W5VPn7SZU02usS2k2kP2ZmgNpQOLfa0T3BlbkFJUsbGtXEAw5Rz9Xe19vXin1w3unjLmGoWp1hxBFnLqTm_4vSIlM0bl657tHDxRT8y-6R3d7laAA
YOUTUBE_API_KEY=AIzaSyCrDN8EINiWi7MZeOr21mBlrWA1VTo8xuo
```

---

## ⚡ Quick Start: Local Production

**Total Time: 5 minutes**

```bash
# 1. Ensure Docker is running
docker ps

# 2. Copy environment file
cp .env.local .env.production.local

# 3. Edit .env.production.local
# Change NODE_ENV=production

# 4. Build
npm run build

# 5. Start
npm run start

# ✅ App running at http://localhost:3000
```

---

## 🌐 Quick Start: Public Access (ngrok)

**Total Time: 10 minutes**

```bash
# 1. Build and start app
npm run build
npm run start

# 2. In new terminal, install ngrok
npm install -g ngrok

# 3. Expose to internet
ngrok http 3000

# 4. Copy the https URL (e.g., https://abc123.ngrok.io)

# 5. Update .env.production.local
NEXTAUTH_URL=https://abc123.ngrok.io

# 6. Restart app
# Ctrl+C, then npm run start

# ✅ App accessible from anywhere!
```

---

## 📋 Recommended Path

**For Testing/Development:**
→ Use **Option 1** (Local Production)

**For Beta/Small Launch:**
→ Use **Option 2** (ngrok/Cloudflare Tunnel)

**For Full Production:**
→ Use **Option 4** (Migrate to Cloud DB + Vercel)

---

## 🔒 Security Notes

### **If Using Docker Database:**
- ⚠️ Don't expose PostgreSQL port to internet
- ✅ Use tunnels (ngrok/Cloudflare) for app access
- ✅ Keep database on local network only

### **If Migrating to Cloud:**
- ✅ Use SSL connections (sslmode=require)
- ✅ Rotate database password
- ✅ Enable connection pooling
- ✅ Set up backups

---

## 🎯 Next Steps

1. **Choose your deployment option** (1, 2, or 4)
2. **Follow the steps** for your chosen option
3. **Test thoroughly** before sharing with users
4. **Set up monitoring** (Sentry, uptime checks)

---

*Your Docker setup is already production-ready for local deployment!* 🐳

