import { NextResponse } from "next/server";
import { rateGate } from "@/api/_lib/rate";
import { requireAdminUser } from "@/api/admin/treasury/_lib/admin";
import { ALL_CHAINS, getChainMeta } from "@/lib/solana/networks";

export async function GET(req: Request) {
  const rl = await rateGate(req, "admin:bank:networks", { capacity: 30, refillPerSec: 0.5 });
  if (rl) return rl;
  const admin = await requireAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const kekPresent = !!process.env.TOKEN_FORGE_KEK;
  const treasuryPresent = !!process.env.TREASURY_WALLET_SECRET;

  const chains = ALL_CHAINS.map((chain) => {
    const meta = getChainMeta(chain);
    const overrideEnv =
      chain === "SOLANA_DEVNET" ? "SOLANA_DEVNET_RPC" :
      chain === "SOLANA_TESTNET" ? "SOLANA_TESTNET_RPC" :
      "SOLANA_MAINNET_RPC";
    return {
      chain: meta.chain,
      network: meta.network,
      label: meta.label,
      rpcUrl: meta.rpcUrl,
      rpcOverride: !!process.env[overrideEnv],
      isMainnet: meta.isMainnet,
      supportsAirdrop: meta.supportsAirdrop,
      deployable: kekPresent && treasuryPresent,
    };
  });

  return NextResponse.json({
    ok: true,
    env: { kekPresent, treasuryPresent },
    chains,
  });
}
