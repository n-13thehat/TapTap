# TapTap Matrix - Database Setup Guide

This guide provides two solutions for the PostgreSQL database setup on Windows.

## Problem

Docker Desktop on Windows has networking limitations that prevent Prisma from connecting to PostgreSQL containers from the Windows host. This causes authentication errors even with correct credentials.

## Solutions

We provide **two working solutions**:

### ✅ Option 1: Run Everything in Docker (Recommended)

**Pros:**
- Consistent environment across all platforms
- No Windows-specific configuration needed
- Easy to reset and reproduce
- Production-like setup

**Cons:**
- Slightly slower file watching on Windows
- Requires Docker Desktop

**Setup:**

1. **Start all services:**
   ```bash
   docker-compose up -d
   ```

2. **Verify services are healthy:**
   ```bash
   docker-compose ps
   ```

3. **Access the app:**
   - Open http://localhost:3000
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379

4. **View logs:**
   ```bash
   docker-compose logs -f app
   ```

See [DOCKER_SETUP.md](./DOCKER_SETUP.md) for detailed instructions.

### ✅ Option 3: Native PostgreSQL on Windows

**Pros:**
- Faster file system performance
- Familiar Windows environment
- Can use pgAdmin or other Windows tools

**Cons:**
- Requires manual PostgreSQL installation
- Windows-specific setup
- Different port (5433) to avoid conflicts

**Setup:**

1. **Install PostgreSQL:**
   ```powershell
   # Using Chocolatey (as Administrator)
   .\scripts\install-postgres-windows.ps1
   
   # Or download from postgresql.org
   ```

2. **Create database:**
   ```bash
   psql -U postgres -p 5433 -c "CREATE DATABASE taptap_dev;"
   ```

3. **Update `.env.local`:**
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5433/taptap_dev"
   DIRECT_URL="postgresql://postgres:password@localhost:5433/taptap_dev"
   ```

4. **Apply schema:**
   ```bash
   pnpm prisma db push
   ```

5. **Seed agents:**
   ```bash
   psql -U postgres -p 5433 -d taptap_dev -f scripts/seed_agents.sql
   ```

6. **Start Next.js:**
   ```bash
   pnpm dev
   ```

See [POSTGRES_WINDOWS_SETUP.md](./POSTGRES_WINDOWS_SETUP.md) for detailed instructions.

## Quick Start Script

Use the startup script to easily switch between modes:

```powershell
# Run in Docker mode
.\scripts\start.ps1 -Mode docker

# Run in Native mode
.\scripts\start.ps1 -Mode native

# Show help
.\scripts\start.ps1 -Mode help
```

## Current Status

✅ **Database Schema:** Created and applied
✅ **18 AI Agents:** Seeded successfully
✅ **Docker PostgreSQL:** Running on port 5432
✅ **Data Verified:** All agents confirmed in database

```sql
-- Verify agents (from Docker)
docker exec taptap-postgres psql -U postgres -d taptap_dev -c "SELECT COUNT(*) FROM \"Agent\";"
-- Result: 18 agents

-- List all agents
docker exec taptap-postgres bash /tmp/list_agents.sh
```

## Switching Between Options

### From Docker to Native:

1. Stop Docker services:
   ```bash
   docker-compose down
   ```

2. Update `.env.local` to use port 5433

3. Start Next.js locally:
   ```bash
   pnpm dev
   ```

### From Native to Docker:

1. Stop local Next.js (Ctrl+C)

2. Update `.env.local` to use `postgres` host

3. Start Docker services:
   ```bash
   docker-compose up -d
   ```

## Database Management

### Backup Database

```bash
# Docker
docker exec taptap-postgres pg_dump -U postgres taptap_dev > backup.sql

# Native
pg_dump -U postgres -p 5433 taptap_dev > backup.sql
```

### Restore Database

```bash
# Docker
docker exec -i taptap-postgres psql -U postgres taptap_dev < backup.sql

# Native
psql -U postgres -p 5433 taptap_dev < backup.sql
```

### Reset Database

```bash
# Docker
docker-compose down -v
docker-compose up -d
docker exec taptap-postgres psql -U postgres -d taptap_dev -f /tmp/schema.sql
docker exec taptap-postgres psql -U postgres -d taptap_dev -f /tmp/seed_agents.sql

# Native
psql -U postgres -p 5433 -c "DROP DATABASE taptap_dev;"
psql -U postgres -p 5433 -c "CREATE DATABASE taptap_dev;"
pnpm prisma db push
psql -U postgres -p 5433 -d taptap_dev -f scripts/seed_agents.sql
```

## Troubleshooting

### "Authentication failed" error

**Docker Mode:**
- This is expected from Windows host
- Use `docker exec` commands instead
- Or run Next.js in Docker

**Native Mode:**
- Verify PostgreSQL is running: `Get-Service postgresql*`
- Check port: `netstat -an | findstr 5433`
- Test connection: `psql -U postgres -p 5433 -c "SELECT 1;"`

### Port conflicts

**Docker (5432):**
```bash
# Find process using port
netstat -ano | findstr :5432

# Stop Docker postgres
docker-compose stop postgres
```

**Native (5433):**
```bash
# Find process using port
netstat -ano | findstr :5433

# Change port in postgresql.conf
# Or use different port during installation
```

### Prisma Client errors

```bash
# Regenerate Prisma Client
pnpm prisma generate

# Clear Prisma cache
rm -rf node_modules/.prisma
pnpm install
```

## Recommended Workflow

For **development on Windows**, we recommend:

1. **Use Docker mode** for consistency and ease of setup
2. **Use Native mode** if you need maximum performance or prefer Windows tools

For **production deployment**:
- Use managed PostgreSQL (Supabase, AWS RDS, etc.)
- Or use Docker with proper volumes and backups

## Next Steps

After database setup:

1. ✅ Verify agents are seeded
2. ✅ Test API endpoints: http://localhost:3000/api/agents
3. 🔄 Integrate agents into notification system
4. 🔄 Build agent chat UI

See the main [README.md](../README.md) for the full project roadmap.

