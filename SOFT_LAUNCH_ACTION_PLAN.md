# 🎯 TapTap Matrix - Soft Launch Action Plan

**Target Launch Date**: TBD (Based on chosen strategy)  
**Current Status**: Pre-Launch Preparation  
**Last Updated**: December 19, 2025

---

## 🚨 WEEK 1: CRITICAL SECURITY & BUILD FIXES

### **Day 1: Security Emergency Response**

#### Task 1.1: Rotate Exposed Credentials ⚠️ CRITICAL
```bash
# Actions Required:
1. Create new Supabase project OR rotate existing keys
   - Go to: https://supabase.com/dashboard
   - Generate new anon key and service role key
   
2. Generate new NextAuth secret
   - Run: openssl rand -base64 32
   
3. Create new database password
   - Update PostgreSQL user password
   
4. Rotate any API keys
   - OpenAI API key (if using)
   - YouTube API key (if using)
   - Deezer credentials (if using)
```

**Deliverable**: New `.env.production` file with fresh credentials (NOT committed to git)

---

#### Task 1.2: Clean Git History
```bash
# Remove sensitive files from git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.development .env.local" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (DANGEROUS - coordinate with team)
git push origin --force --all
```

**Deliverable**: Clean git history, no exposed secrets

---

#### Task 1.3: Update .gitignore
```bash
# Verify these are in .gitignore:
.env
.env.local
.env.development
.env.production
.env*.local
secrets/
*.key
*.pem
```

**Deliverable**: Updated `.gitignore` file

---

### **Day 2: Fix TypeScript Build Errors**

#### Task 2.1: Fix Route Handler Async Params (Next.js 15)
**Files to Fix** (7 route handlers):
1. `app/api/admin/users/[id]/role/route.ts`
2. `app/api/admin/users/[id]/status/route.ts`
3. `app/api/surf/playlist/[id]/items/route.ts`
4. `app/api/uploads/session/[id]/chunk/route.ts`
5. `app/api/uploads/session/[id]/finalize/route.ts`
6. `app/api/uploads/session/[id]/rollback/route.ts`
7. `app/api/uploads/session/[id]/route.ts`

**Fix Pattern**:
```typescript
// OLD (Next.js 14):
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
}

// NEW (Next.js 15):
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

**Deliverable**: All TypeScript errors fixed, `npm run typecheck` passes

---

#### Task 2.2: Test Production Build
```bash
# Clean build
rm -rf .next
npm run build

# Test production server
npm run start

# Verify all pages load
# - http://localhost:3000/
# - http://localhost:3000/library
# - http://localhost:3000/ai
# - http://localhost:3000/settings
```

**Deliverable**: Successful production build with no errors

---

### **Day 3-4: Feature Scope Decision**

#### Task 3.1: Feature Audit
Create spreadsheet of all features:

| Feature | UI Complete | Backend Complete | v1.0 Scope | Status |
|---------|-------------|------------------|------------|--------|
| Authentication | ✅ | ✅ | ✅ | Ready |
| Music Library | ✅ | ✅ | ✅ | Ready |
| Global Player | ✅ | ✅ | ✅ | Ready |
| Upload/Creator | ✅ | ⚠️ 60% | ❌ | Defer |
| Social Feed | ✅ | ⚠️ 40% | ❌ | Defer |
| Direct Messages | ✅ | ❌ | ❌ | Defer |
| Battles | ✅ | ❌ | ❌ | Defer |
| Marketplace | ✅ | ❌ | ❌ | Defer |
| Live Streaming | ✅ | ❌ | ❌ | Defer |
| AI Tools | ✅ | ❌ | ❌ | Defer |
| Posterize/NFT | ✅ | ❌ | ❌ | Defer |
| Surf Radio | ✅ | ⚠️ 50% | ❌ | Defer |

**Deliverable**: Feature scope document with v1.0 decisions

---

#### Task 3.2: Implement Feature Flags
Create `lib/features/launch-flags.ts`:
```typescript
export const SOFT_LAUNCH_FLAGS = {
  // v1.0 Features (enabled)
  authentication: true,
  library: true,
  player: true,
  settings: true,
  
  // Deferred Features (disabled)
  upload: false,
  creator: false,
  social: false,
  dm: false,
  battles: false,
  marketplace: false,
  live: false,
  ai: false,
  posterize: false,
  surf: false,
};
```

**Deliverable**: Feature flag configuration file

---

#### Task 3.3: Update Navigation to Hide Disabled Features
Update `components/navigation/UnifiedNavigation.tsx`:
```typescript
import { SOFT_LAUNCH_FLAGS } from '@/lib/features/launch-flags';

// Filter navigation items based on flags
const visibleNavItems = navItems.filter(item => {
  return SOFT_LAUNCH_FLAGS[item.feature] !== false;
});
```

**Deliverable**: Navigation only shows enabled features

---

### **Day 5-7: Production Environment Setup**

#### Task 5.1: Set Up Production Database
```bash
# Option 1: Neon (Free PostgreSQL)
# - Sign up at https://neon.tech
# - Create new project
# - Copy connection string

# Option 2: Supabase Database
# - Use existing Supabase project
# - Get database connection string

# Option 3: Self-hosted PostgreSQL
# - Set up on VPS/cloud provider
# - Configure SSL
# - Set up backups
```

**Deliverable**: Production database URL

---

#### Task 5.2: Run Database Migrations
```bash
# Set production DATABASE_URL
export DATABASE_URL="postgresql://..."

# Run migrations
npx prisma migrate deploy

# Verify schema
npx prisma db pull
```

**Deliverable**: Production database with correct schema

---

#### Task 5.3: Seed Default Content
```bash
# Upload default album to Supabase Storage
npm run upload:default-album "path/to/music"

# Run seed script
npm run db:seed

# Verify default album exists
npx prisma studio
```

**Deliverable**: Default album available for new users

---

## 🔧 WEEK 2: BACKEND IMPLEMENTATION (v1.0 Features Only)

### **Task 6: Complete Library Backend**

#### 6.1: Verify Library API
- [ ] `GET /api/library` - Fetch user's library
- [ ] `POST /api/library/add` - Add track to library
- [ ] `DELETE /api/library/remove` - Remove track
- [ ] `GET /api/library/stats` - Library statistics

#### 6.2: Test Library Flows
- [ ] New user gets default album
- [ ] User can browse library
- [ ] User can play tracks
- [ ] Queue persistence works

**Deliverable**: Fully functional library system

---

### **Task 7: Complete Player Backend**

#### 7.1: Verify Player API
- [ ] `POST /api/player/play` - Track play event
- [ ] `POST /api/player/queue` - Save queue state
- [ ] `GET /api/player/queue` - Restore queue
- [ ] `POST /api/player/analytics` - Track listening

#### 7.2: Test Player Flows
- [ ] Play/pause works
- [ ] Queue management works
- [ ] Persistence across sessions
- [ ] Analytics tracking

**Deliverable**: Fully functional player system

---

### **Task 8: Complete Settings Backend**

#### 8.1: Verify Settings API
- [ ] `GET /api/settings` - Fetch user settings
- [ ] `PATCH /api/settings` - Update settings
- [ ] `POST /api/settings/notifications` - Notification prefs
- [ ] `POST /api/settings/privacy` - Privacy settings

#### 8.2: Test Settings Flows
- [ ] User can update profile
- [ ] Settings persist
- [ ] Validation works
- [ ] Error handling

**Deliverable**: Fully functional settings system

---

## 🧪 WEEK 3: TESTING & QA

### **Task 9: Automated Testing**

#### 9.1: Fix Failing Tests
```bash
# Run test suite
npm test

# Fix any failing tests
# Target: >95% pass rate
```

#### 9.2: Add Missing Tests
- [ ] Authentication flow tests
- [ ] Library CRUD tests
- [ ] Player state tests
- [ ] Settings update tests

**Deliverable**: >95% test pass rate

---

### **Task 10: Manual QA**

#### 10.1: Core User Flows
- [ ] Sign up new account
- [ ] Verify email (if enabled)
- [ ] Browse default album
- [ ] Play music
- [ ] Create queue
- [ ] Update settings
- [ ] Log out / log in
- [ ] Queue persists

#### 10.2: Cross-Browser Testing
- [ ] Chrome (desktop)
- [ ] Firefox (desktop)
- [ ] Safari (desktop)
- [ ] Chrome (mobile)
- [ ] Safari (mobile)

#### 10.3: Performance Testing
- [ ] Page load times <2s
- [ ] API response times <500ms
- [ ] No memory leaks
- [ ] Smooth animations

**Deliverable**: QA report with all issues documented

---

## 🚀 WEEK 4: DEPLOYMENT & LAUNCH

### **Task 11: Deployment Setup**

#### 11.1: Choose Hosting Platform
**Options**:
- Vercel (easiest for Next.js)
- AWS (most flexible)
- Railway (simple, affordable)
- Render (good balance)

#### 11.2: Configure Deployment
```bash
# Set environment variables on platform
# - DATABASE_URL
# - NEXTAUTH_URL
# - NEXTAUTH_SECRET
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY

# Deploy
npm run build
# Follow platform-specific deployment steps
```

**Deliverable**: Live production deployment

---

### **Task 12: Monitoring Setup**

#### 12.1: Configure Sentry
```bash
# Already integrated, just need to set:
SENTRY_DSN=your-sentry-dsn
SENTRY_ENV=production
```

#### 12.2: Set Up Health Checks
- [ ] Configure uptime monitoring
- [ ] Set up alerts for downtime
- [ ] Monitor error rates
- [ ] Track performance metrics

**Deliverable**: Monitoring dashboard

---

### **Task 13: Soft Launch**

#### 13.1: Pre-Launch Checklist
- [ ] All critical tasks complete
- [ ] Production build successful
- [ ] Database migrations run
- [ ] Environment variables set
- [ ] Monitoring configured
- [ ] Backup plan ready

#### 13.2: Launch Day
- [ ] Deploy to production
- [ ] Verify all pages load
- [ ] Test core flows
- [ ] Monitor error rates
- [ ] Watch user signups

#### 13.3: Post-Launch (First 48 Hours)
- [ ] Monitor health endpoints
- [ ] Check error logs
- [ ] Track user metrics
- [ ] Respond to issues quickly
- [ ] Gather user feedback

**Deliverable**: Successful soft launch! 🎉

---

## 📊 Success Criteria

### **Technical**
- ✅ Zero critical errors
- ✅ <1% error rate
- ✅ <2s page load time
- ✅ >99% uptime

### **User Experience**
- ✅ Smooth signup flow
- ✅ Music plays without issues
- ✅ Settings save correctly
- ✅ Mobile experience works

### **Business**
- 🎯 Track signup conversion
- 🎯 Monitor engagement metrics
- 🎯 Gather user feedback
- 🎯 Plan feature rollout

---

## 🆘 Rollback Plan

If critical issues arise:
1. Revert to previous deployment
2. Restore database backup
3. Communicate with users
4. Fix issues in staging
5. Re-deploy when ready

---

**Remember**: Better to launch with fewer features that work perfectly than many features that are broken. Focus on core music experience first! 🎵

