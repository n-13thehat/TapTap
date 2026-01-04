import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { generateKeypair, encryptSecret, airdropSol, mintTapTo } from "@/lib/solana";

export async function POST() {
  const session = await auth();
  const email = (session as any)?.user?.email as string | undefined;
  if (!email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });
    const existing = await prisma.wallet.findFirst({ where: { userId: user.id, provider: "SOLANA" as any } });
    if (existing) return Response.json({ ok: true, address: existing.address });

    const kp = await generateKeypair();
    const enc = encryptSecret(kp.secretKey);
    const w = await prisma.wallet.create({ data: { userId: user.id, address: kp.publicKey, provider: "SOLANA" as any } });
    await prisma.setting.upsert({
      where: { userId_key: { userId: w.id, key: "sol:secret" } },
      update: { value: enc as any },
      create: { userId: w.id, key: "sol:secret", value: enc as any },
    });
    await airdropSol(kp.publicKey, 1_000_000);
    await mintTapTo(kp.publicKey, 100);
    return Response.json({ ok: true, address: kp.publicKey.toString() });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}
