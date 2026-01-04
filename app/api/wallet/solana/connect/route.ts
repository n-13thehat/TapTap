import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";

type Body = { address?: string };

export async function POST(req: Request) {
  const session = await auth();
  const email = (session as any)?.user?.email as string | undefined;
  if (!email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });
    const { address } = (await req.json()) as Body;
    if (!address) return Response.json({ error: "address required" }, { status: 400 });
    const normalized = address.trim();
    // Create a record for external wallet
    const w = await prisma.wallet.upsert({
      where: { address: normalized },
      update: { userId: user.id },
      create: { userId: user.id, address: normalized, provider: "SOLANA" as any },
    });
    return Response.json({ ok: true, address: w.address });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}
