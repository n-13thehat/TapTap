import { NextResponse } from "next/server";
import { buildBmiAuthUrl, getBmiConnection } from "@/lib/bmi";
import { requireSupabaseUser } from "@/lib/server/supabase";

export async function POST() {
  try {
    const { user } = await requireSupabaseUser();
    const redirectUrl = await buildBmiAuthUrl(user.id);
    const connection = await getBmiConnection(user.id);
    return NextResponse.json({
      ok: true,
      redirectUrl,
      connected: Boolean(connection?.accessToken),
      message:
        connection?.accessToken
          ? "BMI link refreshed. Use the portal tab to continue."
          : "BMI OAuth started. A new tab will open shortly.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unable to initialize BMI connection" },
      { status: 500 }
    );
  }
}
