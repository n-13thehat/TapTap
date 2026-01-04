import { describe, it, expect, beforeAll } from "vitest";
import React from "react";
import { renderHook, act } from "@testing-library/react";
import { MatrixRainProvider, useMatrixRain } from "@/providers/MatrixRainProvider";

function wrapper({ children }: { children: React.ReactNode }) {
  return <MatrixRainProvider>{children}</MatrixRainProvider>;
}

describe("useMatrixRain", () => {
  beforeAll(() => {
    // mock canvas 2D context for jsdom
    // @ts-ignore
    HTMLCanvasElement.prototype.getContext = () => ({
      fillStyle: "",
      fillRect: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      font: "",
      shadowColor: "",
      shadowBlur: 0,
      fillText: () => {},
    }) as any;
  });
  it("defaults to medium", () => {
    const { result } = renderHook(() => useMatrixRain(), { wrapper });
    expect(result.current.level).toBe("medium");
  });

  it("updates level via setLevel", () => {
    const { result } = renderHook(() => useMatrixRain(), { wrapper });
    act(() => result.current.setLevel("full"));
    expect(result.current.level).toBe("full");
  });
});
