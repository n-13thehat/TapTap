import { NextResponse } from "next/server";
import { getUploadStore, persistStore } from "@/lib/server/memoryStore";
import { dbFinalizeUploadSession } from "@/lib/server/persistence";
import { finalizeChunks } from "@/lib/server/uploadStorage";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const sessionId = resolvedParams?.id;
  try {
    const { storageKey } = await finalizeChunks(sessionId, "upload.bin");
    const updated = await dbFinalizeUploadSession(sessionId, storageKey);
    if (!updated) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    return NextResponse.json({ status: "ok", sessionId });
  } catch (err) {
    console.error("[uploads] DB finalize failed, falling back to memory", err);
    const store = getUploadStore();
    const session = store.sessions[sessionId];
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    try {
      const { storageKey } = await finalizeChunks(sessionId, session?.fileName ?? "upload.bin");
      session.status = "completed";
      session.finalizedAt = new Date().toISOString();
      session.uploadedBytes = Math.max(session.uploadedBytes, session.sizeBytes);
      (session as any).storageKey = storageKey;
    } catch {
      session.status = "failed";
    }

    await persistStore();

    return NextResponse.json({ status: "ok", sessionId });
  }
}
