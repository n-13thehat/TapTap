import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const envLocal = path.resolve(".env.local");
const envDefault = path.resolve(".env");

// ✅ Load .env.local first (if it exists), then fallback to .env
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
else if (fs.existsSync(envDefault)) dotenv.config({ path: envDefault });

const required = [
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "DATABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];
let missing = [];

for (const key of required) {
  if (!process.env[key]) missing.push(key);
}

if (missing.length > 0) {
  console.error(
    `\n[ENV ERROR] Missing ${missing.map((m) => `'${m}'`).join(", ")} in .env.local or .env\n`
  );
  process.exit(1);
} else {
  console.log("✅ Environment variables loaded successfully.");
}
