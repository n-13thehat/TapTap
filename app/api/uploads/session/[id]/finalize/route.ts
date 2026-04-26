import { NextResponse } from "next/server";
import { getUploadStore, persistStore } from "@/lib/server/memoryStore";
import { dbFinalizeUploadSession } from "@/lib/server/persistence";
import { finalizeChunks } from "@/lib/server/uploadStorage";
import { auth } from "@/auth.config";
import { notifyAgentEvent } from "@/lib/agents/notify";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const sessionId = resolvedParams?.id;
  const session = await auth().catch(() => null);
  const userId = (session as any)?.user?.id as string | undefined;
  try {
    const { storageKey } = await finalizeChunks(sessionId, "upload.bin");
    const updated = await dbFinalizeUploadSession(sessionId, storageKey);
    if (!updated) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (userId) {
      notifyAgentEvent({
        userId,
        eventType: "upload.completed",
        data: { sessionId, title: updated.fileName, storageKey },
      });
    }
    return NextResponse.json({ status: "ok", sessionId });
  } catch (err) {
    console.error("[uploads] DB finalize failed, falling back to memory", err);
    const store = getUploadStore();
    const memSession = store.sessions[sessionId];
    if (!memSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    try {
      const { storageKey } = await finalizeChunks(sessionId, memSession?.fileName ?? "upload.bin");
      memSession.status = "completed";
      memSession.finalizedAt = new Date().toISOString();
      memSession.uploadedBytes = Math.max(memSession.uploadedBytes, memSession.sizeBytes);
      (memSession as any).storageKey = storageKey;
    } catch {
      memSession.status = "failed";
    }

    await persistStore();

    if (userId && memSession.status === "completed") {
      notifyAgentEvent({
        userId,
        eventType: "upload.completed",
        data: { sessionId, title: memSession.fileName, storageKey: (memSession as any).storageKey },
      });
    }

    return NextResponse.json({ status: "ok", sessionId });
  }
}
