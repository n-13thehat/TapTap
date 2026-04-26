-- Create Agent table if not exists (simplified version for testing)
CREATE TABLE IF NOT EXISTS "Agent" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL UNIQUE,
  "role" TEXT NOT NULL DEFAULT '',
  "tone" TEXT NOT NULL,
  "vibe" TEXT NOT NULL,
  "signature" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "version" TEXT NOT NULL DEFAULT '2.0.0',
  "meta" JSONB DEFAULT '{}',
  "changelog" TEXT DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert a test agent
INSERT INTO "Agent" (name, role, tone, vibe, signature, summary, version)
VALUES ('Hope', 'Listener Companion', 'Gentle, encouraging', 'Soft gradient', 'Here''s something I think will move you.', 'Taste vectors, heartfelt recs, micro-DMs.', '2.0.0')
ON CONFLICT (name) DO UPDATE SET
  role = EXCLUDED.role,
  tone = EXCLUDED.tone,
  vibe = EXCLUDED.vibe,
  signature = EXCLUDED.signature,
  summary = EXCLUDED.summary,
  version = EXCLUDED.version;

SELECT * FROM "Agent";

