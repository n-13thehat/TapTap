import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { Badge } from "@/components/ui/badge";

describe("Badge", () => {
  it("renders with default variant classes", () => {
    const { container } = render(<Badge className="">New</Badge>);
    const div = container.querySelector("div")!;
    expect(div.className).toMatch(/inline-flex/);
  });
});
