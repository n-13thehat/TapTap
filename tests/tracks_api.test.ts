import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth.config", () => ({ auth: vi.fn(async () => ({ user: { email: "creator@taptap.local" } })) }));

const prismaMock: any = {
  user: { findUnique: vi.fn(async () => ({ id: "u1", role: "CREATOR" })) },
  artist: { findFirst: vi.fn(async () => ({ id: "artist1" })) },
  track: {
    create: vi.fn(async () => ({ id: "t1" })),
    update: vi.fn(async () => ({})),
  },
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

vi.mock("@/lib/supabase", () => ({
  withServiceRole: (fn: any) => fn({ storage: { from: (_b: string) => ({ createSignedUploadUrl: async (_p: string) => ({ data: { token: "tok", path: "u1/t1" } }) }) } }),
}));

describe("tracks upload API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates track and returns signed upload", async () => {
    const mod = await import("../app/api/tracks/route");
    const req = new Request("http://localhost/api/tracks", { method: "POST", body: JSON.stringify({ title: "Song A", mimeType: "audio/mpeg" }), headers: { "content-type": "application/json" } });
    const res = await (mod as any).POST(req);
    const data = await res.json();
    expect(res.ok).toBe(true);
    expect(data.trackId).toBe("t1");
    expect(data.upload?.token).toBe("tok");
  });
});
