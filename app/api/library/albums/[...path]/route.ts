import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALBUMS_ROOT = path.join(process.cwd(), "app", "api", "library", "albums");

function contentTypeFor(file: string) {
  const ext = file.toLowerCase();
  if (ext.endsWith(".mp3")) return "audio/mpeg";
  if (ext.endsWith(".wav")) return "audio/wav";
  if (ext.endsWith(".flac")) return "audio/flac";
  if (ext.endsWith(".m4a")) return "audio/mp4";
  if (ext.endsWith(".jpg") || ext.endsWith(".jpeg")) return "image/jpeg";
  if (ext.endsWith(".png")) return "image/png";
  return "application/octet-stream";
}

export async function GET(
  _req: Request,
  ctx: { params: { path: string[] } } | { params: Promise<{ path: string[] }> },
) {
  try {
    const resolvedParams = "then" in ctx.params ? await ctx.params : ctx.params;
    const segments = (resolvedParams?.path || []).map((s) =>
      decodeURIComponent(s),
    );
    const target = path.join(ALBUMS_ROOT, ...segments);
    const resolved = path.resolve(target);
    if (!resolved.startsWith(ALBUMS_ROOT)) {
      return NextResponse.json({ error: "invalid path" }, { status: 400 });
    }

    const stat = await fs.promises.stat(resolved).catch(() => null);
    if (!stat || !stat.isFile()) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const stream = fs.createReadStream(resolved);
    return new NextResponse(stream as any, {
      headers: {
        "content-type": contentTypeFor(resolved),
        "cache-control": "public, max-age=3600",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "failed to read album asset" },
      { status: 500 },
    );
  }
}
