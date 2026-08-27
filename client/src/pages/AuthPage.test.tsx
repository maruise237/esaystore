// @vitest-environment jsdom
import React from "react";
import axe from "axe-core";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AuthPage from "./AuthPage";

const { signUpEmail } = vi.hoisted(() => ({ signUpEmail: vi.fn() }));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    auth: {
      register: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      login: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
    },
    shops: { create: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn() }) } },
  },
}));

vi.mock("@/lib/neonAuth", () => ({
  neonAuthClient: {
    signIn: { email: vi.fn() },
    signUp: { email: signUpEmail },
    emailOtp: { verifyEmail: vi.fn() },
    signOut: vi.fn(),
  },
}));

describe("parcours d’authentification", () => {
  afterEach(() => {
    cleanup();
    signUpEmail.mockReset();
    window.history.replaceState({}, "", "/");
  });

  it("allège l’inscription, propose le pays et la devise, rend le mot de passe visible et garde une structure accessible", async () => {
    render(<AuthPage />);
    expect(screen.getByText(/Quelques informations suffisent pour ouvrir votre espace/i)).toBeTruthy();
    expect(screen.getByText(/Aucun paiement requis\. Le pays et la devise sont proposés puis restent modifiables/i)).toBeTruthy();
    const country = screen.getByLabelText("Pays, indicatif et devise") as HTMLSelectElement;
    expect(country.value).toBe("CMR");
    expect(screen.getByRole("option", { name: /Cameroun \(CM\).*\+237.*Franc CFA \(XAF\)/i })).toBeTruthy();
    fireEvent.change(country, { target: { value: "NGA" } });
    expect(country.value).toBe("NGA");
    expect(screen.getByText(/Naira nigérian \(NGN\) est utilisé comme devise de référence/i)).toBeTruthy();
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
    window.history.replaceState({}, "", "/auth?mode=login");
    render(<AuthPage />);

    expect(
      screen.getByRole("tab", { name: "Se connecter" }).getAttribute("aria-selected")
    ).toBe("true");
    expect(screen.getByRole("button", { name: "Accéder à ma boutique" })).toBeTruthy();
  });

  it("propose uniquement l’accès e-mail depuis l’onglet de connexion", () => {
    window.history.replaceState({}, "", "/auth?mode=login");
    render(<AuthPage />);

    expect(screen.queryByRole("button", { name: "Continuer avec Google" })).toBeNull();
    expect(screen.getByRole("button", { name: "Accéder à ma boutique" })).toBeTruthy();
  });

  it("demande le code envoyé par Neon Auth lorsque l’e-mail doit être vérifié", async () => {
    signUpEmail.mockResolvedValue({ data: { user: { emailVerified: false } } });
    render(<AuthPage />);
    fireEvent.change(screen.getByLabelText("Nom de la boutique"), { target: { value: "Épicerie du marché" } });
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "jules@example.test" } });
    fireEvent.change(screen.getByLabelText("Mot de passe"), { target: { value: "motdepasse-solide" } });
    fireEvent.submit(screen.getByRole("button", { name: "Créer ma boutique" }).closest("form")!);

    expect(await screen.findByText(/Un code de vérification a été envoyé/)).toBeTruthy();
    expect(screen.getByLabelText("Code de vérification")).toBeTruthy();
  });
});
