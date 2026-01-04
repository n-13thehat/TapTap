#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(".env.local") });

const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE, DATABASE_URL } = process.env;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !DATABASE_URL) {
  console.error("Missing env vars. Ensure .env.local contains SUPABASE_URL, SUPABASE_ANON_KEY, and DATABASE_URL");
  process.exit(1);
}

const OUT = path.resolve("codex_context", "supabase");
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  try {
    const projectId = SUPABASE_URL.match(/https:\/\/(.*?)\.supabase\.co/)?.[1] || "";

    // 1) Try to generate TS types using supabase CLI if available
    try {
      const cmd = `supabase gen types typescript --project-id ${projectId} --schema public`;
      const types = execSync(cmd, { stdio: "pipe" }).toString();
      fs.writeFileSync(path.join(OUT, "types.supabase.ts"), types, "utf8");
      console.log("✓ types.supabase.ts");
    } catch (e) {
      fs.writeFileSync(path.join(OUT, "types.supabase.ts"), "export type Database = any;", "utf8");
      console.warn("! supabase gen types failed (CLI missing or not logged in). Wrote stub types.supabase.ts");
    }

    // 2) Introspect Postgres using pg client
    const client = new pg.Client({ connectionString: DATABASE_URL });
    await client.connect();

    const tables = (await client.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema IN ('public', 'storage', 'graphql_public')
      ORDER BY table_schema, table_name;
    `)).rows;
    fs.writeFileSync(path.join(OUT, "tables.json"), JSON.stringify(tables, null, 2), "utf8");
    console.log("✓ tables.json");

    const columns = (await client.query(`
      SELECT table_schema, table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema IN ('public', 'storage', 'graphql_public')
      ORDER BY table_schema, table_name, ordinal_position;
    `)).rows;
    fs.writeFileSync(path.join(OUT, "columns.json"), JSON.stringify(columns, null, 2), "utf8");
    console.log("✓ columns.json");

    // Policies (from pg_policy)
    const policies = (await client.query(`
      SELECT c.relname AS table_name,
             p.polname AS policy_name,
             p.polcmd  AS command,
             pg_catalog.pg_get_expr(p.polqual, p.polrelid) AS using_expr,
             pg_catalog.pg_get_expr(p.polwithcheck, p.polrelid) AS check_expr
      FROM pg_policy p
      JOIN pg_class c ON c.oid = p.polrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
      ORDER BY c.relname, p.polname;
    `)).rows;
    fs.writeFileSync(path.join(OUT, "policies.json"), JSON.stringify(policies, null, 2), "utf8");
    console.log("✓ policies.json");

    // RPC / functions
    const funcs = (await client.query(`
      SELECT n.nspname as schema, p.proname as name,
             pg_catalog.pg_get_function_arguments(p.oid) as args,
             t.typname as return_type
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      JOIN pg_type t ON t.oid = p.prorettype
      WHERE n.nspname = 'public'
      ORDER BY p.proname;
    `)).rows;
    fs.writeFileSync(path.join(OUT, "rpc.json"), JSON.stringify(funcs, null, 2), "utf8");
    console.log("✓ rpc.json");

    // Buckets via Supabase admin client (SERVICE_ROLE preferred)
    try {
      const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE || SUPABASE_ANON_KEY);
      const { data: buckets } = await supa.storage.listBuckets();
      fs.writeFileSync(path.join(OUT, "buckets.json"), JSON.stringify(buckets || [], null, 2), "utf8");
      console.log("✓ buckets.json");
    } catch (e) {
      console.warn("! Could not list buckets (check SERVICE_ROLE or network):", e?.message || e);
      fs.writeFileSync(path.join(OUT, "buckets.json"), JSON.stringify([], null, 2), "utf8");
    }

    // Optional: pg_dump schema (if pg_dump exists)
    try {
      execSync("pg_dump --version", { stdio: "ignore" });
      const dumpCmd = `pg_dump --schema-only "${DATABASE_URL}"`;
      const schemaSql = execSync(dumpCmd, { stdio: "pipe" }).toString();
      fs.writeFileSync(path.join(OUT, "schema.sql"), schemaSql, "utf8");
      console.log("✓ schema.sql");
    } catch (e) {
      console.warn("! pg_dump not available or failed; skipped schema.sql");
    }

    await client.end();
    console.log("✅ Supabase context synced → codex_context/supabase");
    process.exit(0);
  } catch (err) {
    console.error("❌ Sync failed:", err);
    process.exit(1);
  }
})();
