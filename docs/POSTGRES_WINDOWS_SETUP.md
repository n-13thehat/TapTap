# PostgreSQL Native Installation on Windows

## Option A: Using Chocolatey (Recommended)

1. **Run PowerShell as Administrator**

2. **Execute the installation script:**
   ```powershell
   .\scripts\install-postgres-windows.ps1
   ```

3. **Create the database:**
   ```powershell
   psql -U postgres -p 5433 -c "CREATE DATABASE taptap_dev;"
   ```

4. **Update `.env.local`:**
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5433/taptap_dev"
   DIRECT_URL="postgresql://postgres:password@localhost:5433/taptap_dev"
   ```

5. **Apply schema and seed data:**
   ```powershell
   pnpm prisma db push
   psql -U postgres -p 5433 -d taptap_dev -f scripts/seed_agents.sql
   ```

## Option B: Manual Installation

1. **Download PostgreSQL 15:**
   - Visit: https://www.postgresql.org/download/windows/
   - Download the installer for PostgreSQL 15

2. **Run the installer:**
   - Port: `5433` (to avoid conflict with Docker)
   - Password: `password`
   - Locale: Default

3. **Add PostgreSQL to PATH:**
   - Add `C:\Program Files\PostgreSQL\15\bin` to your system PATH

4. **Create the database:**
   ```cmd
   psql -U postgres -p 5433 -c "CREATE DATABASE taptap_dev;"
   ```

5. **Update `.env.local`:**
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5433/taptap_dev"
   DIRECT_URL="postgresql://postgres:password@localhost:5433/taptap_dev"
   ```

6. **Apply schema:**
   ```cmd
   pnpm prisma db push
   ```

7. **Seed agents:**
   ```cmd
   psql -U postgres -p 5433 -d taptap_dev -f scripts/seed_agents.sql
   ```

## Verification

Test the connection:
```powershell
node scripts/test_db_connection.mjs
```

Check agents:
```powershell
psql -U postgres -p 5433 -d taptap_dev -c "SELECT COUNT(*) FROM \"Agent\";"
```

## Troubleshooting

### Port Conflict
If port 5433 is already in use, choose a different port during installation and update the DATABASE_URL accordingly.

### Authentication Failed
Ensure the password matches what you set during installation. You can reset it:
```sql
ALTER USER postgres WITH PASSWORD 'password';
```

### psql not found
Add PostgreSQL bin directory to your PATH:
```
C:\Program Files\PostgreSQL\15\bin
```

