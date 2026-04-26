import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { notifyAgentEvent } from "@/lib/agents/notify";

export const dynamic = "force-dynamic";

const ActionBody = z.object({
  action: z.enum(["approve", "reject"]),
  note: z.string().trim().max(500).optional(),
});

async function requireAdmin() {
  const session = await auth();
  const email = (session as any)?.user?.email as string | undefined;
  if (!email) return null;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });
  if (!user || (user.role as any) !== "ADMIN") return null;
  return user;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    const raw = await req.json().catch(() => null);
    const parsed = ActionBody.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
    }
    const { action, note } = parsed.data;

    const db = prisma as any;
    const royalty = await db.externalArtistRoyalty.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        pendingTap: true,
        stageName: true,
        source: true,
        claimedByUserId: true,
      },
    });
    if (!royalty) return NextResponse.json({ error: "Payout not found" }, { status: 404 });
    if (royalty.status !== "PENDING_APPROVAL") {
      return NextResponse.json(
        { error: `Payout is ${String(royalty.status).toLowerCase()}, not pending approval` },
        { status: 409 },
      );
    }
    if (!royalty.claimedByUserId) {
      return NextResponse.json({ error: "Payout has no claimant" }, { status: 409 });
    }

    if (action === "approve") {
      const credit = Math.max(0, Number(royalty.pendingTap || 0));
      await db.$transaction([
        db.externalArtistRoyalty.update({
          where: { id: royalty.id },
          data: { status: "CLAIMED", pendingTap: 0 },
        }),
        ...(credit > 0
          ? [
              db.tapCoinTransaction.create({
                data: {
                  userId: royalty.claimedByUserId,
                  amount: credit,
                  reason: `ROYALTY_CLAIM_${royalty.source}`,
                },
              }),
            ]
          : []),
      ]);

      await prisma.auditLog
        ?.create({
          data: {
            action: "ROYALTY_PAYOUT_APPROVED",
            userId: admin.id,
            targetUserId: royalty.claimedByUserId,
            details: { royaltyId: royalty.id, source: royalty.source, stageName: royalty.stageName, creditedTap: credit, note: note ?? null },
          },
        })
        .catch(() => {});

      notifyAgentEvent({
        userId: royalty.claimedByUserId,
        eventType: "royalty.payout_approved",
        data: {
          royaltyId: royalty.id,
          stageName: royalty.stageName,
          source: royalty.source,
          creditedTap: credit,
        },
      });

      return NextResponse.json({
        ok: true,
        royaltyId: royalty.id,
        creditedTap: credit,
        creditedUserId: royalty.claimedByUserId,
        status: "CLAIMED",
      });
    }

    // reject
    await db.externalArtistRoyalty.update({
      where: { id: royalty.id },
      data: { status: "DISPUTED" },
    });

    await prisma.auditLog
      ?.create({
        data: {
          action: "ROYALTY_PAYOUT_REJECTED",
          userId: admin.id,
          targetUserId: royalty.claimedByUserId,
          details: { royaltyId: royalty.id, source: royalty.source, stageName: royalty.stageName, pendingTap: royalty.pendingTap, note: note ?? null },
        },
      })
      .catch(() => {});

    notifyAgentEvent({
      userId: royalty.claimedByUserId,
      eventType: "royalty.payout_rejected",
      data: {
        royaltyId: royalty.id,
        stageName: royalty.stageName,
        source: royalty.source,
        pendingTap: royalty.pendingTap,
        note: note ?? "",
      },
    });

    return NextResponse.json({
      ok: true,
      royaltyId: royalty.id,
      status: "DISPUTED",
      rejectedClaimantId: royalty.claimedByUserId,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to process payout" }, { status: 500 });
  }
}
