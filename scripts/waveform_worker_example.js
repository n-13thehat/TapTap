/**
 * Example offline worker to compute a naive waveform and POST to the app webhook.
 * Usage:
 *   node scripts/waveform_worker_example.js <trackId> <url> <webhook> <secret>
 */
import fs from "fs";
import https from "https";
import http from "http";

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode}`));
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });
}

function naiveWaveform(buf, points = 128) {
  // Naive byte-based sampling for demo only (NOT a real audio decode)
  const len = buf.length;
  const step = Math.max(1, Math.floor(len / points));
  const arr = [];
  for (let i = 0; i < points; i++) {
    const start = i * step;
    const end = Math.min(len, start + step);
    let sum = 0;
    for (let j = start; j < end; j++) sum += buf[j];
    const avg = sum / Math.max(1, end - start);
    arr.push(Math.min(1, Math.max(0, avg / 255)));
  }
  return arr;
}

async function main() {
  const [trackId, url, webhook, secret] = process.argv.slice(2);
  if (!trackId || !url || !webhook || !secret) {
    console.error("Usage: node scripts/waveform_worker_example.js <trackId> <url> <webhook> <secret>");
    process.exit(1);
  }
  const buf = await fetchBuffer(url);
  const points = naiveWaveform(buf, 256);
  const payload = JSON.stringify({ trackId, points });
  const res = await fetch(webhook, {
    method: "POST",
    headers: { "content-type": "application/json", "x-signature": secret },
    body: payload,
  });
  console.log("Webhook status:", res.status, await res.text());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

