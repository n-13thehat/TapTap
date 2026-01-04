import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const prismaMock: any = {
  post: { findMany: vi.fn() },
  track: { findMany: vi.fn() },
  product: { findMany: vi.fn() },
  liveStream: { findMany: vi.fn() },
}

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))

describe("/api/home/featured", () => {
  const originalEnv = process.env.YOUTUBE_API_KEY

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.YOUTUBE_API_KEY = ""
  })

  afterEach(() => {
    process.env.YOUTUBE_API_KEY = originalEnv
  })

  it("returns recent blocks with counts", async () => {
    const now = new Date()
    prismaMock.post.findMany.mockResolvedValueOnce([{ id: "p1", text: "Hello", createdAt: now, user: { username: "alice" } }])
    prismaMock.track.findMany.mockResolvedValueOnce([
      { id: "t1", title: "Track One", createdAt: now, artist: { stageName: "VX9" } },
      { id: "t2", title: "Track Two", createdAt: now, artist: { stageName: "Muse" } },
    ])
    prismaMock.product.findMany
      .mockResolvedValueOnce([{ id: "prod", title: "TapPass", priceCents: 2500, createdAt: now }]) // marketplace
      .mockResolvedValueOnce([{ id: "poster", title: "Posterize Drop", priceCents: 4200, createdAt: now, desc: "Posterize" }]) // posterize
    prismaMock.liveStream.findMany.mockResolvedValueOnce([{ id: "ls1", title: "Live Now", startedAt: now }])

    const mod = await import("../app/api/home/featured/route")
    const res = await (mod as any).GET()
    expect(res.ok).toBe(true)
    const data = await res.json()

    expect(data.social.items).toHaveLength(1)
    expect(data.library.items).toHaveLength(2)
    expect(data.marketplace.items[0]).toMatchObject({ title: "TapPass" })
    expect(data.posterize.items[0]).toMatchObject({ title: "Posterize Drop" })
    expect(data.live.items[0].title).toBe("Live Now")
    expect(data.counts).toMatchObject({
      social: 1,
      library: 2,
      marketplace: 1,
      live: 1,
      battles: 0,
    })
  })
})
