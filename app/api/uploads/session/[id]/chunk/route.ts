import { NextRequest, NextResponse } from "next/server";
import { getUploadStore, persistStore } from "@/lib/server/memoryStore";
import { dbGetUploadSession, dbMarkChunkUploaded } from "@/lib/server/persistence";
import { writeChunk } from "@/lib/server/uploadStorage";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const sessionId = resolvedParams?.id;
  const indexParam = req.nextUrl.searchParams.get("index");
  const index = Number(indexParam);

  if (!Number.isInteger(index) || index < 0) {
    return NextResponse.json({ error: "Invalid chunk index" }, { status: 400 });
  }

  try {
    // Consume the body to avoid hanging the stream and persist chunk to disk
    const body = await req.arrayBuffer().catch(() => new ArrayBuffer(0));
    const bytesReceived = body.byteLength;
    await writeChunk(sessionId, index, body);

    const session = await dbGetUploadSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (session.status === "completed") {
      return NextResponse.json({ error: "Session already finalized" }, { status: 400 });
    }
    if (session.totalChunks !== 0 && index >= session.totalChunks) {
      return NextResponse.json({ error: "Chunk index out of range" }, { status: 400 });
    }

    const estimatedBytes = Math.min(
      session.sizeBytes,
      Math.max(
        session.uploadedBytes,
        session.uploadedChunks.length * session.chunkSize,
        index * session.chunkSize + bytesReceived
      )
    );

    const updated = await dbMarkChunkUploaded(session.id, index, estimatedBytes);
    if (!updated) {
      return NextResponse.json({ error: "Failed to update chunk" }, { status: 500 });
    }

    return NextResponse.json({
      uploadedChunks: updated.uploadedChunks,
      uploadedBytes: updated.uploadedBytes,
      chunkIndex: index,
    });
  } catch (err) {
    console.error("[uploads] DB chunk update failed, falling back to memory", err);

    const body = await req.arrayBuffer().catch(() => new ArrayBuffer(0));
    const bytesReceived = body.byteLength;
    await writeChunk(sessionId, index, body).catch(() => {});

    const store = getUploadStore();
    const session = store.sessions[sessionId];
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (session.status === "completed") {
      return NextResponse.json({ error: "Session already finalized" }, { status: 400 });
    }

    if (session.totalChunks !== 0 && index >= session.totalChunks) {
      return NextResponse.json({ error: "Chunk index out of range" }, { status: 400 });
    }

    if (!session.uploadedChunks.includes(index)) {
      session.uploadedChunks.push(index);
      session.uploadedChunks.sort((a, b) => a - b);
    }

    const estimatedBytes = Math.min(
      session.sizeBytes,
      Math.max(session.uploadedBytes, session.uploadedChunks.length * session.chunkSize, index * session.chunkSize + bytesReceived)
    );
    session.uploadedBytes = estimatedBytes;

    await persistStore();

    return NextResponse.json({
      uploadedChunks: session.uploadedChunks,
      uploadedBytes: session.uploadedBytes,
      chunkIndex: index,
    });
  }
}
