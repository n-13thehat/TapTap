import { NextResponse } from "next/server";
import { FeatureFlagManager } from "@/lib/features/flags";
import { getGenreTabs, getListingsForGenre } from "@/lib/marketplace/deezerListings";

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

export async function GET(req: Request) {
  try {
    const enabled = await deezerEnabled();
    if (!enabled) return NextResponse.json({ error: "Deezer marketplace is disabled" }, { status: 503 });

    const url = new URL(req.url);
    let genreId = url.searchParams.get("genreId");
    if (!genreId) {
      const tabs = await getGenreTabs(1);
      genreId = tabs[0]?.id ? String(tabs[0].id) : null;
    }
    if (!genreId) return NextResponse.json({ error: "No genres available" }, { status: 500 });

    const listings = await getListingsForGenre(genreId);
    return NextResponse.json({ ok: true, genreId, listings });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch Deezer listings" }, { status: 500 });
  }
}
