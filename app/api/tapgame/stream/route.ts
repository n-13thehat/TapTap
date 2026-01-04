import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import path from "path";
import fs, { promises as fsp } from "fs";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const fileName = url.searchParams.get("file");

  if (!fileName) {
    return NextResponse.json({ error: "Missing file parameter" }, { status: 400 });
  }

  // Basic safety: block path traversal and weird inputs.
  if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
    return NextResponse.json({ error: "Invalid file parameter" }, { status: 400 });
  }

  const baseDir = path.join(
    process.cwd(),
    "app",
    "stemstation",
    "Music For The Future -vx9"
  );

  const filePath = path.join(baseDir, fileName);

  try {
    const stat = await fsp.stat(filePath);
    const range = request.headers.get("range");

    if (range) {
      const match = range.match(/bytes=(\d+)-(\d*)/);
      if (!match) {
        return NextResponse.json({ error: "Invalid range" }, { status: 416 });
      }
      const start = Number(match[1]);
      const end = match[2] ? Math.min(stat.size - 1, Number(match[2])) : stat.size - 1;
      if (start >= stat.size || Number.isNaN(start) || Number.isNaN(end) || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${stat.size}` },
        });
      }
      const chunkSize = end - start + 1;
      const stream = fs.createReadStream(filePath, { start, end });
      return new NextResponse(stream as any, {
        status: 206,
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": String(chunkSize),
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    const data = await fsp.readFile(filePath);
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(stat.size),
        "Accept-Ranges": "bytes",
      },
    });
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    console.error("STEMSTATION stream error", error);
    return NextResponse.json({ error: "Failed to stream audio" }, { status: 500 });
  }
}
