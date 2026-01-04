import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { getUploadStore } from "@/lib/server/memoryStore";
import { dbGetUploadSession } from "@/lib/server/persistence";

function normalizeUploadedChunks(chunks: unknown): number[] {
  if (Array.isArray(chunks)) {
    return chunks.map((c) => Number(c)).filter((n) => Number.isFinite(n));
  }
  if (typeof chunks === "string") {
    try {
      const parsed = JSON.parse(chunks);
      if (Array.isArray(parsed)) {
        return parsed.map((c) => Number(c)).filter((n) => Number.isFinite(n));
      }
    } catch {
      return [];
    }
  }
  return [];
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const sessionId = resolvedParams?.id;
  if (!sessionId) {
    return NextResponse.json({ error: "Session id is required" }, { status: 400 });
  }

  const userSession = await auth().catch(() => null);
  const userId = (userSession?.user as any)?.id as string | undefined;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Primary source: Prisma UploadSession tied to the authenticated user
  try {
    const uploadSession = await prisma.uploadSession.findFirst({
      where: { id: sessionId, userId },
      select: {
        id: true,
        fileName: true,
        sizeBytes: true,
        chunkSize: true,
        totalChunks: true,
        uploadedBytes: true,
        uploadedChunks: true,
        status: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
        completedAt: true,
      },
    });

    if (uploadSession) {
      const uploadedChunks = normalizeUploadedChunks(uploadSession.uploadedChunks);
      const progress =
        uploadSession.totalChunks > 0
          ? (uploadSession.uploadedBytes / uploadSession.sizeBytes) * 100
          : 0;

      return NextResponse.json(
        {
          ...uploadSession,
          uploadedChunks,
          progress: Math.round(progress * 100) / 100,
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
  } catch (error) {
    console.error("[uploads] Prisma upload session fetch failed, falling back", error);
  }

  // Fallback to legacy lightweight DB table
  try {
    const session = await dbGetUploadSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    return NextResponse.json(session, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[uploads] DB fetch session failed, falling back to memory", err);
    const store = getUploadStore();
    const session = store.sessions[sessionId];
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    return NextResponse.json(session, { headers: { "Cache-Control": "no-store" } });
  }
}
