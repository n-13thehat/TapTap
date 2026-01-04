import { NextResponse } from "next/server";
import { auth } from "@/auth.config";

function q(s: string) { return s.replace(/\s+/g, " ").trim(); }

const SQL = {
  grants: q(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        RAISE NOTICE 'service_role role not found; skipping grants';
      ELSE
        GRANT USAGE ON SCHEMA public TO service_role;
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
      END IF;
    END $$;
  `),
  createProduct: q(`
    CREATE TABLE IF NOT EXISTS "Product" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "title" text NOT NULL,
      "priceCents" integer DEFAULT 0,
      "currency" text DEFAULT 'USD',
      "inventory" integer DEFAULT 0,
      "createdAt" timestamptz DEFAULT now()
    );
  `),
  createBattle: q(`
    CREATE TABLE IF NOT EXISTS "Battle" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "aUserId" uuid NOT NULL,
      "bUserId" uuid NOT NULL,
      "createdAt" timestamptz DEFAULT now()
    );
  `),
  createLiveStream: q(`
    CREATE TABLE IF NOT EXISTS "LiveStream" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "creatorId" uuid NOT NULL,
      "title" text NOT NULL,
      "startedAt" timestamptz,
      "endedAt" timestamptz,
      "visibility" text DEFAULT 'PUBLIC'
    );
  `),
  createSurfSession: q(`
    CREATE TABLE IF NOT EXISTS "SurfSession" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "userId" uuid NOT NULL,
      "youtubeVideoId" text NOT NULL,
      "startedAt" timestamptz DEFAULT now()
    );
  `),
  seedUsers: q(`
    DO $$
    DECLARE has_username boolean; has_email_legacy boolean; has_name_legacy boolean; BEGIN
      SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='User' AND column_name='username') INTO has_username;
      SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='User' AND column_name='email_legacy') INTO has_email_legacy;
      SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='User' AND column_name='name_legacy') INTO has_name_legacy;

      IF has_username THEN
        IF NOT EXISTS (SELECT 1 FROM "User" WHERE username='vx9-system') THEN
          INSERT INTO "User" (id, username) VALUES (gen_random_uuid(),'vx9-system');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM "User" WHERE username='hope') THEN
          INSERT INTO "User" (id, username) VALUES (gen_random_uuid(),'hope');
        END IF;
      ELSIF has_name_legacy OR has_email_legacy THEN
        IF NOT EXISTS (SELECT 1 FROM "User" WHERE name_legacy='vx9-system' OR email_legacy='vx9-system@taptap.local') THEN
          INSERT INTO "User" (id, name_legacy, email_legacy) VALUES (gen_random_uuid(),'vx9-system','vx9-system@taptap.local');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM "User" WHERE name_legacy='hope' OR email_legacy='hope@taptap.local') THEN
          INSERT INTO "User" (id, name_legacy, email_legacy) VALUES (gen_random_uuid(),'hope','hope@taptap.local');
        END IF;
      END IF;
    END $$;
  `),
  seedPosts: q(`
    DO $$
    DECLARE has_text boolean; has_userId boolean; has_content boolean; has_authorId boolean; has_username boolean; BEGIN
      SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Post' AND column_name='text') INTO has_text;
      SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Post' AND column_name='userId') INTO has_userId;
      SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Post' AND column_name='content') INTO has_content;
      SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Post' AND column_name='authorId') INTO has_authorId;
      SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='User' AND column_name='username') INTO has_username;

      IF NOT EXISTS (SELECT 1 FROM "Post") THEN
        IF has_text AND has_userId THEN
          INSERT INTO "Post" (text, userId, createdAt)
          SELECT 'Welcome to ZION', u.id, now() FROM "User" u LIMIT 1;
          INSERT INTO "Post" (text, userId, createdAt)
          SELECT 'Shipping day', u.id, now() FROM "User" u OFFSET 1 LIMIT 1;
        ELSIF has_content AND has_authorId THEN
          INSERT INTO "Post" (content, authorId, createdAt)
          SELECT 'Welcome to ZION', u.id, now() FROM "User" u LIMIT 1;
          INSERT INTO "Post" (content, authorId, createdAt)
          SELECT 'Shipping day', u.id, now() FROM "User" u OFFSET 1 LIMIT 1;
        END IF;
      END IF;
    END $$;
  `),
  seedProduct: q(`
    INSERT INTO "Product" ("title","priceCents","currency","inventory")
    SELECT 'ZION Tee', 3500, 'USD', 100
    WHERE NOT EXISTS (SELECT 1 FROM "Product");
  `),
  seedBattle: q(`
    DO $$
    DECLARE uid1 uuid; uid2 uuid; BEGIN
      SELECT id::uuid INTO uid1 FROM "User"
      WHERE id ~* '^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$'
      ORDER BY id LIMIT 1;
      SELECT s.id::uuid INTO uid2 FROM (
        SELECT id FROM "User"
        WHERE id ~* '^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$'
        ORDER BY id OFFSET 1 LIMIT 1
      ) s;
      IF uid1 IS NOT NULL AND uid2 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Battle") THEN
        INSERT INTO "Battle" ("aUserId","bUserId") VALUES (uid1, uid2);
      END IF;
    END $$;
  `),
  seedLive: q(`
    DO $$
    DECLARE uid1 uuid; BEGIN
      SELECT id::uuid INTO uid1 FROM "User"
      WHERE id ~* '^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$'
      ORDER BY id LIMIT 1;
      IF uid1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "LiveStream") THEN
        INSERT INTO "LiveStream" ("creatorId","title","startedAt","visibility") VALUES (uid1, 'Live Now', now(), 'PUBLIC');
      END IF;
    END $$;
  `),
  seedSurf: q(`
    DO $$
    DECLARE uid1 uuid; BEGIN
      SELECT id::uuid INTO uid1 FROM "User"
      WHERE id ~* '^[0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12}$'
      ORDER BY id LIMIT 1;
      IF uid1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "SurfSession") THEN
        INSERT INTO "SurfSession" ("userId","youtubeVideoId") VALUES (uid1, 'dQw4w9WgXcQ');
      END IF;
    END $$;
  `),
};

async function ensureFeatured() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL missing');
  const { Client } = await import('pg');
  const client = new Client({ connectionString: url, ssl: url.includes('supabase.co') ? { rejectUnauthorized: false } : undefined });
  await client.connect();
  try {
    for (const [name, stmt] of Object.entries(SQL)) {
      await client.query(stmt);
    }
  } finally {
    await client.end();
  }
}

async function isAdmin() {
  try {
    const session = await auth();
    const role = (session as any)?.user?.role;
    return role === 'ADMIN';
  } catch {
    return false;
  }
}

export async function POST() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await ensureFeatured();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}


