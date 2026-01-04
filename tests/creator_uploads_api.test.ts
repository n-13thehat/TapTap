import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock Supabase client
const supabaseMock: any = {
  from: vi.fn((table: string) => {
    if (table === "User") {
      return {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [{ id: "uCreator" }], error: null }),
      };
    }
    if (table === "Track") {
      return {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ id: "t1", title: "Song", status: "draft", priceCents: 0, coverUrl: null, audioUrl: "audio.mp3", createdAt: "now" }],
          error: null,
        }),
        insert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: "track1" }, error: null }),
      };
    }
    if (table === "Split") {
      return {
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }
    if (table === "Product") {
      const select = vi.fn().mockReturnThis();
      const ilike = vi.fn().mockReturnThis();
      const limit = vi.fn().mockResolvedValue({ data: [], error: null });
      const update = vi.fn().mockResolvedValue({ data: null, error: null });
      const insert = vi.fn().mockResolvedValue({ data: null, error: null });
      return { select, ilike, limit, update, insert };
    }
    return {};
  }),
};

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => supabaseMock,
}));

const prismaMock: any = {
  track: {
    findUnique: vi.fn(async () => ({ meta: {} })),
    update: vi.fn(async () => ({})),
  },
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

describe("creator uploads API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://supabase.local";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
  });

  it("creates a track draft with tapgame metadata", async () => {
    const mod = await import("../app/api/creator/uploads/route");
    const body = {
      title: "Test Track",
      audioUrl: "https://example.com/audio.mp3",
      tapGame: { enabled: true, bpm: 140, priceCents: 999, difficulty: "Hard", description: "Test chart" },
    };
    const res = await (mod as any).POST(
      new Request("http://localhost/api/creator/uploads", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      })
    );
    expect(res.ok).toBe(true);
    const json = await res.json();
    expect(json.id).toBe("track1");
    expect(prismaMock.track.update).toHaveBeenCalled();
  });

  it("returns list of uploads for current user", async () => {
    const mod = await import("../app/api/creator/uploads/route");
    const res = await (mod as any).GET();
    expect(res.ok).toBe(true);
    const json = await res.json();
    expect(Array.isArray(json.rows)).toBe(true);
    expect(json.rows[0].id).toBe("t1");
  });
});
