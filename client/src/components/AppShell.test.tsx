// @vitest-environment jsdom
import React from "react";
import axe from "axe-core";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AppShell from "./AppShell";

vi.mock("./SyncStatus", () => ({
  default: () => <span>Synchronisation</span>,
}));

describe("barre latérale desktop", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(cleanup);

  it("collapses from an accessible action while keeping labeled icon navigation", async () => {
    const user = userEvent.setup();
    render(
      <AppShell
        active="dashboard"
        onNavigate={vi.fn()}
        shopName="Boutique test"
        currency="XAF"
        userName="Aline"
        onLogout={vi.fn()}
      >
        <p>Contenu</p>
      </AppShell>
    );
    const sidebar = screen.getByTestId("desktop-sidebar");
    expect(sidebar.className).toContain("w-72");
    const toggle = screen.getByLabelText("Réduire la barre latérale");
    toggle.focus();
    await user.keyboard("{Enter}");
    expect(sidebar.className).toContain("w-[76px]");
    expect(screen.getByLabelText("Développer la barre latérale")).toBeTruthy();
    expect(screen.getByTitle("Produits")).toBeTruthy();
  });

  it("has no structural accessibility violation in the navigation shell", async () => {
    render(
      <AppShell
        active="dashboard"
        onNavigate={vi.fn()}
        shopName="Boutique test"
        currency="XAF"
        userName="Aline"
        onLogout={vi.fn()}
      >
        <p>Contenu</p>
      </AppShell>
    );
    const result = await axe.run(document.body, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(result.violations).toEqual([]);
  });
});
