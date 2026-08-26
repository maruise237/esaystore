// @vitest-environment jsdom
import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InteractiveGridPattern } from "./InteractiveGridPattern";

describe("InteractiveGridPattern", () => {
  it("rend une grille décorative non accessible au clavier", () => {
    const { container } = render(<InteractiveGridPattern />);
    const grid = container.querySelector('[data-interactive-grid="easystor"]');

    expect(grid?.getAttribute("aria-hidden")).toBe("true");
    expect(grid?.getAttribute("role")).toBe("presentation");
  });

  it("met en évidence une cellule au survol sans la conserver au départ", () => {
    const { container } = render(<InteractiveGridPattern width={20} height={20} />);
    const grid = container.querySelector('[data-interactive-grid="easystor"]') as SVGSVGElement;
    const activeCell = container.querySelector('[data-interactive-grid-active="easystor"]');

    Object.defineProperty(grid, "getBoundingClientRect", {
      value: () => ({ left: 0, top: 0, width: 200, height: 200 }),
    });

    expect(activeCell?.getAttribute("opacity")).toBe("0");
    fireEvent.pointerMove(grid, { clientX: 45, clientY: 65, pointerType: "mouse" });
    expect(activeCell?.getAttribute("opacity")).toBe("1");
    expect(activeCell?.getAttribute("x")).toBe("40");
    expect(activeCell?.getAttribute("y")).toBe("60");
  });
});
