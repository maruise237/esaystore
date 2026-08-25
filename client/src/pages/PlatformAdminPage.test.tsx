// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PlatformAdminPage from "./PlatformAdminPage";

const authState = vi.hoisted(() => ({
  user: {
    id: "merchant-1",
    name: "Marchand",
    email: "merchant@example.com",
    role: "user" as const,
  },
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: authState.user, loading: false }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    admin: {
      bootstrapStatus: {
        useQuery: () => ({
          isLoading: false,
          data: { available: false, canClaimInitialAccess: false },
          error: null,
        }),
      },
    },
    auth: {
      logout: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));

describe("route privée de plateforme", () => {
  afterEach(cleanup);

  it("refuse la console à un compte marchand sans rendre le panneau administrateur", () => {
    render(<PlatformAdminPage />);

    expect(
      screen.getByRole("heading", { name: "Console de plateforme" })
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Cette console est réservée aux administrateurs de la plateforme."
      )
    ).toBeTruthy();
    expect(screen.getByText("Accès opérateur sécurisé")).toBeTruthy();
    expect(screen.getByText("EASYSTOR")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Se connecter" })).toBeTruthy();
    expect(
      screen.queryByText(
        "Pilotez la plateforme, sans toucher aux données métier."
      )
    ).toBeNull();
  });
});
