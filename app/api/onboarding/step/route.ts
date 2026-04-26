import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { generateOnboardingBio } from "@/lib/agents/onboarding";

export const dynamic = "force-dynamic";

const StepBody = z.object({
  step: z.number().int().min(1).max(6),
  payload: z.record(z.any()).default({}),
});

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session as any)?.user?.id as string | undefined;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = await req.json().catch(() => ({}));
  const parsed = StepBody.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const { step, payload } = parsed.data;

  // Persist the raw answers for every step so the wizard is resumable.
  await prisma.setting.upsert({
    where: { userId_key: { userId, key: `onboarding:answers:${step}` } },
    update: { value: JSON.stringify(payload) },
    create: { userId, key: `onboarding:answers:${step}`, value: JSON.stringify(payload) },
  });

  let result: Record<string, unknown> = { ok: true };

  try {
    if (step === 2) {
      // Fable: generate a bio from the Muse interview answers.
      const answersRow = await prisma.setting.findUnique({
        where: { userId_key: { userId, key: "onboarding:answers:1" } },
        select: { value: true },
      });
      const answers = answersRow?.value ? safeParse(answersRow.value) : {};
      const bio = await generateOnboardingBio(answers);
      const username = (session as any)?.user?.username || (session as any)?.user?.name || "";
      const displayName = (payload.displayName as string | undefined)?.trim() || username || null;
      await prisma.user.update({
        where: { id: userId },
        data: { bio },
      });
      await prisma.profile.upsert({
        where: { userId },
        update: { displayName: displayName ?? undefined },
        create: { userId, displayName: displayName ?? username },
      });
      result.bio = bio;
    } else if (step === 5) {
      // Merit: assign role from the user's selection.
      const role = payload.role === "CREATOR" ? "CREATOR" : "LISTENER";
      await prisma.user.update({
        where: { id: userId },
        data: { role: role as any },
      });
      result.role = role;
    } else if (step === 6) {
      // Treasure: stamp the user's Tier-0 TapPass with the beta-pioneer perk.
      const pass = await prisma.tapPass.findFirst({
        where: { userId, isActive: true },
        orderBy: { createdAt: "desc" },
        select: { id: true, features: true },
      });
      if (pass) {
        const features = Array.isArray(pass.features) ? pass.features : [];
        const next = Array.from(new Set([...features, "beta_pioneer"]));
        await prisma.tapPass.update({
          where: { id: pass.id },
          data: { features: next as any },
        });
        result.features = next;
      }
    }
  } catch (err: any) {
    console.error(`[onboarding/step] step ${step} action failed`, err);
    result = { ok: false, error: "Step action failed; answers were saved." };
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result);
}

function safeParse(value: string): Record<string, any> {
  try {
    const v = JSON.parse(value);
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}
