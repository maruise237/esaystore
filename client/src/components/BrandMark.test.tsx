// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrandMark } from "./BrandMark";

describe("BrandMark", () => {
  it("expose un symbole SVG unique, décoratif par défaut et nommable lorsque nécessaire", () => {
    const { rerender } = render(<BrandMark className="text-[#1e2924]" />);
    const mark = document.querySelector('[data-brand-mark="easystor"]');
    expect(mark?.getAttribute("viewBox")).toBe("0 0 512 512");
    expect(mark?.getAttribute("aria-hidden")).toBe("true");
    rerender(<BrandMark title="EASYSTOR" />);
    expect(screen.getByRole("img", { name: "EASYSTOR" })).toBeTruthy();
  });
});
