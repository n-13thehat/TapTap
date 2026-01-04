import fs from 'fs'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Prefer .env.local first, then .env
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local', override: true })
}
dotenv.config()

function getEnv(name: string): string | undefined {
  return process.env[name]
}

const url = getEnv('NEXT_PUBLIC_SUPABASE_URL') || getEnv('SUPABASE_URL')
const anon = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY')

async function main() {
  if (!url || !anon) {
    console.error('Missing Supabase URL or anon key. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_URL/SUPABASE_ANON_KEY).')
    process.exit(1)
  }

  const supabase = createClient(url, anon)

  // HEAD count queries for efficiency
  const uRes = await supabase.from('User').select('*', { count: 'exact', head: true })
  if (uRes.error) {
    console.error('User count failed:', uRes.error.message || JSON.stringify(uRes.error))
    if (typeof uRes.status !== 'undefined') console.error('Status:', uRes.status)
    process.exit(1)
  }

  const pRes = await supabase.from('Post').select('*', { count: 'exact', head: true })
  if (pRes.error) {
    console.error('Post count failed:', pRes.error.message || JSON.stringify(pRes.error))
    if (typeof pRes.status !== 'undefined') console.error('Status:', pRes.status)
    process.exit(1)
  }

  console.log(`Supabase smoke OK`)
  console.log(`- User count: ${uRes.count ?? 0}`)
  console.log(`- Post count: ${pRes.count ?? 0}`)
}

main().catch((e) => {
  console.error('Unexpected error:', e?.message || e)
  process.exit(1)
})
