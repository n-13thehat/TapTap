import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: { findUnique: vi.fn() },
    betaInvite: {
      findMany: vi.fn(async () => []),
      create: vi.fn(async ({ data }: any) => ({ id: "inv-1", ...data })),
      findUnique: vi.fn(),
      delete: vi.fn(async () => ({ id: "inv-1" })),
    },
  } as any,
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const authMock = vi.fn();
vi.mock("@/auth.config", () => ({ auth: authMock }));

function makeReq(url: string, init: RequestInit = {}) {
  return new Request(url, init);
}

describe("/api/admin/invites GET + POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { email: "admin@taptap.dev" } });
    prismaMock.user.findUnique.mockResolvedValue({ id: "admin-1", role: "ADMIN" });
  });

  it("returns 403 when caller is not authenticated", async () => {
    authMock.mockResolvedValueOnce(null);
    const mod = await import("../app/api/admin/invites/route");
    const res = await mod.GET(makeReq("http://localhost/api/admin/invites"));
    expect(res.status).toBe(403);
  });

  it("returns 403 when caller is not an admin", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "user-1", role: "LISTENER" });
    const mod = await import("../app/api/admin/invites/route");
    const res = await mod.GET(makeReq("http://localhost/api/admin/invites"));
    expect(res.status).toBe(403);
  });

  it("lists invites with status filter applied", async () => {
    prismaMock.betaInvite.findMany.mockResolvedValueOnce([
      { id: "inv-1", code: "BETA-1", claimedByUserId: null, claimedAt: null, createdAt: new Date(), claimedBy: null },
    ]);
    const mod = await import("../app/api/admin/invites/route");
    const res = await mod.GET(
      makeReq("http://localhost/api/admin/invites?status=unclaimed"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.invites).toHaveLength(1);

    const args = prismaMock.betaInvite.findMany.mock.calls[0][0];
    expect(args.where).toEqual({ claimedByUserId: null });
  });

  it("creates the requested number of invites in BETA-XXXX-XXXX format", async () => {
    const mod = await import("../app/api/admin/invites/route");
    const res = await mod.POST(
      makeReq("http://localhost/api/admin/invites", {
        method: "POST",
        body: JSON.stringify({ count: 3 }),
        headers: { "content-type": "application/json" },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.created).toBe(3);
    expect(body.codes).toHaveLength(3);
    for (const code of body.codes) {
      expect(code).toMatch(/^BETA-[0-9A-F]{4}-[0-9A-F]{4}$/);
    }
  });

  it("rejects count > 100", async () => {
    const mod = await import("../app/api/admin/invites/route");
    const res = await mod.POST(
      makeReq("http://localhost/api/admin/invites", {
        method: "POST",
        body: JSON.stringify({ count: 9999 }),
        headers: { "content-type": "application/json" },
      }),
    );
    expect(res.status).toBe(400);
  });
});

describe("/api/admin/invites/[id] DELETE", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { email: "admin@taptap.dev" } });
    prismaMock.user.findUnique.mockResolvedValue({ id: "admin-1", role: "ADMIN" });
  });

  it("revokes an unclaimed invite", async () => {
    prismaMock.betaInvite.findUnique.mockResolvedValueOnce({ id: "inv-1", claimedByUserId: null });
    const mod = await import("../app/api/admin/invites/[id]/route");
    const res = await mod.DELETE(
      makeReq("http://localhost/api/admin/invites/inv-1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "inv-1" }) },
    );
    expect(res.status).toBe(200);
    expect(prismaMock.betaInvite.delete).toHaveBeenCalledWith({ where: { id: "inv-1" } });
  });

  it("returns 404 for unknown invite id", async () => {
    prismaMock.betaInvite.findUnique.mockResolvedValueOnce(null);
    const mod = await import("../app/api/admin/invites/[id]/route");
    const res = await mod.DELETE(
      makeReq("http://localhost/api/admin/invites/nope", { method: "DELETE" }),
      { params: Promise.resolve({ id: "nope" }) },
    );
    expect(res.status).toBe(404);
  });

  it("returns 409 when the invite was already claimed", async () => {
    prismaMock.betaInvite.findUnique.mockResolvedValueOnce({
      id: "inv-1",
      claimedByUserId: "user-1",
    });
    const mod = await import("../app/api/admin/invites/[id]/route");
    const res = await mod.DELETE(
      makeReq("http://localhost/api/admin/invites/inv-1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "inv-1" }) },
    );
    expect(res.status).toBe(409);
    expect(prismaMock.betaInvite.delete).not.toHaveBeenCalled();
  });
});
