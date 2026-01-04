import { NextResponse } from "next/server";
import { FeatureFlagManager } from "@/lib/features/flags";
import { getGenreTabs } from "@/lib/marketplace/deezerListings";

export const dynamic = "force-dynamic";

async function deezerEnabled() {
  const envDisabled = String(process.env.DEEZER_MARKET_DISABLED || "").toLowerCase() === "true";
  if (envDisabled) return false;
  try {
    return await FeatureFlagManager.isEnabled("deezerMarket");
  } catch {
    return true;
  }
}

export async function GET() {
  try {
    const enabled = await deezerEnabled();
    if (!enabled) return NextResponse.json({ error: "Deezer marketplace is disabled" }, { status: 503 });

    const genres = await getGenreTabs();
    return NextResponse.json({ ok: true, genres });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch Deezer genres" }, { status: 500 });
  }
}
