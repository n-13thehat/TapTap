import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("❌ Missing env vars."); process.exit(1);
}
const supabase = createClient(url, key);
(async () => {
  console.log("🔍 Checking Album + Track tables...");
  const { data: albums, error: aErr } = await supabase.from("Album").select("id,title,artist");
  if (aErr) { console.error("❌ Album error:", aErr); process.exit(1); }
  console.table(albums || []);
  if (albums?.length) {
    const { data: tracks, error: tErr } = await supabase.from("Track").select("id,title,albumId");
    if (tErr) { console.error("❌ Track error:", tErr); process.exit(1); }
    console.table(tracks || []);
  }
})();
