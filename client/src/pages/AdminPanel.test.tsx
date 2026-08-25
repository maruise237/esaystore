// @vitest-environment jsdom
import React from "react";
import axe from "axe-core";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminPanel from "./AdminPanel";

const mocks = vi.hoisted(() => ({
  invalidate: vi.fn(),
  mutate: vi.fn(),
  setShopActive: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      admin: {
        overview: { invalidate: mocks.invalidate },
        shops: { invalidate: mocks.invalidate },
        users: { invalidate: mocks.invalidate },
        activity: { invalidate: mocks.invalidate },
      },
    }),
    admin: {
      overview: {
        useQuery: () => ({
          isLoading: false,
          data: {
            users: { total: 3, active: 3, administrators: 1 },
            shops: { total: 2, active: 2, suspended: 0 },
            sales: { total: 10, today: 2, turnover: 12000 },
            activityToday: 1,
          },
          error: null,
        }),
      },
      shops: {
        useQuery: () => ({
          isLoading: false,
          data: [
            {
              id: "shop-1",
              name: "Boutique test",
              slug: "boutique-test",
              currency: "XAF",
              country: "CMR",
              isActive: true,
              suspensionReason: null,
              suspendedAt: null,
              createdAt: new Date(),
              ownerName: "Marchand test",
              ownerEmail: "merchant@easystor.test",
            },
          ],
          error: null,
        }),
      },
      users: { useQuery: () => ({ isLoading: false, data: [], error: null }) },
      activity: {
        useQuery: () => ({ isLoading: false, data: [], error: null }),
      },
      claimInitialAccess: {
        useMutation: () => ({
          isPending: false,
          mutate: mocks.mutate,
          error: null,
        }),
      },
      setShopActive: {
        useMutation: () => ({
          isPending: false,
          mutate: mocks.setShopActive,
          error: null,
        }),
      },
      setUserActive: {
        useMutation: () => ({
          isPending: false,
          mutate: mocks.mutate,
          error: null,
        }),
      },
      setUserRole: {
        useMutation: () => ({
          isPending: false,
          mutate: mocks.mutate,
          error: null,
        }),
      },
    },
  },
}));

describe("console d’administration", () => {
  afterEach(cleanup);

  it("présente une supervision administrateur sans violation axe structurelle", async () => {
    render(
      <AdminPanel
        user={{
          id: "admin-1",
          name: "Admin",
          email: "admin@easystor.test",
          role: "admin",
        }}
        canClaimInitialAccess={false}
        onExit={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    expect(
      screen.getByRole("heading", {
        name: "Pilotez la plateforme, sans toucher aux données métier.",
      })
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Boutiques" })).toBeTruthy();
    const result = await axe.run(document.body, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(result.violations).toEqual([]);
  });

  it("ne propose l’initialisation qu’en l’absence d’administrateur", () => {
    render(
      <AdminPanel
        user={{
          id: "user-1",
          name: "Premier compte",
          email: "first@easystor.test",
          role: "user",
        }}
        canClaimInitialAccess
        onExit={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: "Initialiser l’administration" })
    ).toBeTruthy();
  });

  it("demande un motif puis envoie la suspension de boutique après confirmation", () => {
    render(
      <AdminPanel
        user={{
          id: "admin-1",
          name: "Admin",
          email: "admin@easystor.test",
          role: "admin",
        }}
        canClaimInitialAccess={false}
        onExit={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Boutiques" }));
    fireEvent.click(screen.getByRole("button", { name: "Suspendre" }));
    fireEvent.change(screen.getByLabelText("Motif de suspension"), {
      target: { value: "Vérification de sécurité" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirmer" }));

    expect(mocks.setShopActive).toHaveBeenCalledWith({
      shopId: "shop-1",
      isActive: false,
      reason: "Vérification de sécurité",
    });
  });
});
