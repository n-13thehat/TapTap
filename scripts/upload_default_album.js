import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE/NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const client = createClient(SUPABASE_URL, SERVICE_ROLE);
const DEFAULT_BUCKET = process.env.TAPGAME_DEFAULT_BUCKET?.trim() || "Default Album Music For The Future";
const DEFAULT_BUCKET_DASHBOARD =
  process.env.TAPGAME_DEFAULT_BUCKET_DASHBOARD_URL ||
  "https://supabase.com/dashboard/project/gffzfwfprcbwirsjdbvn/storage/files/buckets/Default%20Album%20Music%20For%20The%20Future";
console.info("Uploading default album to bucket:", DEFAULT_BUCKET);
console.info("Supabase dashboard:", DEFAULT_BUCKET_DASHBOARD);
const bucket = DEFAULT_BUCKET;
const dir = process.argv[2];
if (!dir) {
  console.error("Usage: node scripts/upload_default_album.js <local_folder_with_mp3s>");
  process.exit(1);
}

async function ensureBucket() {
  const { data: list, error } = await client.storage.listBuckets();
  if (error) throw error;
  const exists = (list || []).some((b) => b.name === bucket);
  if (!exists) {
    const { error: e2 } = await client.storage.createBucket(bucket, { public: true });
    if (e2) throw e2;
    console.log("Created bucket:", bucket);
  }
}

async function main() {
  await ensureBucket();
  const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".mp3"));
  for (const f of files) {
    const fp = path.join(dir, f);
    const buf = fs.readFileSync(fp);
    await uploadWithRetry(f, buf, 5);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

async function uploadWithRetry(name, buffer, attempts = 3) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    const { error } = await client.storage.from(bucket).upload(name, buffer, {
      upsert: true,
      contentType: "audio/mpeg",
    });
    if (!error) {
      console.log("Uploaded", name);
      return;
    }
    lastErr = error;
    console.error(`Upload failed for ${name} (attempt ${i}/${attempts})`, error.message);
    const backoffMs = Math.min(2000 * i, 8000);
    await new Promise((r) => setTimeout(r, backoffMs));
  }
  console.error(`Giving up on ${name}:`, lastErr?.message || lastErr);
}
