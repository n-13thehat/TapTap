import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth.config", () => ({ auth: vi.fn(async () => ({ user: { email: "me@taptap.local" } })) }));

const prismaMock: any = {
  $transaction: vi.fn(async (_ops: any[]) => []),
  user: { findUnique: vi.fn(async ({ where }: any) => (where.email ? { id: "u1" } : { id: where.id })) },
  tapCoinTransaction: {
    aggregate: vi.fn(async ({ where, _sum }: any) => ({ _sum: { amount: where?.amount?.lt ? -200 : 500 } })),
    create: vi.fn(async () => ({})),
  },
  setting: {
    findUnique: vi.fn(async () => null),
    upsert: vi.fn(async () => ({})),
  },
  wallet: {
    upsert: vi.fn(async ({ create }: any) => ({ id: "w1", address: create.address })),
  },
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

describe("TapCoin APIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("send: rejects when insufficient balance", async () => {
    prismaMock.tapCoinTransaction.aggregate.mockImplementationOnce(async () => ({ _sum: { amount: 10 } }));
    const mod = await import("../app/api/treasure/send/route");
    const req = new Request("http://localhost/api/treasure/send", {
      method: "POST",
      body: JSON.stringify({ toUserId: "u2", amount: 9999 }),
    });
    const res = await (mod as any).POST(req);
    expect(res.status).toBe(400);
  });

  it("send: ok on happy path", async () => {
    const mod = await import("@/api/treasure/send/route");
    const req = new Request("http://localhost/api/treasure/send", {
      method: "POST",
      body: JSON.stringify({ toUserId: "u2", amount: 50, idempotencyKey: "abc" }),
      headers: { "content-type": "application/json" },
    });
    const res = await (mod as any).POST(req);
    expect(res.ok).toBe(true);
  });

  it("withdraw: requires walletAddress and balance", async () => {
    const mod = await import("@/api/treasure/withdraw/route");
    const noAddr = await (mod as any).POST(new Request("http://localhost/api/treasure/withdraw", { method: "POST", body: JSON.stringify({ amount: 10 }) }));
    expect(noAddr.status).toBe(400);
    const ok = await (mod as any).POST(new Request("http://localhost/api/treasure/withdraw", { method: "POST", body: JSON.stringify({ amount: 10, walletAddress: "So111" }) }));
    expect(ok.ok).toBe(true);
  });
});
