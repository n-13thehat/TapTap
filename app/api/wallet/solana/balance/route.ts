import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";

async function rpcCall(method: string, params: any[]) {
  const rpc = process.env.SOLANA_RPC_URL || (process.env.SOLANA_NETWORK === 'mainnet' ? 'https://api.mainnet-beta.solana.com' : 'https://api.devnet.solana.com');
  const res = await fetch(rpc, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`rpc ${method} failed`);
  const j = await res.json();
  if (j.error) throw new Error(j.error?.message || 'rpc error');
  return j.result;
}

export async function GET(req: Request) {
  const session = await auth();
  const email = (session as any)?.user?.email as string | undefined;
  if (!email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const url = new URL(req.url);
    const address = String(url.searchParams.get('address') || '').trim();
    if (!address) return Response.json({ error: 'address required' }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });
    const owned = await prisma.wallet.findFirst({ where: { userId: user.id, address, provider: "SOLANA" as any } });
    if (!owned) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const balance = await rpcCall('getBalance', [address]);
    const lamports = Number(balance?.value || 0);

    let tapBalance = 0;
    const mint = process.env.TAP_MINT_ADDRESS || '';
    if (mint) {
      try {
        const tokenAccounts = await rpcCall('getTokenAccountsByOwner', [address, { mint }, { commitment: 'confirmed', encoding: 'jsonParsed' }]);
        const arr = tokenAccounts?.value || [];
        for (const it of arr) {
          const amount = it?.account?.data?.parsed?.info?.tokenAmount?.uiAmount || 0;
          tapBalance += Number(amount || 0);
        }
      } catch {}
    }

    return Response.json({ address, lamports, sol: lamports / 1_000_000_000, tap: tapBalance });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}
