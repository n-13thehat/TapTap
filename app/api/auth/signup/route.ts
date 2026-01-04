import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { addDefaultAlbumToLibrary } from "@/lib/addDefaultAlbumToLibrary";
import { generateKeypair, encryptSecret, airdropSol, mintTapTo } from "@/lib/solana";

export async function POST(req: Request) {
  try {
    const { name, email, password, inviteCode, walletAddress } = await req.json();

    if (process.env.BETA_MODE === "true" && inviteCode !== process.env.BETA_ACCESS_CODE) {
      return Response.json({ error: "Invalid beta invite code." }, { status: 403 });
    }

    // Check TapPass (mock verification)
    const hasTapPass = walletAddress && walletAddress.startsWith("Tap");

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username: name || email.split("@")[0],
        email,
        hashedPassword: hashed,
        inviteCode,
        walletAddress,
        hasTapPass,
        authUserId: crypto.randomUUID(),
      },
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
            const w = await prisma.wallet.create({ data: { userId: user.id, address: kp.publicKey, provider: "SOLANA" as any } });
            await prisma.setting.upsert({
              where: { userId_key: { userId: w.id, key: "sol:secret" } },
              update: { value: enc as any },
              create: { userId: w.id, key: "sol:secret", value: enc as any },
            });
            // Fund on devnet and mint TAP
            await airdropSol(kp.publicKey, 1_000_000); // ~0.001 SOL for fees
            await mintTapTo(kp.publicKey, 100);
          }
        }
      } catch (e) {
        console.error("signup solana wallet ensure failed", e);
      }
    })();

    return Response.json({ success: true, user });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
