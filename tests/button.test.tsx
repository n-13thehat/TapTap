import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders a button element with default classes", () => {
    const { container } = render(<Button>Click</Button>);
    const btn = container.querySelector("button")!;
    expect(btn).toBeTruthy();
    expect(btn.className).toMatch(/inline-flex/);
  });

  it("supports variant=link", () => {
    const { container } = render(<Button variant="link">Link</Button>);
    const btn = container.querySelector("button")!;
    expect(btn.className).toMatch(/underline/);
  });
});
