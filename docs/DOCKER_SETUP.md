# Running TapTap Matrix with Docker

This guide explains how to run the entire TapTap Matrix application stack in Docker, which solves the Windows networking issues with PostgreSQL.

## Prerequisites

- Docker Desktop for Windows installed and running
- Git Bash or PowerShell

## Quick Start

### 1. Stop any running containers

```bash
docker-compose down -v
```

### 2. Start all services (PostgreSQL, Redis, Next.js App)

```bash
docker-compose up -d
```

This will start:
- **PostgreSQL** on port 5432
- **Redis** on port 6379  
- **Next.js App** on port 3000

### 3. Wait for services to be healthy

```bash
docker-compose ps
```

All services should show "healthy" status.

### 4. View logs

```bash
# All services
docker-compose logs -f

# Just the app
docker-compose logs -f app

# Just the database
docker-compose logs -f postgres
```

### 5. Access the application

Open your browser to: http://localhost:3000

## Database Management

### Apply Schema

The schema is already applied. To reapply:

```bash
docker exec taptap-postgres psql -U postgres -d taptap_dev -f /tmp/schema.sql
```

### Seed Agents

The agents are already seeded. To reseed:

```bash
docker exec taptap-postgres psql -U postgres -d taptap_dev -f /tmp/seed_agents.sql
```

### Access PostgreSQL CLI

```bash
docker exec -it taptap-postgres psql -U postgres -d taptap_dev
```

### Run SQL queries

```bash
docker exec taptap-postgres psql -U postgres -d taptap_dev -c "SELECT name, role FROM \"Agent\";"
```

## Development Workflow

### Install new dependencies

```bash
docker-compose exec app pnpm add <package-name>
```

### Run Prisma commands

```bash
# Generate Prisma Client
docker-compose exec app pnpm prisma generate

# Push schema changes
docker-compose exec app pnpm prisma db push

# Open Prisma Studio
docker-compose exec app pnpm prisma studio
```

### Restart the app

```bash
docker-compose restart app
```

### Rebuild after code changes

The app uses volume mounts, so code changes are reflected immediately. If you need to rebuild:

```bash
docker-compose up -d --build app
```

## Troubleshooting

### Port conflicts

If ports 3000, 5432, or 6379 are already in use:

1. Stop the conflicting services
2. Or modify `docker-compose.yml` to use different ports

### App won't start

Check logs:
```bash
docker-compose logs app
```

Common issues:
- **pnpm not found**: The container will install it on first run
- **Dependencies missing**: Run `docker-compose exec app pnpm install`
- **Database not ready**: Wait for postgres to be healthy

### Database connection errors

Ensure postgres is healthy:
```bash
docker-compose ps postgres
```

Test connection from app container:
```bash
docker-compose exec app psql -h postgres -U postgres -d taptap_dev -c "SELECT 1"
```

### Clear everything and start fresh

```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v

# Remove node_modules and .next
rm -rf node_modules .next

# Start fresh
docker-compose up -d
```

## Performance Tips

### Use named volumes for node_modules

Already configured in docker-compose.yml:
```yaml
volumes:
  - .:/app
  - /app/node_modules  # Prevents Windows filesystem slowness
  - /app/.next
```

### Enable BuildKit

Add to your environment or `.env`:
```
DOCKER_BUILDKIT=1
COMPOSE_DOCKER_CLI_BUILD=1
```

## Switching Between Docker and Native

### To use Docker (Option 1):

1. Update `.env.local`:
   ```env
   DATABASE_URL=postgresql://postgres@postgres:5432/taptap_dev
   DIRECT_URL=postgresql://postgres@postgres:5432/taptap_dev
   ```

2. Start services:
   ```bash
   docker-compose up -d
   ```

3. Access at http://localhost:3000

### To use Native PostgreSQL (Option 3):

1. Stop Docker services:
   ```bash
   docker-compose down
   ```

2. Update `.env.local`:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5433/taptap_dev
   DIRECT_URL=postgresql://postgres:password@localhost:5433/taptap_dev
   ```

3. Start Next.js locally:
   ```bash
   pnpm dev
   ```

## Production Deployment

For production, create a `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
    command: pnpm start
```

Then:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

