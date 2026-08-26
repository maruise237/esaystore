// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const { useAuth } = vi.hoisted(() => ({ useAuth: vi.fn() }));

vi.mock("./_core/hooks/useAuth", () => ({ useAuth }));
vi.mock("./components/ErrorBoundary", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("./contexts/ThemeContext", () => ({ ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/components/ui/tooltip", () => ({ TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/components/ui/sonner", () => ({ Toaster: () => null }));
vi.mock("./components/PwaInstallPrompt", () => ({ default: () => null }));
vi.mock("./components/PwaUpdatePrompt", () => ({ default: () => null }));
vi.mock("./pages/Home", () => ({ default: () => <p>Landing publique</p> }));
vi.mock("./pages/AuthPage", () => ({ default: () => <p>Authentification e-mail</p> }));
vi.mock("./pages/Workspace", () => ({ default: () => <p>Espace marchand</p> }));
vi.mock("./pages/PlatformAdminPage", () => ({ default: () => <p>Console plateforme</p> }));

describe("routes publiques EASYSTOR", () => {
  afterEach(() => {
    cleanup();
    window.history.replaceState({}, "", "/");
  });

  it("affiche la landing sur la racine pour un visiteur non connecté", () => {
    useAuth.mockReturnValue({ user: null, loading: false });
    window.history.replaceState({}, "", "/");
    render(<App />);
    expect(screen.getByText("Landing publique")).toBeTruthy();
  });

  it("donne une route dédiée à l’authentification et préserve les espaces privés", () => {
    useAuth.mockReturnValue({ user: null, loading: false });
    window.history.replaceState({}, "", "/auth?mode=login");
    const authView = render(<App />);
    expect(screen.getByText("Authentification e-mail")).toBeTruthy();
    authView.unmount();

    window.history.replaceState({}, "", "/app");
    render(<App />);
    expect(screen.getByText("Espace marchand")).toBeTruthy();
  });

  it("laisse la landing et le formulaire accessibles pendant la vérification anonyme", () => {
    useAuth.mockReturnValue({ user: null, loading: true });
    window.history.replaceState({}, "", "/");
    const landing = render(<App />);
    expect(screen.getByText("Landing publique")).toBeTruthy();
    landing.unmount();

    window.history.replaceState({}, "", "/auth?mode=register");
    render(<App />);
    expect(screen.getByText("Authentification e-mail")).toBeTruthy();
  });
});
