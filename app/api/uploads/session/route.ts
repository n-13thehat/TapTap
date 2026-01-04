import { NextRequest, NextResponse } from "next/server";
import { getUploadStore, generateId, persistStore } from "@/lib/server/memoryStore";
import { dbCreateUploadSession } from "@/lib/server/persistence";
import { cleanupChunks } from "@/lib/server/uploadStorage";

const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as {
    fileName?: string;
    sizeBytes?: number;
    mimeType?: string;
  } | null;

  const fileName = (body?.fileName || "").trim();
  const sizeBytes = Number(body?.sizeBytes ?? 0);
  const mimeType = (body?.mimeType || "application/octet-stream").trim();

  if (!fileName || !Number.isFinite(sizeBytes) || sizeBytes < 0) {
    return NextResponse.json({ error: "fileName and sizeBytes are required" }, { status: 400 });
  }

  const chunkSize = DEFAULT_CHUNK_SIZE;
  const totalChunks = sizeBytes === 0 ? 0 : Math.ceil(sizeBytes / chunkSize);

  try {
    const session = await dbCreateUploadSession({
      fileName,
      sizeBytes,
      mimeType,
      chunkSize,
      totalChunks,
    });
    return NextResponse.json(session, { status: 201 });
  } catch (err) {
    console.error("[uploads] DB create session failed, falling back to memory", err);
    const session = {
      id: generateId("upload"),
      fileName,
      sizeBytes,
      mimeType,
      chunkSize,
      totalChunks,
      uploadedChunks: [] as number[],
      uploadedBytes: 0,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
    };
    const store = getUploadStore();
    store.sessions[session.id] = session;
    await cleanupChunks(session.id).catch(() => {});
    await persistStore();
    return NextResponse.json(session, { status: 201 });
  }
}
