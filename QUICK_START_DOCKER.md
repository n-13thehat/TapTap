# ⚡ Quick Start - Deploy with Docker Desktop

**Get your app running in production mode in 5 minutes!**

---

## ✅ What You Already Have

- Docker Desktop running
- PostgreSQL database (taptap-postgres)
- Redis cache (taptap-redis)
- All your data already in the database
- Build is successful

**You're 5 minutes away from production!**

---

## 🚀 Option 1: Local Production (5 minutes)

Run production build on your machine using Docker database.

### **Step 1: Verify Docker is Running**

```powershell
docker ps
```

You should see:
- `taptap-postgres`
- `taptap-redis`

### **Step 2: Create Production Environment**

```powershell
# Copy your working environment
Copy-Item .env.local .env.production.local

# Open in editor
notepad .env.production.local
```

**Change this line:**
```bash
# FROM:
NODE_ENV=development

# TO:
NODE_ENV=production
```

**Keep everything else the same!** Your Docker database URLs are already correct.

### **Step 3: Build for Production**

```powershell
npm run build
```

Should complete successfully (we already tested this!).

### **Step 4: Start Production Server**

```powershell
npm run start
```

### **Step 5: Test It!**

Open browser: http://localhost:3000

✅ **Done! Your app is running in production mode!**

---

## 🌐 Option 2: Make It Public (10 minutes)

Share your app with others using ngrok.

### **Step 1: Complete Option 1 First**

Follow steps above to get production running locally.

### **Step 2: Install ngrok**

```powershell
npm install -g ngrok
```

### **Step 3: Expose to Internet**

**In a NEW terminal window:**

```powershell
ngrok http 3000
```

You'll see output like:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

### **Step 4: Update NextAuth URL**

```powershell
# Open .env.production.local
notepad .env.production.local
```

**Update this line:**
```bash
NEXTAUTH_URL=https://abc123.ngrok.io
```

(Use YOUR ngrok URL from step 3)

### **Step 5: Restart App**

```powershell
# Stop the app (Ctrl+C)
# Start again
npm run start
```

### **Step 6: Share Your URL!**

Your app is now accessible from anywhere:
- Share the ngrok URL with friends
- Test on your phone
- Show it to beta testers

✅ **Done! Your app is public!**

---

## 🎯 What Each Option Gives You

### **Option 1: Local Production**
- ✅ Production build running
- ✅ Using Docker database
- ✅ Fast and free
- ❌ Only accessible on your computer
- **Best for:** Testing production build

### **Option 2: Public Access (ngrok)**
- ✅ Everything from Option 1
- ✅ Accessible from anywhere
- ✅ Share with beta testers
- ✅ Test on mobile devices
- ⚠️ Free tier has limits
- **Best for:** Beta testing, demos

---

## 📋 Quick Commands Reference

### **Start Docker Services**
```powershell
docker compose up -d postgres redis
```

### **Check Docker Status**
```powershell
docker ps
```

### **Build Production**
```powershell
npm run build
```

### **Start Production Server**
```powershell
npm run start
```

### **Expose with ngrok**
```powershell
ngrok http 3000
```

### **View Database**
```powershell
npm run prisma:studio
```

---

## 🔧 Troubleshooting

### **Docker not running?**
```powershell
# Start Docker Desktop
# Then start services
docker compose up -d postgres redis
```

### **Port 3000 already in use?**
```powershell
# Kill the process
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Or use different port
$env:PORT=3001
npm run start
```

### **Database connection fails?**
```powershell
# Check Docker is running
docker ps

# Restart PostgreSQL
docker restart taptap-postgres

# Test connection
npm run db:health
```

### **Build fails?**
```powershell
# We already fixed this! But if it happens:
npm run build 2>&1 | Select-String "error"
```

---

## 🎊 You're Done!

### **What You've Accomplished:**

✅ Production build running  
✅ Using your Docker database  
✅ All features working  
✅ (Optional) Public access via ngrok  

### **Next Steps:**

1. **Test everything** - Signup, login, music playback
2. **Invite beta testers** - Share your ngrok URL
3. **Collect feedback** - See what users think
4. **Iterate** - Make improvements

### **When Ready for Full Production:**

See **DEPLOY_WITH_DOCKER.md** for options to:
- Migrate database to cloud (Neon/Supabase)
- Deploy app to Vercel
- Set up custom domain
- Add monitoring

---

## 💡 Pro Tips

**Keep ngrok running:**
- Free tier gives you a new URL each time
- Paid tier ($8/mo) gives you a permanent URL

**Monitor your app:**
- Check logs: `npm run start` terminal
- Check database: `npm run prisma:studio`
- Check Docker: `docker logs taptap-postgres`

**Backup your data:**
```powershell
docker exec taptap-postgres pg_dump -U postgres taptap_dev > backup.sql
```

---

**Total Time:**
- Option 1: 5 minutes ⚡
- Option 2: 10 minutes 🌐

**You're production-ready right now!** 🚀

