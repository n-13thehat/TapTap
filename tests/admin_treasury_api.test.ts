import { describe, it, expect, vi, beforeEach } from "vitest";

// Auth mocks (Auth.js v5)
vi.mock("@/auth.config", () => ({ auth: vi.fn(async () => ({ user: { email: "admin@taptap.local" } })) }));

// Prisma mock (overridden per test)
const prismaMock: any = {
  user: {
    findUnique: vi.fn(async () => ({ id: "uAdmin", role: "ADMIN" })),
    findMany: vi.fn(async () => []),
  },
  tapCoinTransaction: {
    findMany: vi.fn(async () => []),
    aggregate: vi.fn(async () => ({ _sum: { amount: 0 } })),
  },
  taxEvent: {
    findMany: vi.fn(async () => []),
    aggregate: vi.fn(async () => ({ _sum: { amount: 0, tax: 0, treasury: 0, burn: 0 } })),
  },
  distribution: {
    findMany: vi.fn(async () => []),
    aggregate: vi.fn(async () => ({ _sum: { amount: 0 } })),
  },
};
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

describe("admin treasury APIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // default admin user
    prismaMock.user.findUnique.mockResolvedValue({ id: "uAdmin", role: "ADMIN" });
  });

  it("summary math aggregates correctly", { timeout: 10000 }, async () => {
    const now = new Date();
    prismaMock.taxEvent.findMany.mockResolvedValueOnce([
      { createdAt: now, amount: 100, tax: 9, treasury: 6, burn: 3 },
      { createdAt: now, amount: 50, tax: 4, treasury: 3, burn: 1 },
    ]);
    prismaMock.tapCoinTransaction.findMany.mockResolvedValueOnce([{ createdAt: now, amount: 11, reason: "TIP" }]);
    const mod = await import("../app/api/admin/treasury/summary/route");
    const res = await (mod as any).GET(new Request("http://localhost/api/admin/treasury/summary"));
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.kpis.grossVolume).toBe("150");
    expect(data.kpis.taxCollected).toBe("13");
    expect(data.kpis.toTreasury).toBe("9");
    expect(data.kpis.burned).toBe("4");
    expect(data.kpis.tipsVolume).toBe("11");
  });

  it("ledger pagination returns nextCursor and limited items", async () => {
    // Provide limit=2 and return limit+1 rows so nextCursor is set
    (prismaMock.taxEvent.findMany as any).mockImplementationOnce(async ({ take }: any) => {
      const n = take; // limit+1 per route
      const out = [] as any[];
      for (let i = 0; i < n; i++) {
        out.push({ id: `id${i}`, createdAt: new Date(), amount: 100 + i, tax: 9, treasury: 6, burn: 3, reason: "PURCHASE", fromUserId: "u1", toUserId: "u2" });
      }
      return out;
    });
    prismaMock.user.findMany.mockResolvedValueOnce([
      { id: "u1", username: "fromUser", walletAddress: "W1" },
      { id: "u2", username: "toUser", walletAddress: "W2" },
    ]);
    const mod = await import("../app/api/admin/treasury/ledger/route");
    const res = await (mod as any).GET(new Request("http://localhost/api/admin/treasury/ledger?limit=2"));
    const data = await res.json();
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.length).toBe(2);
    expect(typeof data.nextCursor === "string").toBe(true);
    expect(data.items[0]).toHaveProperty("from");
    expect(data.items[0]).toHaveProperty("to");
  });

  it("export CSV for ledger has correct headers and mime", async () => {
    prismaMock.taxEvent.findMany.mockResolvedValueOnce([
      { id: "t1", createdAt: new Date(0), amount: 100, tax: 9, treasury: 6, burn: 3, reason: "PURCHASE", fromUserId: "u1", toUserId: "u2" },
    ]);
    const mod = await import("../app/api/admin/treasury/export/route");
    const res = await (mod as any).GET(new Request("http://localhost/api/admin/treasury/export?scope=ledger"));
    expect(res.ok).toBe(true);
    const ct = res.headers.get("content-type") || "";
    expect(ct.includes("text/csv")).toBe(true);
    const disp = res.headers.get("content-disposition") || "";
    expect(disp.includes("attachment")).toBe(true);
    const csv = await res.text();
    const [header, first] = csv.trim().split("\n");
    expect(header).toBe("id,createdAt,type,basisAmount,taxAmount,toTreasury,burned,fromUserId,toUserId");
    expect(first.startsWith("t1,")).toBe(true);
  });

  it("non-admin gets 403", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "uUser", role: "LISTENER" });
    const mod = await import("../app/api/admin/treasury/summary/route");
    const res = await (mod as any).GET(new Request("http://localhost/api/admin/treasury/summary"));
    expect(res.status).toBe(403);
  });
});
