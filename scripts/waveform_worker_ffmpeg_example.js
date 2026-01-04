/**
 * Example worker that uses ffmpeg to read PCM and computes a simple waveform.
 * Requires ffmpeg installed and available in PATH.
 *
 * Usage:
 *   node scripts/waveform_worker_ffmpeg_example.js <trackId> <url> <webhook> <secret>
 */
import { spawn } from "child_process";
import https from "https";
import http from "http";
import fs from "fs";
import os from "os";
import path from "path";

function download(url, out) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(out);
    client
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode}`));
        res.pipe(file);
        res.on("end", () => file.close(() => resolve(out)));
      })
      .on("error", reject);
  });
}

function ffmpegPcm(file) {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", ["-i", file, "-f", "f32le", "-ac", "1", "-ar", "8000", "pipe:1"], {
      stdio: ["ignore", "pipe", "inherit"],
    });
    const chunks = [];
    proc.stdout.on("data", (c) => chunks.push(c));
    proc.on("close", (code) => {
      if (code !== 0) return reject(new Error(`ffmpeg exited ${code}`));
      resolve(Buffer.concat(chunks));
    });
  });
}

function bufferToFloats(buf) {
  const arr = [];
  for (let i = 0; i < buf.length; i += 4) {
    arr.push(buf.readFloatLE(i));
  }
  return arr;
}

function computeWaveform(floats, points = 256) {
  const len = floats.length;
  const step = Math.max(1, Math.floor(len / points));
  const out = [];
  for (let i = 0; i < points; i++) {
    const start = i * step;
    const end = Math.min(len, start + step);
    let peak = 0;
    for (let j = start; j < end; j++) peak = Math.max(peak, Math.abs(floats[j]));
    out.push(Math.min(1, Math.max(0, peak)));
  }
  return out;
}

async function main() {
  const [trackId, url, webhook, secret] = process.argv.slice(2);
  if (!trackId || !url || !webhook || !secret) {
    console.error("Usage: node scripts/waveform_worker_ffmpeg_example.js <trackId> <url> <webhook> <secret>");
    process.exit(1);
  }
  const tmp = path.join(os.tmpdir(), `taptap-${Date.now()}.mp3`);
  await download(url, tmp);
  const pcm = await ffmpegPcm(tmp);
  const floats = bufferToFloats(pcm);
  const points = computeWaveform(floats, 512);
  fs.unlink(tmp, () => {});
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

