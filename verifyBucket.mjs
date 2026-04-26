import { createClient } from '@supabase/supabase-js'
const supabase = createClient('https://gffzfwfprcbwirsjdbvn.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmZnpmd2ZwcmNid2lyc2pkYnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2Nzc0ODIsImV4cCI6MjA3NTI1MzQ4Mn0.bLs2jwnwFvoscQGJITeut0nHPLQl7ragK2Lz-MMC0k8')

const run = async () => {
  console.log('🔎 Checking for bucket: tracks')
  const { data: list, error: listErr } = await supabase.storage.listBuckets()
  if (listErr) { console.error('List error:', listErr); process.exit(1) }
  const exists = list.find(b => b.name === 'tracks')
  if (exists) {
    console.log('✅ Bucket already exists.')
  } else {
    console.log('🚀 Creating bucket: tracks')
    const { data, error } = await supabase.storage.createBucket('tracks', { public: true })
    if (error) { console.error('❌ Failed:', error.message); process.exit(1) }
    console.log('✅ Bucket created successfully.')
  }
  process.exit(0)
}
run()
