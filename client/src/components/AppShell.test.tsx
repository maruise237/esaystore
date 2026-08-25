// @vitest-environment jsdom
import React from "react";
import axe from "axe-core";
import { cleanup, render, screen, within } from "@testing-library/react";
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

  it("garde toutes les sections dans une zone de navigation défilable", () => {
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

    const navigation = screen.getByRole("navigation", {
      name: "Navigation principale",
    });
    expect(navigation.className).toContain("overflow-y-auto");
    expect(navigation.className).toContain("flex-1");
    expect(screen.getByRole("button", { name: "Support" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Synchronisation" })).toBeTruthy();
  });

  it.each([540, 720])(
    "garde toutes les sections et la déconnexion atteignables à hauteur desktop %ipx",
    async height => {
    const user = userEvent.setup();
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: height,
    });
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
    const navigation = within(sidebar).getByRole("navigation", {
      name: "Navigation principale",
    });
    const support = within(navigation).getByRole("button", {
      name: "Support",
    });
    const logout = within(sidebar).getByRole("button", {
      name: "Se déconnecter",
    });

    expect(sidebar.className).toContain("overflow-hidden");
    expect(navigation.className).toContain("overflow-y-auto");
    expect(logout.parentElement?.className).toContain("shrink-0");
    [
      "Pilotage",
      "Caisse",
      "Produits",
      "Stock",
      "Crédits",
      "Ventes",
      "Dépenses",
      "Rapports",
      "Clôture",
      "Importer / exporter",
      "Devises & taux",
      "Équipe",
      "Synchronisation",
      "Support",
    ].forEach(label => {
      expect(within(navigation).getByRole("button", { name: label })).toBeTruthy();
    });
    support.focus();
    await user.tab();
    expect(document.activeElement).toBe(logout);
    }
  );
});
