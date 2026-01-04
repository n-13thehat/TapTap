import { NextResponse } from "next/server";
import { FeatureFlagManager } from "@/lib/features/flags";
import { getGenreTopSummary, mapAlbumToListing, mapTrackToListing } from "@/lib/marketplace/deezerListings";

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
    const genreId = url.searchParams.get("genreId");
    if (!genreId) return NextResponse.json({ error: "genreId required" }, { status: 400 });

    const summary = await getGenreTopSummary(genreId);
    const artists = summary.map((row) => ({
      artist: {
        id: row.artist.id,
        name: row.artist.name,
        picture: row.artist.picture,
        picture_medium: (row.artist as any).picture_medium,
        link: row.artist.link,
      },
      topTrack: row.topTrack ? mapTrackToListing(row.topTrack, genreId) : null,
      topAlbum: row.topAlbum ? mapAlbumToListing(row.topAlbum, genreId) : null,
    }));

    return NextResponse.json({ ok: true, genreId, artists });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch Deezer genre top" }, { status: 500 });
  }
}
