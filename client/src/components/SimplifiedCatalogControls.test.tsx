// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  CatalogAdvancedOptions,
  VariantPanelToggle,
} from "./SimplifiedCatalogControls";

describe("contrôles du catalogue simplifié", () => {
  it("keeps optional details collapsed until the merchant asks for them", async () => {
    const user = userEvent.setup();
    render(
      <CatalogAdvancedOptions>
        <p>Code-barres</p>
      </CatalogAdvancedOptions>
    );
    const details = screen.getByTestId(
      "catalog-advanced-options"
    ) as HTMLDetailsElement;
    expect(details.open).toBe(false);
    await user.click(screen.getByText("Ajouter des détails facultatifs"));
    expect(details.open).toBe(true);
    expect(screen.getByText("Code-barres")).toBeTruthy();
  });

  it("opens the variant action only when requested", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<VariantPanelToggle open={false} onToggle={onToggle} />);
    const action = screen.getByRole("button", {
      name: "+ Ajouter taille ou couleur",
    });
    expect(action.getAttribute("aria-expanded")).toBe("false");
    await user.click(action);
    expect(onToggle).toHaveBeenCalledOnce();
  });
});
