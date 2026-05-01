import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: { findUnique: vi.fn() },
    managedToken: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    managedTokenDeployment: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    tokenAuditEvent: {
      create: vi.fn(async () => ({ id: "ae1" })),
    },
  } as any,
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const authMock = vi.fn();
vi.mock("@/auth.config", () => ({ auth: authMock }));

const fakeKeypair = { publicKey: { toBase58: () => "AuthPubkey1111" }, secretKey: new Uint8Array(64) };
const solanaMock = vi.hoisted(() => ({
  getTreasuryKeypair: vi.fn(() => ({ publicKey: { toBase58: () => "Treasury11" } })),
  isValidSolanaAddress: vi.fn(() => true),
}));
vi.mock("@/lib/solana", () => solanaMock);

const tokensMock = vi.hoisted(() => ({
  createSplMint: vi.fn(async () => ({ mintAddress: "Mint11111", signature: "sigCreate" })),
  mintToAddress: vi.fn(async () => ({ signature: "sigMint", ata: "Ata11111" })),
  revokeMintAuthority: vi.fn(async () => ({ signature: "sigRevokeMint" })),
  revokeFreezeAuthority: vi.fn(async () => ({ signature: "sigRevokeFreeze" })),
}));
vi.mock("@/lib/solana/tokens", () => tokensMock);

vi.mock("@solana/web3.js", () => ({
  Keypair: {
    generate: () => ({
      publicKey: { toBase58: () => "AuthPubkey1111" },
      secretKey: new Uint8Array(64),
    }),
    fromSecretKey: () => fakeKeypair,
  },
  PublicKey: class { constructor(public v: string) {} toBase58() { return this.v; } },
  Connection: class {},
  LAMPORTS_PER_SOL: 1_000_000_000,
  clusterApiUrl: () => "https://rpc",
}));

vi.mock("@/lib/crypto/kek", () => ({
  encryptKEK: () => "iv:tag:enc",
  decryptKEK: () => Buffer.alloc(64, 1),
}));

const TID = "11111111-1111-1111-1111-111111111111";
const ADDR = "11111111111111111111111111111112";

beforeEach(() => {
  for (const group of Object.values(prismaMock) as any[]) {
    for (const fn of Object.values(group) as any[]) {
      if (typeof fn?.mockReset === "function") fn.mockReset();
    }
  }
  authMock.mockReset();
  authMock.mockResolvedValue({ user: { email: "admin@taptap.dev" } });
  prismaMock.user.findUnique.mockResolvedValue({ id: "admin-1", role: "ADMIN" });
  prismaMock.tokenAuditEvent.create.mockResolvedValue({ id: "ae1" });
  process.env.TOKEN_FORGE_KEK = Buffer.alloc(32, 1).toString("base64");
  process.env.TREASURY_WALLET_SECRET = Buffer.alloc(64, 1).toString("base64");
});

function jreq(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/bank/tokens (create)", () => {
  it("rejects non-admin with 403", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "u1", role: "LISTENER" });
    const mod = await import("../app/api/admin/bank/tokens/route");
    const res = await mod.POST(jreq("http://l/api/admin/bank/tokens", {}));
    expect(res.status).toBe(403);
  });

  it("returns 400 on bad body", async () => {
    const mod = await import("../app/api/admin/bank/tokens/route");
    const res = await mod.POST(jreq("http://l/api/admin/bank/tokens", { name: "x" }));
    expect(res.status).toBe(400);
  });

  it("returns 409 on duplicate symbol+kind", async () => {
    prismaMock.managedToken.findFirst.mockResolvedValueOnce({ id: "dup" });
    const mod = await import("../app/api/admin/bank/tokens/route");
    const res = await mod.POST(jreq("http://l/api/admin/bank/tokens", {
      name: "TapGame", symbol: "TAPGAME", kind: "LAYER",
    }));
    expect(res.status).toBe(409);
  });

  it("creates the token, logs audit, returns 201", async () => {
    prismaMock.managedToken.findFirst.mockResolvedValueOnce(null);
    prismaMock.managedToken.create.mockResolvedValueOnce({
      id: TID, name: "TapGame", symbol: "TAPGAME", kind: "LAYER", status: "DRAFT",
      decimals: 0, supplyCap: BigInt("1000"), parentTokenId: null, createdAt: new Date(),
    });
    const mod = await import("../app/api/admin/bank/tokens/route");
    const res = await mod.POST(jreq("http://l/api/admin/bank/tokens", {
      name: "TapGame", symbol: "TAPGAME", kind: "LAYER", supplyCap: "1000",
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.token.supplyCap).toBe("1000");
    expect(prismaMock.tokenAuditEvent.create).toHaveBeenCalled();
  });
});

describe("POST /api/admin/bank/tokens/[id]/deploy", () => {
  const tok = {
    id: TID, name: "T", symbol: "TAP", kind: "ROOT", status: "DRAFT",
    decimals: 0, freezeOnDeploy: false, supplyCap: null,
  };

  it("returns 503 when KEK env missing", async () => {
    delete process.env.TOKEN_FORGE_KEK;
    const mod = await import("../app/api/admin/bank/tokens/[id]/deploy/route");
    const res = await mod.POST(
      jreq("http://l/x", { chain: "SOLANA_DEVNET" }),
      { params: Promise.resolve({ id: TID }) },
    );
    expect(res.status).toBe(503);
  });

  it("returns 400 when mainnet confirm is missing", async () => {
    prismaMock.managedToken.findUnique.mockResolvedValueOnce(tok);
    const mod = await import("../app/api/admin/bank/tokens/[id]/deploy/route");
    const res = await mod.POST(
      jreq("http://l/x", { chain: "SOLANA_MAINNET" }),
      { params: Promise.resolve({ id: TID }) },
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.expected).toBe("MAINNET-DEPLOY-TAP");
  });

  it("returns 409 when deployment already exists", async () => {
    prismaMock.managedToken.findUnique.mockResolvedValueOnce(tok);
    prismaMock.managedTokenDeployment.findUnique.mockResolvedValueOnce({ id: "d1" });
    const mod = await import("../app/api/admin/bank/tokens/[id]/deploy/route");
    const res = await mod.POST(
      jreq("http://l/x", { chain: "SOLANA_DEVNET" }),
      { params: Promise.resolve({ id: TID }) },
    );
    expect(res.status).toBe(409);
  });

  it("creates the SPL mint and stores encrypted authority", async () => {
    prismaMock.managedToken.findUnique.mockResolvedValueOnce(tok);
    prismaMock.managedTokenDeployment.findUnique.mockResolvedValueOnce(null);
    prismaMock.managedTokenDeployment.create.mockResolvedValueOnce({
      id: "d1", tokenId: TID, chain: "SOLANA_DEVNET",
      mintAddress: "Mint11111", mintAuthorityPubkey: "AuthPubkey1111",
      freezeAuthorityPubkey: null, status: "DEPLOYED",
      txCreate: "sigCreate", deployedAt: new Date(),
    });
    prismaMock.managedToken.update.mockResolvedValueOnce({});
    const mod = await import("../app/api/admin/bank/tokens/[id]/deploy/route");
    const res = await mod.POST(
      jreq("http://l/x", { chain: "SOLANA_DEVNET" }),
      { params: Promise.resolve({ id: TID }) },
    );
    expect(res.status).toBe(201);
    expect(tokensMock.createSplMint).toHaveBeenCalledOnce();
    const createdData = prismaMock.managedTokenDeployment.create.mock.calls[0][0].data;
    expect(createdData.mintAuthorityCipher).toBe("iv:tag:enc");
    expect(createdData.mintAuthorityPubkey).toBe("AuthPubkey1111");
  });
});

describe("POST /api/admin/bank/tokens/[id]/mint", () => {
  const tok = { id: TID, name: "T", symbol: "TAP", kind: "ROOT", status: "DEPLOYED", decimals: 0, supplyCap: null };
  const dep = {
    id: "d1", tokenId: TID, chain: "SOLANA_DEVNET",
    mintAddress: "Mint11111", mintAuthorityCipher: "iv:tag:enc",
    mintAuthorityPubkey: "AuthPubkey1111", status: "DEPLOYED",
    supplyMinted: BigInt("0"), freezeAuthorityPubkey: null,
  };

  it("returns 409 when supply cap would be exceeded", async () => {
    prismaMock.managedToken.findUnique.mockResolvedValueOnce({ ...tok, supplyCap: BigInt("100") });
    prismaMock.managedTokenDeployment.findUnique.mockResolvedValueOnce({ ...dep, supplyMinted: BigInt("90") });
    const mod = await import("../app/api/admin/bank/tokens/[id]/mint/route");
    const res = await mod.POST(
      jreq("http://l/x", { chain: "SOLANA_DEVNET", recipient: ADDR, amount: "20" }),
      { params: Promise.resolve({ id: TID }) },
    );
    expect(res.status).toBe(409);
  });

  it("mints and increments supplyMinted", async () => {
    prismaMock.managedToken.findUnique.mockResolvedValueOnce(tok);
    prismaMock.managedTokenDeployment.findUnique.mockResolvedValueOnce(dep);
    prismaMock.managedTokenDeployment.update.mockResolvedValueOnce({ ...dep, supplyMinted: BigInt("50") });
    const mod = await import("../app/api/admin/bank/tokens/[id]/mint/route");
    const res = await mod.POST(
      jreq("http://l/x", { chain: "SOLANA_DEVNET", recipient: ADDR, amount: "50" }),
      { params: Promise.resolve({ id: TID }) },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.signature).toBe("sigMint");
    expect(body.ata).toBe("Ata11111");
    expect(body.supplyMinted).toBe("50");
    expect(tokensMock.mintToAddress).toHaveBeenCalledOnce();
  });

  it("returns 409 when authority already revoked", async () => {
    prismaMock.managedToken.findUnique.mockResolvedValueOnce(tok);
    prismaMock.managedTokenDeployment.findUnique.mockResolvedValueOnce({ ...dep, mintAuthorityCipher: "" });
    const mod = await import("../app/api/admin/bank/tokens/[id]/mint/route");
    const res = await mod.POST(
      jreq("http://l/x", { chain: "SOLANA_DEVNET", recipient: ADDR, amount: "1" }),
      { params: Promise.resolve({ id: TID }) },
    );
    expect(res.status).toBe(409);
  });
});

describe("POST /api/admin/bank/tokens/[id]/revoke-authority", () => {
  const tok = { id: TID, name: "T", symbol: "TAP", kind: "ROOT", status: "DEPLOYED" };
  const dep = {
    id: "d1", tokenId: TID, chain: "SOLANA_DEVNET",
    mintAddress: "Mint11111", mintAuthorityCipher: "iv:tag:enc",
    mintAuthorityPubkey: "AuthPubkey1111", status: "DEPLOYED",
    freezeAuthorityPubkey: "AuthPubkey1111",
  };

  it("revokes MINT, clears cipher, freezes deployment", async () => {
    prismaMock.managedToken.findUnique.mockResolvedValueOnce(tok);
    prismaMock.managedTokenDeployment.findUnique.mockResolvedValueOnce(dep);
    prismaMock.managedTokenDeployment.update.mockResolvedValueOnce({
      ...dep, mintAuthorityCipher: "", status: "FROZEN", txFreeze: "sigRevokeMint",
    });
    prismaMock.managedTokenDeployment.count.mockResolvedValueOnce(0);
    prismaMock.managedToken.update.mockResolvedValueOnce({});
    const mod = await import("../app/api/admin/bank/tokens/[id]/revoke-authority/route");
    const res = await mod.POST(
      jreq("http://l/x", { chain: "SOLANA_DEVNET", authority: "MINT" }),
      { params: Promise.resolve({ id: TID }) },
    );
    expect(res.status).toBe(200);
    const updateArgs = prismaMock.managedTokenDeployment.update.mock.calls[0][0];
    expect(updateArgs.data.mintAuthorityCipher).toBe("");
    expect(updateArgs.data.status).toBe("FROZEN");
    expect(prismaMock.managedToken.update).toHaveBeenCalledWith({
      where: { id: TID }, data: { status: "FROZEN" },
    });
  });

  it("revokes FREEZE without clearing cipher", async () => {
    prismaMock.managedToken.findUnique.mockResolvedValueOnce(tok);
    prismaMock.managedTokenDeployment.findUnique.mockResolvedValueOnce(dep);
    prismaMock.managedTokenDeployment.update.mockResolvedValueOnce({ ...dep, freezeAuthorityPubkey: null });
    const mod = await import("../app/api/admin/bank/tokens/[id]/revoke-authority/route");
    const res = await mod.POST(
      jreq("http://l/x", { chain: "SOLANA_DEVNET", authority: "FREEZE" }),
      { params: Promise.resolve({ id: TID }) },
    );
    expect(res.status).toBe(200);
    const updateArgs = prismaMock.managedTokenDeployment.update.mock.calls[0][0];
    expect(updateArgs.data.freezeAuthorityPubkey).toBeNull();
    expect(updateArgs.data.mintAuthorityCipher).toBeUndefined();
    expect(updateArgs.data.status).toBeUndefined();
  });
});

describe("POST /api/admin/bank/tokens/[id]/promote", () => {
  const tok = { id: TID, name: "T", symbol: "TAP", kind: "ROOT", status: "DEPLOYED", decimals: 0, freezeOnDeploy: false };
  const source = { id: "d-src", tokenId: TID, chain: "SOLANA_DEVNET", mintAddress: "Mint11111", status: "DEPLOYED" };

  it("rejects mainnet -> devnet promotions", async () => {
    const mod = await import("../app/api/admin/bank/tokens/[id]/promote/route");
    const res = await mod.POST(
      jreq("http://l/x", { fromChain: "SOLANA_MAINNET", toChain: "SOLANA_DEVNET" }),
      { params: Promise.resolve({ id: TID }) },
    );
    expect(res.status).toBe(400);
  });

  it("requires mainnet confirm when promoting to mainnet", async () => {
    prismaMock.managedToken.findUnique.mockResolvedValueOnce(tok);
    const mod = await import("../app/api/admin/bank/tokens/[id]/promote/route");
    const res = await mod.POST(
      jreq("http://l/x", { fromChain: "SOLANA_TESTNET", toChain: "SOLANA_MAINNET" }),
      { params: Promise.resolve({ id: TID }) },
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.expected).toBe("MAINNET-PROMOTE-TAP");
  });

  it("creates a fresh deployment on the target chain", async () => {
    prismaMock.managedToken.findUnique.mockResolvedValueOnce(tok);
    prismaMock.managedTokenDeployment.findUnique
      .mockResolvedValueOnce(source)
      .mockResolvedValueOnce(null);
    prismaMock.managedTokenDeployment.create.mockResolvedValueOnce({
      id: "d-tgt", tokenId: TID, chain: "SOLANA_TESTNET",
      mintAddress: "Mint22222", mintAuthorityPubkey: "AuthPubkey1111",
      status: "DEPLOYED", txCreate: "sigCreate", deployedAt: new Date(),
    });
    const mod = await import("../app/api/admin/bank/tokens/[id]/promote/route");
    const res = await mod.POST(
      jreq("http://l/x", { fromChain: "SOLANA_DEVNET", toChain: "SOLANA_TESTNET" }),
      { params: Promise.resolve({ id: TID }) },
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.sourceMintAddress).toBe("Mint11111");
    expect(body.deployment.chain).toBe("SOLANA_TESTNET");
  });
});
