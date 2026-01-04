import { NextResponse } from "next/server";
import { getUploadStore, persistStore } from "@/lib/server/memoryStore";
import { dbGetUploadSession, dbFinalizeUploadSession } from "@/lib/server/persistence";
import { cleanupChunks } from "@/lib/server/uploadStorage";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const sessionId = resolvedParams?.id;

  try {
    const session = await dbGetUploadSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    await cleanupChunks(sessionId);
    await dbFinalizeUploadSession(sessionId, session.storageKey ?? null);
    return NextResponse.json({ status: "rolled_back", sessionId });
  } catch (err) {
    console.error("[uploads] rollback failed in DB, falling back to memory", err);
    const store = getUploadStore();
    const session = store.sessions[sessionId];
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    await cleanupChunks(sessionId).catch(() => {});
    session.status = "failed";
    await persistStore();
    return NextResponse.json({ status: "rolled_back", sessionId });
  }
}
