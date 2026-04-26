import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { FeatureFlagManager } from "@/lib/features/flags";
import { notifyAgentEvent } from "@/lib/agents/notify";

export const dynamic = "force-dynamic";

const ClaimBody = z.object({
  claimToken: z.string().trim().min(8).max(128),
});

async function deezerEnabled() {
  const envDisabled = String(process.env.DEEZER_MARKET_DISABLED || "").toLowerCase() === "true";
  if (envDisabled) return false;
  try {
    return await FeatureFlagManager.isEnabled("deezerMarket");
  } catch {
    return true;
  }
}

export async function POST(req: Request) {
  try {
    const enabled = await deezerEnabled();
    if (!enabled) return NextResponse.json({ error: "Deezer marketplace is disabled" }, { status: 503 });

    const session = await auth();
    const userId = (session as any)?.user?.id as string | undefined;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const raw = await req.json().catch(() => null);
    const parsed = ClaimBody.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
    }
    const { claimToken } = parsed.data;

    const db = prisma as any;
    const royalty = await db.externalArtistRoyalty.findFirst({
      where: { claimToken },
      select: { id: true, status: true, pendingTap: true, stageName: true, sourceId: true, source: true },
    });
    if (!royalty) return NextResponse.json({ error: "Claim token not found" }, { status: 404 });
    if (royalty.status !== "UNCLAIMED") {
      return NextResponse.json({ error: `Royalty is ${String(royalty.status).toLowerCase()}` }, { status: 409 });
    }

    const updated = await db.externalArtistRoyalty.update({
      where: { id: royalty.id },
      data: {
        status: "PENDING_APPROVAL",
        claimedByUserId: userId,
        claimToken: null,
      },
      select: { id: true, status: true, claimedByUserId: true, stageName: true, pendingTap: true },
    });

    notifyAgentEvent({
      userId,
      eventType: "royalty.claim_submitted",
      data: {
        royaltyId: updated.id,
        stageName: updated.stageName,
        pendingTap: updated.pendingTap,
        source: royalty.source,
      },
    });

    return NextResponse.json({
      ok: true,
      royaltyId: updated.id,
      stageName: updated.stageName,
      pendingTap: updated.pendingTap,
      status: updated.status,
      message: "Submitted for admin approval. You will be credited once an admin reviews and approves the payout.",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to claim royalty" }, { status: 500 });
  }
}
