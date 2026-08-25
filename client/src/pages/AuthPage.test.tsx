// @vitest-environment jsdom
import React from "react";
import axe from "axe-core";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AuthPage from "./AuthPage";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    auth: {
      register: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      login: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
    },
  },
}));

describe("parcours d’authentification", () => {
  afterEach(() => {
    cleanup();
    window.history.replaceState({}, "", "/");
  });

  it("explique les étapes initiales, rend le mot de passe visible à la demande et garde une structure accessible", async () => {
    render(<AuthPage />);
    expect(screen.getByText("1. Boutique")).toBeTruthy();
    expect(screen.getByText("2. Produit")).toBeTruthy();
    expect(
      screen.getByText(
        "Chaque vente garde son reçu, son stock et son paiement alignés."
      )
    ).toBeTruthy();
    expect(screen.getByText("Même hors connexion")).toBeTruthy();
    const password = screen.getByLabelText("Mot de passe") as HTMLInputElement;
    expect(password.type).toBe("password");
    fireEvent.click(screen.getByRole("button", { name: "Afficher le mot de passe" }));
    expect(password.type).toBe("text");
    fireEvent.click(screen.getByRole("tab", { name: "Se connecter" }));
    expect(screen.getByRole("tab", { name: "Se connecter" }).getAttribute("aria-selected")).toBe("true");
    const result = await axe.run(document.body, { rules: { "color-contrast": { enabled: false } } });
    expect(result.violations).toEqual([]);
  });

  it("ouvre directement la connexion lorsqu’une intention est fournie dans l’URL", () => {
    window.history.replaceState({}, "", "/?mode=login");
    render(<AuthPage />);

    expect(
      screen.getByRole("tab", { name: "Se connecter" }).getAttribute("aria-selected")
    ).toBe("true");
    expect(screen.getByRole("button", { name: "Accéder à ma boutique" })).toBeTruthy();
  });
});
