import { prisma } from "@/lib/prisma";
import { evaluateActivation, persistFindings, type ActivationContext } from "./fraud";

export type ActivationResult = {
  ok: boolean;
  isFirst: boolean;
  ttid: string;
  status: string | null;
  payload: { type: string | null; id: string | null };
  fraudSignals: Array<{ kind: string; severity: string }>;
};

export async function recordActivation(ctx: ActivationContext): Promise<ActivationResult> {
  const findings = await evaluateActivation(ctx);

  const chip = await prisma.encodedChip.findUnique({
    where: { ttid: ctx.ttid },
    select: {
      id: true,
      status: true,
      payloadType: true,
      payloadId: true,
      activatedAt: true,
    },
  });

  if (!chip) {
    return {
      ok: false,
      isFirst: false,
      ttid: ctx.ttid,
      status: null,
      payload: { type: null, id: null },
      fraudSignals: findings.map((f) => ({ kind: f.kind, severity: f.severity })),
    };
  }

  const isFirst = !chip.activatedAt;

  await prisma.chipActivation.create({
    data: {
      chipId: chip.id,
      userId: ctx.userId ?? null,
      ip: ctx.ip ?? null,
      countryCode: ctx.countryCode ?? null,
      isFirst,
    },
  });

  if (isFirst && chip.status === "ENCODED") {
    await prisma.encodedChip.update({
      where: { id: chip.id },
      data: { activatedAt: new Date(), status: "ACTIVATED" as any },
    });
  }

  await persistFindings(chip.id, findings);

  return {
    ok: findings.every((f) => f.severity !== "CRITICAL"),
    isFirst,
    ttid: ctx.ttid,
    status: chip.status,
    payload: { type: chip.payloadType ?? null, id: chip.payloadId ?? null },
    fraudSignals: findings.map((f) => ({ kind: f.kind, severity: f.severity })),
  };
}
