import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    profile: { create: vi.fn() },
    tapPass: { create: vi.fn() },
    betaInvite: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    wallet: { create: vi.fn() },
    $transaction: vi.fn(async (fn: any) => {
      // The route uses an interactive transaction; pass the mock as the tx client.
      return fn(prismaMockGlobal);
    }),
  } as any,
}));
const prismaMockGlobal = prismaMock;
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

vi.mock("@/lib/addDefaultAlbumToLibrary", () => ({
  addDefaultAlbumToLibrary: vi.fn(async () => undefined),
}));
vi.mock("@/lib/solana", () => ({
  generateKeypair: vi.fn(() => ({ publicKey: "pub_1", secretKey: "sec_1" })),
  encryptSecret: vi.fn(() => "enc_1"),
  airdropSol: vi.fn(async () => undefined),
  mintTapTo: vi.fn(async () => undefined),
}));

function makeReq(body: any) {
  return new Request("http://localhost/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("/api/auth/signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.BETA_MODE;
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: "user-1",
      email: "a@b.co",
      username: "alice",
      hashedPassword: "x",
    });
    prismaMock.profile.create.mockResolvedValue({ id: "p1" });
    prismaMock.tapPass.create.mockResolvedValue({ id: "t1" });
    prismaMock.wallet.create.mockResolvedValue({ id: "w1", address: "addr" });
  });

  it("rejects an invalid request body", async () => {
    const mod = await import("../app/api/auth/signup/route");
    const res = await mod.POST(makeReq({ email: "not-an-email" }));
    expect(res.status).toBe(400);
  });

  it("requires an invite when BETA_MODE=true", async () => {
    process.env.BETA_MODE = "true";
    const mod = await import("../app/api/auth/signup/route");
    const res = await mod.POST(
      makeReq({ email: "a@b.co", password: "password123", name: "alice" }),
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/invite/i);
  });

  it("rejects an unknown invite code", async () => {
    prismaMock.betaInvite.findUnique.mockResolvedValueOnce(null);
    const mod = await import("../app/api/auth/signup/route");
    const res = await mod.POST(
      makeReq({ email: "a@b.co", password: "password123", inviteCode: "BAD" }),
    );
    expect(res.status).toBe(403);
  });

  it("rejects an already-claimed invite", async () => {
    prismaMock.betaInvite.findUnique.mockResolvedValueOnce({
      id: "inv-1",
      claimedByUserId: "someone-else",
    });
    const mod = await import("../app/api/auth/signup/route");
    const res = await mod.POST(
      makeReq({ email: "a@b.co", password: "password123", inviteCode: "USED" }),
    );
    expect(res.status).toBe(403);
  });

  it("creates user + profile + Tier-0 TapPass and claims the invite atomically", async () => {
    prismaMock.betaInvite.findUnique.mockResolvedValueOnce({ id: "inv-1", claimedByUserId: null });
    const mod = await import("../app/api/auth/signup/route");
    const res = await mod.POST(
      makeReq({
        email: "a@b.co",
        password: "password123",
        name: "alice",
        inviteCode: "BETA-AAAA-BBBB",
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    // Sensitive field should not leak.
    expect(body.user.hashedPassword).toBeUndefined();

    // Atomic ordering inside the transaction.
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.profile.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.tapPass.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.betaInvite.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "inv-1" },
        data: expect.objectContaining({ claimedByUserId: "user-1" }),
      }),
    );

    const tapArgs = prismaMock.tapPass.create.mock.calls[0][0];
    expect(tapArgs.data.level).toBe(0);
    expect(tapArgs.data.isActive).toBe(true);

    const userArgs = prismaMock.user.create.mock.calls[0][0];
    expect(userArgs.data.hasTapPass).toBe(true);
  });

  it("returns 409 when email already exists", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "existing" });
    const mod = await import("../app/api/auth/signup/route");
    const res = await mod.POST(
      makeReq({ email: "a@b.co", password: "password123" }),
    );
    expect(res.status).toBe(409);
  });
});
