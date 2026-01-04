import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("joins truthy values with spaces", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });
  it("filters out falsy values", () => {
    expect(cn("a", null as any, undefined as any, false as any, "b")).toBe("a b");
  });
  it("handles empty input", () => {
    expect(cn()).toBe("");
  });
});

