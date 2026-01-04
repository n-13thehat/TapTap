import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getServerFlags } from "@/lib/features";
import { Buffer } from "node:buffer";

export const dynamic = "force-dynamic";

const SILENT_AUDIO = buildSilentWave(0.5);

function buildSilentWave(durationSec: number, sampleRate = 22050) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataLength = Math.round(sampleRate * durationSec) * blockAlign;
  const buffer = Buffer.alloc(44 + dataLength);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataLength, 40);
  return buffer;
}

export async function GET(req: NextRequest) {
  const flags = getServerFlags(req.headers.get("cookie") || "");
  if (flags.surfPaywall && !flags.betaUnlock) {
    return NextResponse.json({ error: "TapPass required to stream Surf", paywall: true }, { status: 402 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || searchParams.get("videoId");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try {
    const ytdl = (await import("ytdl-core")).default;
    if (!ytdl.validateID(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const stream = ytdl(id, { quality: 'highestaudio', filter: 'audioonly', dlChunkSize: 0 });
    const headers = new Headers();
    headers.set("content-type", "audio/mpeg");
    headers.set("cache-control", "no-store");
    // @ts-ignore Node Readable is acceptable for Response in Node runtime
    return new Response(stream as any, { status: 200, headers });
  } catch (e: any) {
    console.error("surf stream failed", e?.message || e);
    const fallbackHeaders = new Headers({
      "content-type": "audio/wav",
      "cache-control": "no-store",
    });
    return new Response(SILENT_AUDIO, { status: 200, headers: fallbackHeaders });
    return NextResponse.json({ error: e?.message || "Failed to stream" }, { status: 500 });
  }
}
