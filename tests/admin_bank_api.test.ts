import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { prismaMock, solanaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: { findUnique: vi.fn() },
    tapCoinTransaction: { aggregate: vi.fn(async () => ({ _sum: { amount: 0 } })) },
    setting: { findUnique: vi.fn(async () => null), upsert: vi.fn(async () => ({})) },
    distribution: { create: vi.fn(async () => ({ id: "d1" })) },
  } as any,
  solanaMock: {
    getSolanaConfig: vi.fn(() => ({ network: "devnet", rpcUrl: "https://x", tapMintAddress: "mint", tapMintAuthSecret: "k", decimals: 0 })),
    solanaRpcCall: vi.fn(),
    isValidSolanaAddress: vi.fn(() => true),
    getTreasuryKeypair: vi.fn(() => ({ publicKey: { toBase58: () => "Treasury11111111111111111111111111111111111" } })),
    transferSolFrom: vi.fn(async () => "sigSOL"),
    transferTapFrom: vi.fn(async () => "sigTAP"),
    burnTapFrom: vi.fn(async () => "sigBURN"),
    getSolanaConnection: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/solana", () => solanaMock);

const authMock = vi.fn();
vi.mock("@/auth.config", () => ({ auth: authMock }));

function asAdmin() {
  authMock.mockResolvedValue({ user: { email: "admin@taptap.dev" } });
  prismaMock.user.findUnique.mockResolvedValue({ id: "a1", role: "ADMIN" });
}

beforeEach(() => {
  vi.clearAllMocks();
  asAdmin();
  process.env.TREASURY_WALLET_ADDRESS = "Treasury11111111111111111111111111111111111";
  process.env.TREASURY_USER_ID = "trap-user";
  process.env.TREASURY_WALLET_SECRET = "deadbeef";
  process.env.TAP_MINT_ADDRESS = "mint";
  process.env.TAP_MINT_AUTH_SECRET = "k";
});

describe("/api/admin/bank/overview", () => {
  it("403s non-admins", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "u1", role: "LISTENER" });
    const mod = await import("../app/api/admin/bank/overview/route");
    const res = await mod.GET(new Request("http://localhost/api/admin/bank/overview"));
    expect(res.status).toBe(403);
  });

  it("returns balances, mint info, recent sigs, and warnings", async () => {
    solanaMock.solanaRpcCall.mockImplementation(async (method: string) => {
      if (method === "getAccountInfo") return { value: { data: { parsed: { info: { supply: "1000", decimals: 0, mintAuthority: "MA", freezeAuthority: null, isInitialized: true } } } } };
      if (method === "getBalance") return { value: 2_500_000_000 };
      if (method === "getTokenAccountsByOwner") return { value: [{ account: { data: { parsed: { info: { tokenAmount: { uiAmount: 42, amount: "42" } } } } } }] };
      if (method === "getSignaturesForAddress") return [{ signature: "sigA", slot: 1, blockTime: 100, err: null, memo: null }];
      return null;
    });
    const mod = await import("../app/api/admin/bank/overview/route");
    const res = await mod.GET(new Request("http://localhost/api/admin/bank/overview"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.network).toBe("devnet");
    expect(body.treasury.sol).toBeCloseTo(2.5, 5);
    expect(body.treasury.tap).toBe(42);
    expect(body.mint.supply).toBe("1000");
    expect(body.recentSignatures[0].signature).toBe("sigA");
  });

  it("includes warnings when envs are missing", async () => {
    delete process.env.TREASURY_WALLET_ADDRESS;
    delete process.env.TAP_MINT_AUTH_SECRET;
    solanaMock.getSolanaConfig.mockReturnValueOnce({ network: "devnet", rpcUrl: "x", tapMintAddress: undefined, tapMintAuthSecret: undefined, decimals: 0 } as any);
    const mod = await import("../app/api/admin/bank/overview/route");
    const res = await mod.GET(new Request("http://localhost/api/admin/bank/overview"));
    const body = await res.json();
    expect(body.warnings).toEqual(expect.arrayContaining([expect.stringContaining("TREASURY_WALLET_ADDRESS")]));
  });
});

describe("/api/admin/bank/transfer", () => {
  it("rejects invalid bodies", async () => {
    const mod = await import("../app/api/admin/bank/transfer/route");
    const res = await mod.POST(new Request("http://localhost/x", { method: "POST", body: JSON.stringify({ kind: "BTC", toAddress: "x", amount: 1 }) }));
    expect(res.status).toBe(400);
  });

  it("503s when TREASURY_WALLET_SECRET missing", async () => {
    delete process.env.TREASURY_WALLET_SECRET;
    const mod = await import("../app/api/admin/bank/transfer/route");
    const res = await mod.POST(new Request("http://localhost/x", { method: "POST", body: JSON.stringify({ kind: "TAP", toAddress: "Recip111111111111111111111111111111111111", amount: 5 }) }));
    expect(res.status).toBe(503);
  });

  it("happy path returns signature for TAP and SOL", async () => {
    const mod = await import("../app/api/admin/bank/transfer/route");
    const tap = await mod.POST(new Request("http://localhost/x", { method: "POST", body: JSON.stringify({ kind: "TAP", toAddress: "Recip111111111111111111111111111111111111", amount: 5 }) }));
    expect(tap.status).toBe(200);
    expect((await tap.json()).signature).toBe("sigTAP");
    const sol = await mod.POST(new Request("http://localhost/x", { method: "POST", body: JSON.stringify({ kind: "SOL", toAddress: "Recip111111111111111111111111111111111111", amount: 0.5 }) }));
    expect((await sol.json()).signature).toBe("sigSOL");
  });
});

describe("/api/admin/bank/burn", () => {
  it("rejects negative amounts", async () => {
    const mod = await import("../app/api/admin/bank/burn/route");
    const res = await mod.POST(new Request("http://localhost/x", { method: "POST", body: JSON.stringify({ amount: -1 }) }));
    expect(res.status).toBe(400);
  });

  it("happy path burns and logs Distribution", async () => {
    const mod = await import("../app/api/admin/bank/burn/route");
    const res = await mod.POST(new Request("http://localhost/x", { method: "POST", body: JSON.stringify({ amount: 10 }) }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.signature).toBe("sigBURN");
    expect(prismaMock.distribution.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: "BURN", amount: 10 }) })
    );
  });
});

describe("/api/admin/market/solprice GET", () => {
  const fetchSpy = vi.spyOn(global, "fetch");
  afterEach(() => fetchSpy.mockReset());

  it("403s non-admins", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "u1", role: "LISTENER" });
    const mod = await import("../app/api/admin/market/solprice/route");
    const res = await mod.GET(new Request("http://localhost/api/admin/market/solprice"));
    expect(res.status).toBe(403);
  });

  it("fetches CoinGecko and caches the result", async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ solana: { usd: 184.21 } }), { status: 200 }));
    const mod = await import("../app/api/admin/market/solprice/route");
    const res = await mod.GET(new Request("http://localhost/api/admin/market/solprice"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.usd).toBe(184.21);
    expect(body.source).toBe("coingecko");
    expect(prismaMock.setting.upsert).toHaveBeenCalled();
  });
});
