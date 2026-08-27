// @vitest-environment jsdom
import React from "react";
import axe from "axe-core";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ProfilePanel from "./ProfilePanel";

const { mutateAsync, invalidate, settingsData } = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  invalidate: vi.fn(),
  settingsData: {
    user: { email: "aline@boutique.test", phone: "+237699789999" },
    shop: { id: "shop-1", name: "Boutique test", country: "CMR", currency: "XAF", updatedAt: new Date("2026-08-27T10:30:00.000Z") },
    canEditShopSettings: true,
  },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ profile: { settings: { invalidate } }, shops: { list: { invalidate } }, currencies: { settings: { invalidate } } }),
    profile: {
      settings: { useQuery: () => ({ data: settingsData, isLoading: false }) },
      update: { useMutation: (options: { onSuccess?: () => Promise<void> }) => ({ isPending: false, mutateAsync: async (input: unknown) => { mutateAsync(input); await options.onSuccess?.(); } }) },
    },
  },
}));

describe("réglages de profil", () => {
  afterEach(() => { cleanup(); mutateAsync.mockReset(); });

  it("permet au propriétaire de mettre à jour téléphone, pays et devise associée", async () => {
    render(<main><ProfilePanel shopId="7d2e8dcf-3502-484f-85c1-a4b252930ca1" /></main>);
    expect(await screen.findByDisplayValue("+237 699 789 999")).toBeTruthy();
    fireEvent.click(screen.getByRole("combobox", { name: "Pays, indicatif et devise" }));
    fireEvent.change(screen.getByLabelText("Rechercher un pays"), { target: { value: "Nigéria" } });
    fireEvent.click(screen.getByText(/Nigéria \(NG\).*\+234/i));
    fireEvent.change(screen.getByLabelText("Numéro de téléphone \(facultatif\)"), { target: { value: "8031234567" } });
    fireEvent.submit(screen.getByRole("button", { name: "Enregistrer les réglages" }).closest("form")!);
    expect(mutateAsync).toHaveBeenCalledWith({ shopId: "7d2e8dcf-3502-484f-85c1-a4b252930ca1", phone: "+2348031234567", country: "NGA" });
  });

  it("enregistre le nom de boutique et confirme explicitement le succès", async () => {
    render(<main><ProfilePanel shopId="7d2e8dcf-3502-484f-85c1-a4b252930ca1" /></main>);
    const name = await screen.findByLabelText("Nom de la boutique");
    expect(screen.getByText(/Dernière mise à jour :/)).toBeTruthy();
    fireEvent.change(name, { target: { value: "Épicerie Aline" } });
    fireEvent.submit(screen.getByRole("button", { name: "Enregistrer les réglages" }).closest("form")!);
    expect(mutateAsync).toHaveBeenCalledWith({ shopId: "7d2e8dcf-3502-484f-85c1-a4b252930ca1", phone: "+237699789999", name: "Épicerie Aline" });
    expect((await screen.findByRole("status")).textContent).toContain("Modifications enregistrées avec succès.");
  });

  it("conserve une structure accessible", async () => {
    render(<main><ProfilePanel shopId="7d2e8dcf-3502-484f-85c1-a4b252930ca1" /></main>);
    const result = await axe.run(document.body, { rules: { "color-contrast": { enabled: false } } });
    expect(result.violations).toEqual([]);
  });
});
