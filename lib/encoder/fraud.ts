import { prisma } from "@/lib/prisma";

export type FraudFindingKind =
  | "DUPLICATE_UID"
  | "GEO_VELOCITY"
  | "REPLAY_BURST"
  | "UID_MISMATCH"
  | "UNKNOWN_UID";

export type FraudSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type FraudFinding = {
  kind: FraudFindingKind;
  severity: FraudSeverity;
  details: Record<string, unknown>;
};

export type ActivationContext = {
  ttid: string;
  uid?: string | null;
  ip?: string | null;
  countryCode?: string | null;
  userId?: string | null;
};

const REPLAY_WINDOW_MS = 5_000;
const REPLAY_BURST_THRESHOLD = 5;
const GEO_VELOCITY_WINDOW_MS = 10 * 60 * 1000;

export async function evaluateActivation(ctx: ActivationContext): Promise<FraudFinding[]> {
  const findings: FraudFinding[] = [];

  const chip = await prisma.encodedChip.findUnique({
    where: { ttid: ctx.ttid },
    select: { id: true, uid: true, status: true },
  });

  if (!chip) {
    findings.push({
      kind: "UNKNOWN_UID",
      severity: "MEDIUM",
      details: { ttid: ctx.ttid, reason: "ttid not in chip table" },
    });
    return findings;
  }

  if (chip.status === "UNENCODED") {
    findings.push({
      kind: "UNKNOWN_UID",
      severity: "MEDIUM",
      details: { ttid: ctx.ttid, reason: "chip not yet encoded" },
    });
  }

  if (ctx.uid && chip.uid && ctx.uid !== chip.uid) {
    findings.push({
      kind: "UID_MISMATCH",
      severity: "HIGH",
      details: { ttid: ctx.ttid, expectedUid: chip.uid, presentedUid: ctx.uid },
    });
  }

  if (ctx.uid) {
    const dupes = await prisma.encodedChip.count({
      where: { uid: ctx.uid, NOT: { id: chip.id } },
    });
    if (dupes > 0) {
      findings.push({
        kind: "DUPLICATE_UID",
        severity: "CRITICAL",
        details: { uid: ctx.uid, conflicts: dupes },
      });
    }
  }

  const since = new Date(Date.now() - REPLAY_WINDOW_MS);
  const recentBurst = await prisma.chipActivation.count({
    where: { chipId: chip.id, createdAt: { gte: since } },
  });
  if (recentBurst >= REPLAY_BURST_THRESHOLD) {
    findings.push({
      kind: "REPLAY_BURST",
      severity: "HIGH",
      details: { windowMs: REPLAY_WINDOW_MS, count: recentBurst },
    });
  }

  if (ctx.countryCode) {
    const recent = await prisma.chipActivation.findFirst({
      where: {
        chipId: chip.id,
        countryCode: { not: null },
        createdAt: { gte: new Date(Date.now() - GEO_VELOCITY_WINDOW_MS) },
      },
      orderBy: { createdAt: "desc" },
      select: { countryCode: true, createdAt: true },
    });
    if (recent && recent.countryCode && recent.countryCode !== ctx.countryCode) {
      findings.push({
        kind: "GEO_VELOCITY",
        severity: "MEDIUM",
        details: {
          previousCountry: recent.countryCode,
          currentCountry: ctx.countryCode,
          windowMs: GEO_VELOCITY_WINDOW_MS,
        },
      });
    }
  }

  return findings;
}

export async function persistFindings(chipId: string, findings: FraudFinding[]) {
  if (findings.length === 0) return;
  await prisma.chipFraudSignal.createMany({
    data: findings.map((f) => ({
      chipId,
      kind: f.kind as any,
      severity: f.severity as any,
      details: f.details as any,
    })),
  });
  const hasHigh = findings.some((f) => f.severity === "HIGH" || f.severity === "CRITICAL");
  if (hasHigh) {
    await prisma.encodedChip.update({
      where: { id: chipId },
      data: { status: "FLAGGED" as any },
    });
  }
}
