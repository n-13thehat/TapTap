import { describe, it, expect, vi, beforeEach } from "vitest";
vi.mock("../app/api/surf/_lib/youtube", () => ({
  ytFetch: vi.fn(async () => ({ items: [{ id: { videoId: "abc" }, snippet: { title: "T", thumbnails: { medium: { url: "u" } }, channelTitle: "C" } }] })),
}));
import * as route from "../app/api/surf/search/route";

describe("surf search API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty items when q is missing", async () => {
    const url = "http://localhost/api/surf/search";
    const res = await (route as any).GET(new Request(url));
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.length).toBe(0);
  });

  it("returns items from ytFetch when q provided", async () => {
    const url = "http://localhost/api/surf/search?q=hello&max=5";
    const res = await (route as any).GET(new Request(url));
    const data = await res.json();
    expect(data.items[0]).toMatchObject({ id: "abc", title: "T" });
  });

  it("handles upstream errors gracefully", async () => {
    const mod = await import("../app/api/surf/_lib/youtube");
    (mod as any).ytFetch.mockImplementationOnce(async () => {
      throw new Error("boom");
    });
    const url = "http://localhost/api/surf/search?q=oops";
    const res = await (route as any).GET(new Request(url));
    expect(res.status).toBeGreaterThanOrEqual(500);
  });
});
