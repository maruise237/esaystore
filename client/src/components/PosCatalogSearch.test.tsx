// @vitest-environment jsdom
import React from "react";
import axe from "axe-core";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PosCatalogSearch from "./PosCatalogSearch";

describe("accessibilité de la recherche POS", () => {
  afterEach(cleanup);

  it("names search and scanner controls without structural axe violation", async () => {
    render(
      <main>
        <PosCatalogSearch
          query=""
          onQueryChange={vi.fn()}
          onOpenScanner={vi.fn()}
        />
      </main>
    );
    expect(
      screen.getByLabelText("Rechercher un produit dans la caisse")
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Scanner" })).toBeTruthy();
    const result = await axe.run(document.body, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(result.violations).toEqual([]);
  });
});
