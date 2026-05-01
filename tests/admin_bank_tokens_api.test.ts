import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: { findUnique: vi.fn() },
    managedToken: {
      findMany: vi.fn(async () => []),
      findUnique: vi.fn(),
    },
    tokenAuditEvent: {
      findMany: vi.fn(async () => []),
    },
  } as any,
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const authMock = vi.fn();
vi.mock("@/auth.config", () => ({ auth: authMock }));

function makeReq(url: string) {
  return new Request(url);
}

const VALID_UUID = "11111111-1111-1111-1111-111111111111";

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ user: { email: "admin@taptap.dev" } });
  prismaMock.user.findUnique.mockResolvedValue({ id: "admin-1", role: "ADMIN" });
});

describe("GET /api/admin/bank/networks", () => {
  it("rejects non-admin callers with 403", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "u1", role: "LISTENER" });
    const mod = await import("../app/api/admin/bank/networks/route");
    const res = await mod.GET(makeReq("http://localhost/api/admin/bank/networks"));
    expect(res.status).toBe(403);
  });

  it("returns all three Solana chains with env presence flags", async () => {
    process.env.TOKEN_FORGE_KEK = Buffer.alloc(32, 1).toString("base64");
    process.env.TREASURY_WALLET_SECRET = Buffer.alloc(64, 1).toString("base64");
    const mod = await import("../app/api/admin/bank/networks/route");
    const res = await mod.GET(makeReq("http://localhost/api/admin/bank/networks"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.env.kekPresent).toBe(true);
    expect(body.env.treasuryPresent).toBe(true);
    const ids = body.chains.map((c: any) => c.chain);
    expect(ids).toEqual(["SOLANA_DEVNET", "SOLANA_TESTNET", "SOLANA_MAINNET"]);
    const mainnet = body.chains.find((c: any) => c.chain === "SOLANA_MAINNET");
    expect(mainnet.isMainnet).toBe(true);
    expect(mainnet.supportsAirdrop).toBe(false);
    expect(mainnet.deployable).toBe(true);
  });
});

describe("GET /api/admin/bank/tokens", () => {
  it("rejects non-admin callers with 403", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "u1", role: "LISTENER" });
    const mod = await import("../app/api/admin/bank/tokens/route");
    const res = await mod.GET(makeReq("http://localhost/api/admin/bank/tokens"));
    expect(res.status).toBe(403);
  });

  it("returns 400 on invalid kind", async () => {
    const mod = await import("../app/api/admin/bank/tokens/route");
    const res = await mod.GET(makeReq("http://localhost/api/admin/bank/tokens?kind=INVALID"));
    expect(res.status).toBe(400);
  });

  it("serializes BigInt supplyCap and supplyMinted as strings", async () => {
    prismaMock.managedToken.findMany.mockResolvedValueOnce([
      {
        id: VALID_UUID, name: "TapGame", symbol: "TAPGAME", description: null,
        kind: "LAYER", parentTokenId: null, status: "DRAFT", decimals: 0,
        supplyCap: BigInt("1000000000000"), holderCap: null, freezeOnDeploy: false,
        metadataUri: null, createdById: "admin-1",
        createdAt: new Date(), updatedAt: new Date(),
        _count: { children: 0, auditEvents: 0 },
        deployments: [{
          id: "dep1", tokenId: VALID_UUID, chain: "SOLANA_DEVNET",
          mintAddress: "Mint11111", mintAuthorityPubkey: "Auth11111",
          freezeAuthorityPubkey: null, status: "DEPLOYED",
          supplyMinted: BigInt("123456789"), txCreate: "sig1", txFreeze: null,
          deployedAt: new Date(), deployedById: "admin-1", notes: null,
          createdAt: new Date(), updatedAt: new Date(),
        }],
      },
    ]);
    const mod = await import("../app/api/admin/bank/tokens/route");
    const res = await mod.GET(makeReq("http://localhost/api/admin/bank/tokens"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tokens[0].supplyCap).toBe("1000000000000");
    expect(body.tokens[0].deployments[0].supplyMinted).toBe("123456789");
  });

  it("translates parentTokenId='null' into a top-level filter", async () => {
    const mod = await import("../app/api/admin/bank/tokens/route");
    await mod.GET(makeReq("http://localhost/api/admin/bank/tokens?parentTokenId=null"));
    expect(prismaMock.managedToken.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ parentTokenId: null }) }),
    );
  });
});

describe("GET /api/admin/bank/tokens/[id]", () => {
  it("rejects non-admin callers with 403", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "u1", role: "LISTENER" });
    const mod = await import("../app/api/admin/bank/tokens/[id]/route");
    const res = await mod.GET(
      makeReq("http://localhost/api/admin/bank/tokens/" + VALID_UUID),
      { params: Promise.resolve({ id: VALID_UUID }) },
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 on a non-uuid id", async () => {
    const mod = await import("../app/api/admin/bank/tokens/[id]/route");
    const res = await mod.GET(
      makeReq("http://localhost/api/admin/bank/tokens/not-a-uuid"),
      { params: Promise.resolve({ id: "not-a-uuid" }) },
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when the token does not exist", async () => {
    prismaMock.managedToken.findUnique.mockResolvedValueOnce(null);
    const mod = await import("../app/api/admin/bank/tokens/[id]/route");
    const res = await mod.GET(
      makeReq("http://localhost/api/admin/bank/tokens/" + VALID_UUID),
      { params: Promise.resolve({ id: VALID_UUID }) },
    );
    expect(res.status).toBe(404);
  });

  it("returns the token with serialized BigInt fields and recent audit events", async () => {
    prismaMock.managedToken.findUnique.mockResolvedValueOnce({
      id: VALID_UUID, name: "Tap", symbol: "TAP", description: "root", kind: "ROOT",
      parentTokenId: null, status: "DEPLOYED", decimals: 0,
      supplyCap: BigInt("999"), holderCap: null, freezeOnDeploy: false,
      metadataUri: null, createdById: "admin-1",
      createdAt: new Date(), updatedAt: new Date(),
      parent: null, children: [], _count: { auditEvents: 1 },
      deployments: [],
    });
    prismaMock.tokenAuditEvent.findMany.mockResolvedValueOnce([
      { id: "ae1", action: "DEPLOY", actorUserId: "admin-1", deploymentId: null, payload: {}, createdAt: new Date() },
    ]);
    const mod = await import("../app/api/admin/bank/tokens/[id]/route");
    const res = await mod.GET(
      makeReq("http://localhost/api/admin/bank/tokens/" + VALID_UUID),
      { params: Promise.resolve({ id: VALID_UUID }) },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token.supplyCap).toBe("999");
    expect(body.token.recentAuditEvents).toHaveLength(1);
  });
});
