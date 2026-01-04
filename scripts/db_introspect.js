import { Client } from 'pg'
import dotenv from 'dotenv'
import fs from 'fs'

if (fs.existsSync('.env.local')) dotenv.config({ path: '.env.local' })
dotenv.config()

const url = process.env.DATABASE_URL
if (!url) { console.error('DATABASE_URL missing'); process.exit(1) }

const client = new Client({ connectionString: url, ssl: url.includes('supabase.co') ? { rejectUnauthorized: false } : undefined })
await client.connect()
const q = `
  SELECT table_schema, table_name, column_name
  FROM information_schema.columns
  WHERE table_schema NOT IN ('pg_catalog','information_schema')
    AND (table_name ILIKE '%follow%' OR table_name ILIKE '%user' OR table_name ILIKE '%wallet%' OR table_name ILIKE '%post%' OR table_name ILIKE '%liketarget%')
  ORDER BY table_name, ordinal_position
`
const { rows } = await client.query(q)
for (const r of rows) console.log(`${r.table_schema}.${r.table_name}.${r.column_name}`)
await client.end()
