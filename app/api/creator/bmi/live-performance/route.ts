import { NextResponse } from "next/server";
import { logBmiPerformance } from "@/lib/bmi";
import { requireSupabaseUser } from "@/lib/server/supabase";

export async function POST(request: Request) {
  try {
    const { user } = await requireSupabaseUser();
    const body = await request.json();
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "Performance title is required" }, { status: 400 });
    }
    const audienceCount = Number.isFinite(Number(body?.audienceCount)) ? Number(body?.audienceCount) : 0;
    const durationMinutes = Number.isFinite(Number(body?.durationMinutes)) ? Number(body?.durationMinutes) : 0;
    const streamDate =
      typeof body?.streamDate === "string" && body.streamDate
        ? body.streamDate
        : new Date().toISOString().split("T")[0];

    const log = await logBmiPerformance(user.id, {
      title,
      audienceCount,
      durationMinutes,
      streamDate,
    });

    return NextResponse.json({
      ok: true,
      message: `Performance "${title}" synchronized with BMI performance logs.`,
      payload: {
        id: log.id,
        title,
        audienceCount,
        durationMinutes,
        streamDate,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to push live performance" },
      { status: 500 }
    );
  }
}
