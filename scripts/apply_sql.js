// Apply raw SQL file against DATABASE_URL using pg
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { Client } from 'pg'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load env from .env.local then .env
const envLocal = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal })
dotenv.config()

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

async function main() {
  const client = new Client({ connectionString: url, ssl: url.includes('supabase.co') ? { rejectUnauthorized: false } : undefined })
  await client.connect()
  try {
    // Introspect available tables/columns
    const hasColumn = async (table, column) => {
      const { rows } = await client.query(
        `SELECT 1 FROM information_schema.columns WHERE table_schema NOT IN ('pg_catalog','information_schema') AND table_name = $1 AND column_name = $2 LIMIT 1`,
        [table, column]
      )
      return rows.length > 0
    }

    await client.query('BEGIN')

    // Dedupe Follow by (followerId, followingId) or (followerId, followeeId)
    if (await hasColumn('Follow', 'followerId')) {
      if (await hasColumn('Follow', 'followingId')) {
        await client.query(`
          WITH d AS (
            SELECT "followerId", "followingId", MIN("id") AS keep_id
            FROM "Follow"
            GROUP BY "followerId", "followingId"
            HAVING COUNT(*) > 1
          )
          DELETE FROM "Follow" f
          USING d
          WHERE f."followerId" = d."followerId"
            AND f."followingId" = d."followingId"
            AND f."id" <> d.keep_id;
        `)
      } else if (await hasColumn('Follow', 'followeeId')) {
        await client.query(`
          WITH d AS (
            SELECT "followerId", "followeeId", MIN("id") AS keep_id
            FROM "Follow"
            GROUP BY "followerId", "followeeId"
            HAVING COUNT(*) > 1
          )
          DELETE FROM "Follow" f
          USING d
          WHERE f."followerId" = d."followerId"
            AND f."followeeId" = d."followeeId"
            AND f."id" <> d.keep_id;
        `)
      }
    }

    // Dedupe User by username
    if (await hasColumn('User', 'username')) {
      await client.query(`
        WITH d AS (
          SELECT "username", MIN("id") AS keep_id
          FROM "User"
          GROUP BY "username"
          HAVING COUNT(*) > 1
        )
        DELETE FROM "User" u
        USING d
        WHERE u."username" = d."username" AND u."id" <> d.keep_id;
      `)
    }
    // Dedupe User by authUserId
    if (await hasColumn('User', 'authUserId')) {
      await client.query(`
        WITH d AS (
          SELECT "authUserId", MIN("id") AS keep_id
          FROM "User"
          GROUP BY "authUserId"
          HAVING COUNT(*) > 1
        )
        DELETE FROM "User" u
        USING d
        WHERE u."authUserId" = d."authUserId" AND u."id" <> d.keep_id;
      `)
    }

    // Dedupe Wallet by address (Wallet or Wallet_legacy)
    if (await hasColumn('Wallet', 'address')) {
      await client.query(`
        WITH d AS (
          SELECT "address", MIN("id") AS keep_id
          FROM "Wallet"
          GROUP BY "address"
          HAVING COUNT(*) > 1
        )
        DELETE FROM "Wallet" w
        USING d
        WHERE w."address" = d."address" AND w."id" <> d.keep_id;
      `)
    } else if (await hasColumn('Wallet_legacy', 'Address')) {
      await client.query(`
        WITH d AS (
          SELECT "Address", MIN("id") AS keep_id
          FROM "Wallet_legacy"
          GROUP BY "Address"
          HAVING COUNT(*) > 1
        )
        DELETE FROM "Wallet_legacy" w
        USING d
        WHERE w."Address" = d."Address" AND w."id" <> d.keep_id;
      `)
    }

    await client.query('COMMIT')
    console.log('Dedupe SQL applied successfully (conditional).')
  } catch (e) {
    await client.query('ROLLBACK')
    console.error('Failed applying SQL:', e?.message || e)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main().catch((e) => {
  console.error('Unexpected error:', e?.message || e)
  process.exit(1)
})
