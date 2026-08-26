// @vitest-environment jsdom
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GradientBars } from "./GradientBars";

describe("fond Gradient Bars EASYSTOR", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("rend une texture visible de dix barres décoratives", () => {
    render(<GradientBars />);

    expect(document.querySelector('[data-motion="gradient-bars"]')).toBeTruthy();
    expect(document.querySelectorAll('[data-gradient-bar="easystor"]')).toHaveLength(10);
  });

  it("laisse le fond statique lorsque le mouvement réduit est demandé", () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    render(<GradientBars bars={3} />);

    expect(document.querySelector('[data-animated]')).toBeNull();
    expect(document.querySelectorAll('[data-gradient-bar="easystor"]')).toHaveLength(3);
  });
});
