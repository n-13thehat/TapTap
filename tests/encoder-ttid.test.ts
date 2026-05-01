import { describe, it, expect } from "vitest";
import { generateTtid, generateTtidBatch, isTtid, TTID_PREFIX } from "@/lib/encoder/ttid";

describe("encoder/ttid", () => {
  it("generates a prefixed, fixed-length ttid", () => {
    const t = generateTtid();
    expect(t.startsWith(TTID_PREFIX)).toBe(true);
    expect(t).toHaveLength(TTID_PREFIX.length + 10);
  });

  it("isTtid validates the format", () => {
    expect(isTtid(generateTtid())).toBe(true);
    expect(isTtid("nope")).toBe(false);
    expect(isTtid("tt_short")).toBe(false);
    expect(isTtid("tt_BADCHARLOL")).toBe(false);
    expect(isTtid("tt_0123456789")).toBe(true);
    expect(isTtid(123 as any)).toBe(false);
    expect(isTtid("")).toBe(false);
  });

  it("rejects letters not in Crockford alphabet (I,L,O,U)", () => {
    expect(isTtid("tt_AAAAIAAAAA")).toBe(false);
    expect(isTtid("tt_AAAALAAAAA")).toBe(false);
    expect(isTtid("tt_AAAAOAAAAA")).toBe(false);
    expect(isTtid("tt_AAAAUAAAAA")).toBe(false);
  });

  it("generateTtidBatch returns the requested unique count", () => {
    const batch = generateTtidBatch(50);
    expect(batch).toHaveLength(50);
    expect(new Set(batch).size).toBe(50);
    for (const t of batch) expect(isTtid(t)).toBe(true);
  });

  it("generateTtidBatch handles invalid inputs", () => {
    expect(generateTtidBatch(0)).toEqual([]);
    expect(generateTtidBatch(-5)).toEqual([]);
    expect(generateTtidBatch(1.5 as any)).toEqual([]);
  });
});
