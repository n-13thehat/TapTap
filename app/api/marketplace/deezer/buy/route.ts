import { NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { computeTapTax } from "@/lib/tax";
import {
  DEEZER_ALBUM_TAP_PRICE,
  DEEZER_TRACK_TAP_PRICE,
  getListingById,
} from "@/lib/marketplace/deezerListings";
import { FeatureFlagManager } from "@/lib/features/flags";

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

type Body = { listingId?: string };

export async function POST(req: Request) {
  try {
    const enabled = await deezerEnabled();
    if (!enabled) return NextResponse.json({ error: "Deezer marketplace is disabled" }, { status: 503 });

    const session = await auth();
    const userId = (session as any)?.user?.id as string | undefined;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = ((await req.json().catch(() => ({}))) || {}) as Body;
    const listingId = String(body?.listingId || "").trim();
    if (!listingId) return NextResponse.json({ error: "listingId required" }, { status: 400 });

    const listing = await getListingById(listingId);
    if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

    const priceTap = listing.type === "track" ? DEEZER_TRACK_TAP_PRICE : DEEZER_ALBUM_TAP_PRICE;
    const tax = computeTapTax(priceTap);
    const netTap = Math.max(0, priceTap - tax.tax);

    const db = prisma as any;
    const royalty = await db.externalArtistRoyalty.upsert({
      where: { source_sourceId: { source: "DEEZER", sourceId: listing.artistId } },
      update: { stageName: listing.artistName, pendingTap: { increment: netTap } },
      create: {
        source: "DEEZER",
        sourceId: listing.artistId,
        stageName: listing.artistName,
        pendingTap: netTap,
        status: "UNCLAIMED",
      },
      select: { id: true, pendingTap: true, status: true, stageName: true, sourceId: true },
    });

    const ledger = await db.externalRoyaltyLedger.create({
      data: {
        artistRoyaltyId: royalty.id,
        listingId,
        buyerUserId: userId,
        tapAmount: netTap,
        grossTap: priceTap,
        taxApplied: true,
      },
      select: { id: true },
    });

    return NextResponse.json({
      ok: true,
      listingId,
      royaltyId: royalty.id,
      ledgerId: ledger.id,
      pendingTap: royalty.pendingTap,
      netTap,
      priceTap,
      tax,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to process Deezer buy" }, { status: 500 });
  }
}
