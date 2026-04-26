#!/bin/bash
cd /app
export DATABASE_URL="postgresql://postgres@taptap-postgres:5432/taptap_dev"
export DIRECT_URL="postgresql://postgres@taptap-postgres:5432/taptap_dev"
pnpm prisma db push --skip-generate --accept-data-loss

