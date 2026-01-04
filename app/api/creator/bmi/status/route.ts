import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSupabaseUser } from "@/lib/server/supabase";

export async function GET() {
  try {
    const { supabase, user } = await requireSupabaseUser();

    const [{ data: tracks }, connection, registrations, performances] = await Promise.all([
      supabase
        .from("Track")
        .select(
          "id,title,priceCents,coverUrl,audioUrl,createdAt,status,meta,durationMs"
        )
        .eq("userId", user.id)
        .eq("status", "published")
        .order("createdAt", { ascending: false })
        .limit(20),
      prisma.bmiConnection.findUnique({ where: { userId: user.id } }),
      prisma.bmiTrackRegistration.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.bmiPerformanceLog.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const registeredTracks = new Set(registrations.map((row) => row.trackId));

    const mintedTracks = (tracks || []).map((track: any) => ({
      id: track.id,
      title: track.title,
      priceCents: track.priceCents ?? null,
      coverUrl: track.coverUrl ?? null,
      audioUrl: track.audioUrl ?? null,
      durationMs: track.durationMs ?? null,
      mintedAt: track.createdAt ?? null,
      meta: track.meta ?? null,
      registered: registeredTracks.has(track.id),
    }));

    const recentPerformances = performances.map((log) => ({
      id: log.id,
      title: log.title,
      streamDate: log.streamDate.toISOString(),
      durationMinutes: log.durationMinutes,
      audienceCount: log.audienceCount,
      syncedAt: log.syncedAt ? log.syncedAt.toISOString() : null,
    }));

    return NextResponse.json({
      connected: Boolean(connection?.accessToken),
      connection: {
        connectedAt: connection?.connectedAt?.toISOString() ?? null,
        expiresAt: connection?.expiresAt?.toISOString() ?? null,
      },
      mintedTracks,
      recentPerformances,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "BMI status fetch failed" },
      { status: 500 }
    );
  }
}
