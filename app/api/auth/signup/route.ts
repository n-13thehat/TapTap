import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { addDefaultAlbumToLibrary } from "@/lib/addDefaultAlbumToLibrary";
import { generateKeypair, encryptSecret, airdropSol, mintTapTo } from "@/lib/solana";

const SignupBody = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8).max(128),
  inviteCode: z.string().trim().min(1).max(64).optional(),
  walletAddress: z.string().trim().min(32).max(64).optional(),
});

const BETA_REQUIRED = () => process.env.BETA_MODE === "true";

export async function POST(req: Request) {
  try {
    const raw = await req.json().catch(() => null);
    const parsed = SignupBody.safeParse(raw);
    if (!parsed.success) {
      return Response.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
    }
    const { name, email, password, inviteCode, walletAddress } = parsed.data;

    if (BETA_REQUIRED() && !inviteCode) {
      return Response.json({ error: "An invite code is required to join the beta." }, { status: 403 });
    }

    // Validate invite code (if provided) against the BetaInvite table.
    let invite: { id: string; claimedByUserId: string | null } | null = null;
    if (inviteCode) {
      invite = await prisma.betaInvite.findUnique({
        where: { code: inviteCode },
        select: { id: true, claimedByUserId: true },
      });
      if (!invite) {
        return Response.json({ error: "Invalid invite code." }, { status: 403 });
      }
      if (invite.claimedByUserId) {
        return Response.json({ error: "Invite code has already been used." }, { status: 403 });
      }
    }

    // Reject duplicate emails up-front so the client gets a clean 409.
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return Response.json({ error: "An account with that email already exists." }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const username = name || email.split("@")[0];

    // Create user, profile, Tier-0 TapPass, and claim the invite in one transaction.
    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          username,
          email,
          hashedPassword: hashed,
          inviteCode,
          walletAddress,
          hasTapPass: true,
          authUserId: crypto.randomUUID(),
        },
      });
      await tx.profile.create({
        data: { userId: u.id, displayName: name ?? username },
      });
      await tx.tapPass.create({
        data: { userId: u.id, level: 0, isActive: true },
      });
      if (invite) {
        await tx.betaInvite.update({
          where: { id: invite.id },
          data: { claimedByUserId: u.id, claimedAt: new Date() },
        });
      }
      return u;
    });
    // Attach default album (best-effort; non-blocking)
    addDefaultAlbumToLibrary(user.id).catch((e) => console.error("default album add failed", e));

    // Ensure a custodial Solana wallet on devnet and seed with 100 TAP (best-effort)
    (async () => {
      try {
        if (process.env.SOLANA_AUTOCREATE_WALLET !== "false") {
          const existing = await prisma.wallet.findFirst({ where: { userId: user.id, provider: "SOLANA" as any } });
          if (!existing) {
            const kp = await generateKeypair();
            const enc = encryptSecret(kp.secretKey);
            const w = await prisma.wallet.create({ data: { userId: user.id, address: kp.publicKey.toBase58(), provider: "SOLANA" as any } });
            await prisma.setting.upsert({
              where: { userId_key: { userId: w.id, key: "sol:secret" } },
              update: { value: enc as any },
              create: { userId: w.id, key: "sol:secret", value: enc as any },
            });
            // Fund on devnet and mint TAP
            await airdropSol(kp.publicKey.toBase58(), 1_000_000); // ~0.001 SOL for fees
            await mintTapTo(kp.publicKey.toBase58(), 100);
          }
        }
      } catch (e) {
        console.error("signup solana wallet ensure failed", e);
      }
    })();

    const { hashedPassword: _hashed, ...safeUser } = user as any;
    return Response.json({ success: true, user: safeUser });
  } catch (err: any) {
    console.error("[auth/signup] failed", err);
    return Response.json({ error: "Signup failed. Please try again." }, { status: 500 });
  }
}
