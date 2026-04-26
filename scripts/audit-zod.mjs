#!/usr/bin/env node
// Zod coverage audit for App Router API routes.
// Categorizes mutating routes by risk tier and reports zod usage.
import { readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { readdirSync } from 'node:fs';

const ROOT = process.cwd();
const API_DIR = join(ROOT, 'app', 'api');

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (entry === 'route.ts' || entry === 'route.tsx') out.push(p);
  }
  return out;
}

const RISK_TIERS = [
  { tier: 'CRITICAL', label: 'auth/payments/admin/wallet/swap/treasure/marketplace', pattern: /[\\/](auth|admin|payments?|wallet|solana|transfer|deposit|withdraw|treasury|treasure|marketplace|nft|signup|signin|2fa|password|reset|swap|exchange-rates?)[\\/]/i },
  { tier: 'HIGH',     label: 'creator/social/uploads/listings/distribution', pattern: /[\\/](creator|user|profile|social|messages?|posts?|comments?|follow|like|share|publish|moderation|report|subscribe|notif|uploads?|listings?|distribution|posterize|bandcamp|astro)/i },
  { tier: 'MEDIUM',   label: 'media, agents, analytics, settings, games', pattern: /[\\/](agents?|chat|media|track|album|playlist|surf|library|search|tag|settings?|preferences|analytics|metrics?|events?|battles?|stems|stemstation|tapgame|action|beta)/i },
  { tier: 'LOW',      label: 'webhooks, cron, internal, dev/demo', pattern: /[\\/](webhooks?|cron|internal|debug|dev|demo|seed|backfill|health|status|ping)/i },
];

function classify(path) {
  for (const t of RISK_TIERS) if (t.pattern.test(path)) return t.tier;
  return 'UNCATEGORIZED';
}

const files = walk(API_DIR).sort();
const summary = { total: files.length, withZod: 0, mutating: 0, mutatingNoZod: 0 };
const buckets = { CRITICAL: [], HIGH: [], MEDIUM: [], LOW: [], UNCATEGORIZED: [] };

for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const verbs = [...src.matchAll(/export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/g)].map((m) => m[1]);
  const mutates = verbs.some((v) => v !== 'GET' && v !== 'HEAD' && v !== 'OPTIONS');
  const hasZod = /from ['"]zod['"]/.test(src);
  const parsesBody = /req\.json\(\)|request\.json\(\)|formData\(\)/.test(src);
  if (hasZod) summary.withZod++;
  if (mutates) summary.mutating++;
  if (mutates && !hasZod && parsesBody) {
    summary.mutatingNoZod++;
    const rel = relative(ROOT, f).split(sep).join('/');
    buckets[classify(rel)].push({ path: rel, verbs: verbs.join(',') });
  }
}

console.log('=== Zod Coverage Audit ===');
console.log(`Total route.ts files:           ${summary.total}`);
console.log(`Routes importing zod:           ${summary.withZod} (${((summary.withZod / summary.total) * 100).toFixed(1)}%)`);
console.log(`Mutating routes (POST/PUT/...): ${summary.mutating}`);
console.log(`Mutating + parses body w/o zod: ${summary.mutatingNoZod}  <-- triage queue`);
console.log('');

for (const tier of ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNCATEGORIZED']) {
  const list = buckets[tier];
  if (!list.length) continue;
  console.log(`--- ${tier} (${list.length}) ---`);
  for (const { path, verbs } of list) console.log(`  [${verbs}] ${path}`);
  console.log('');
}
