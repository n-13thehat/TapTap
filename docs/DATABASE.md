# TapTap Matrix Database Configuration

## Local-First Strategy with Supabase Fallback

TapTap Matrix uses a **local-first database strategy** with Supabase as a fallback. This ensures optimal performance, data control, and reliability while maintaining cloud backup capabilities.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │    │  Local PostgreSQL │    │   Supabase      │
│                 │───▶│  (Primary)        │───▶│   (Fallback)    │
│  TapTap Matrix  │    │  Port 5432        │    │   Cloud         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Database Priority

1. **🏠 Local PostgreSQL** (Primary) - Docker container on port 5432
2. **☁️ Supabase** (Fallback) - Cloud database when local is unavailable
3. **💾 Offline Mode** - Graceful degradation when no database is available

## Quick Start

### 1. Start Local Database
```bash
# Ensure local database is running
npm run db:ensure-local

# Check database health
npm run db:health

# Import Music For The Future collection
npm run db:import-music
```

### 2. Environment Configuration

Your `.env.local` should have:
```env
# PRIMARY DATABASE (Local)
DATABASE_URL="postgresql://postgres:password@localhost:5432/taptap_dev"
DIRECT_URL="postgresql://postgres:password@localhost:5432/taptap_dev"

# FALLBACK DATABASE (Supabase)
SUPABASE_DATABASE_URL="postgresql://postgres:password@project.supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Database Scripts

| Script | Description |
|--------|-------------|
| `npm run db:health` | Check database connection and health |
| `npm run db:ensure-local` | Start local PostgreSQL if not running |
| `npm run db:status` | Get detailed database status |
| `npm run db:import-music` | Import Music For The Future collection |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:reset` | Reset database and run migrations |
| `npm run db:seed` | Seed database with initial data |

## Local Database Setup

### Option 1: Automatic (Recommended)
```bash
npm run db:ensure-local
```

### Option 2: Docker Compose
```bash
docker-compose up -d
```

### Option 3: Manual Docker
```bash
docker run -d \
  --name postgres \
  -e POSTGRES_DB=taptap_dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_HOST_AUTH_METHOD=trust \
  -p 5432:5432 \
  postgres:15-alpine
```

## Configuration Options

### Database Settings
```env
DATABASE_CONNECTION_LIMIT=10          # Max connections
DATABASE_QUERY_TIMEOUT=10000          # Query timeout (ms)
DATABASE_CONNECT_TIMEOUT=5000         # Connection timeout (ms)
DATABASE_MAX_RETRIES=3                # Retry attempts
DATABASE_RETRY_DELAY=1000             # Retry delay (ms)
DATABASE_ENABLE_FALLBACK=true         # Enable Supabase fallback
DATABASE_ENABLE_RETRIES=true          # Enable connection retries
```

## Troubleshooting

### Local Database Not Starting
```bash
# Check Docker status
docker ps

# Start PostgreSQL container
docker start postgres

# Or create new container
npm run db:ensure-local
```

### Connection Issues
```bash
# Check database health
npm run db:health

# Check environment variables
echo $DATABASE_URL

# Test connection manually
psql postgresql://postgres@localhost:5432/taptap_dev
```

### Migration Issues
```bash
# Reset and migrate
npm run db:reset

# Or push schema changes
npm run prisma:push
```

## Monitoring

### Health Check
The health check script provides comprehensive database status:

```bash
npm run db:health
```

Output includes:
- ✅ Connection status (local/supabase/offline)
- 📊 Performance metrics
- 🎵 Music collection status
- 🔧 Configuration validation
- 💡 Recommendations

### Database Status
```bash
npm run db:status
```

Shows:
- Primary database connection
- Fallback availability
- Performance metrics
- Schema validation

## Production Deployment

### Environment Variables
Ensure these are set in production:

```env
# Primary database (your production PostgreSQL)
DATABASE_URL="postgresql://user:pass@prod-host:5432/taptap_prod"

# Fallback (Supabase)
SUPABASE_DATABASE_URL="postgresql://postgres:pass@project.supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod_anon_key
```

### Migration Strategy
1. Run migrations on production database
2. Test fallback connectivity
3. Monitor health endpoints
4. Set up automated backups

## Security

### Local Development
- Local database uses trust authentication
- No password required for development
- Data stays on your machine

### Production
- Use strong passwords
- Enable SSL connections
- Restrict network access
- Regular security updates

## Backup Strategy

### Local Backups
```bash
# Backup local database
docker exec postgres pg_dump -U postgres taptap_dev > backup.sql

# Restore from backup
docker exec -i postgres psql -U postgres taptap_dev < backup.sql
```

### Cloud Sync
- Supabase provides automatic backups
- Consider periodic sync between local and cloud
- Export important data regularly

## Performance Optimization

### Local Database
- Uses connection pooling
- Optimized query timeouts
- Efficient indexing
- Fast local I/O

### Monitoring
- Query performance logging
- Connection pool monitoring
- Health check endpoints
- Error tracking

## Support

### Common Issues
1. **Port 5433 in use**: Change port in docker command and DATABASE_URL
2. **Docker not installed**: Install Docker Desktop
3. **Permission errors**: Check Docker permissions
4. **Migration failures**: Reset database and retry

### Getting Help
- Check health status: `npm run db:health`
- Review logs in terminal
- Verify environment variables
- Test connection manually

---

**🎉 Your TapTap Matrix database is configured for optimal performance with local-first strategy and cloud fallback!**
