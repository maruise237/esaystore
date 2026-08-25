// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AppShell from "./AppShell";

vi.mock("./SyncStatus", () => ({
  default: () => <span>Synchronisation</span>,
}));

describe("barre latérale desktop", () => {
  beforeEach(() => window.localStorage.clear());

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
});
