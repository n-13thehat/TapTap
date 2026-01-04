import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !service) {
  console.error('[ensure_featured] Missing SUPABASE_URL and/or SERVICE ROLE');
  process.exit(1);
}
const supa = createClient(url, service);

async function getSingle(table, eq) {
  const q = supa.from(table).select('*').limit(1);
  Object.entries(eq).forEach(([k, v]) => q.eq(k, v));
  const { data, error } = await q;
  if (error) throw error;
  return (data && data[0]) || null;
}

async function count(table) {
  const { count, error } = await supa.from(table).select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count || 0;
}

async function insertWithFallback(table, obj) {
  let current = { ...obj };
  for (let i = 0; i < 6; i++) {
    const { data, error } = await supa.from(table).insert(current).select('*').limit(1);
    if (!error) return data[0];
    const msg = String(error?.message || '');
    const m = msg.match(/'(\w+)'/);
    if (m && current.hasOwnProperty(m[1])) {
      delete current[m[1]];
      continue;
    }
    throw error;
  }
  throw new Error(`Failed to insert into ${table}`);
}

async function ensureSystemUsers() {
  const primary = await getSingle('User', { username: 'vx9-system' }).catch(() => null);
  let u1 = primary;
  if (!u1) {
    u1 = await insertWithFallback('User', {
      email: 'vx9-system@taptap.local',
      username: 'vx9-system',
      authUserId: crypto.randomUUID(),
      verified: 'VERIFIED',
      role: 'ADMIN',
    });
    console.log('[ensure_featured] created user', u1.username);
  }
  let u2 = await getSingle('User', { username: 'hope' }).catch(() => null);
  if (!u2) {
    u2 = await insertWithFallback('User', {
      email: 'hope@taptap.local',
      username: 'hope',
      authUserId: crypto.randomUUID(),
      verified: 'VERIFIED',
      role: 'CREATOR',
    });
    console.log('[ensure_featured] created user', u2.username);
  }
  return { u1, u2 };
}

async function ensureArtist(userId, stageName) {
  let a = await getSingle('Artist', { userId }).catch(() => null);
  if (!a) {
    const { data, error } = await supa.from('Artist').insert({ userId, stageName }).select('*').limit(1);
    if (error) throw error;
    a = data[0];
    console.log('[ensure_featured] created artist', stageName);
  }
  return a;
}

async function main() {
  const { u1, u2 } = await ensureSystemUsers();
  const a1 = await ensureArtist(u1.id, 'VX9');
  await ensureArtist(u2.id, 'Hope');

  if ((await count('Post')) === 0) {
    const { error } = await supa.from('Post').insert([
      { userId: u1.id, text: 'Welcome to ZION' },
      { userId: u2.id, text: 'Shipping day' },
    ]);
    if (error) throw error;
    console.log('[ensure_featured] seeded posts');
  }

  if ((await count('Track')) === 0) {
    const ins = { artistId: a1.id, title: 'Ignite', visibility: 'PUBLIC' };
    const { error } = await supa.from('Track').insert(ins);
    if (error) {
      // Fallback without visibility
      const { error: e2 } = await supa.from('Track').insert({ artistId: a1.id, title: 'Ignite' });
      if (e2) throw e2;
    }
    console.log('[ensure_featured] seeded track');
  }

  if ((await count('Product')) === 0) {
    const { error } = await supa.from('Product').insert({ title: 'ZION Tee', priceCents: 3500, currency: 'USD', inventory: 100 });
    if (error) throw error;
    console.log('[ensure_featured] seeded product');
  }

  if ((await count('Battle')) === 0) {
    const { error } = await supa.from('Battle').insert({ aUserId: u1.id, bUserId: u2.id });
    if (error) throw error;
    console.log('[ensure_featured] seeded battle');
  }

  if ((await count('LiveStream')) === 0) {
    const base = { creatorId: u1.id, title: 'Live Now', startedAt: new Date().toISOString(), visibility: 'PUBLIC' };
    const { error } = await supa.from('LiveStream').insert(base);
    if (error) {
      const { error: e2 } = await supa.from('LiveStream').insert({ creatorId: u1.id, title: 'Live Now', startedAt: new Date().toISOString() });
      if (e2) throw e2;
    }
    console.log('[ensure_featured] seeded live stream');
  }

  if ((await count('SurfSession')) === 0) {
    const { error } = await supa.from('SurfSession').insert({ userId: u1.id, youtubeVideoId: 'dQw4w9WgXcQ' });
    if (error) throw error;
    console.log('[ensure_featured] seeded surf session');
  }

  console.log('[ensure_featured] done');
}

main().catch((e) => { console.error(e); process.exit(1); });
