// @vitest-environment jsdom
import React from "react";
import axe from "axe-core";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import MigrationPanel from "./MigrationPanel";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    migration: {
      preview: {
        useMutation: () => ({
          data: null,
          mutate: vi.fn(),
          reset: vi.fn(),
          isPending: false,
        }),
      },
      exportData: {
        useQuery: () => ({
          refetch: vi.fn(),
          data: undefined,
          isFetching: false,
        }),
      },
      run: {
        useMutation: () => ({
          isPending: false,
          mutate: vi.fn(),
          reset: vi.fn(),
          error: null,
        }),
      },
    },
  },
}));

vi.mock("@/lib/sheetMigration", async () => {
  const actual = await vi.importActual<typeof import("@/lib/sheetMigration")>("@/lib/sheetMigration");
  return {
    ...actual,
    parseMigrationFile: vi.fn().mockResolvedValue({
      data: {
        products: [{ sourceId: "products-1", name: "Savon", salePrice: 800, purchasePrice: 400, stockQuantity: 3 }], customers: [], suppliers: [{ sourceId: "suppliers-1", name: "Fournisseur local" }], sales: [], saleItems: [], purchases: [{ sourceId: "purchases-1", reference: "ACH-1", purchasedAt: new Date("2026-01-01"), status: "received", subtotal: 400, taxAmount: 0, total: 400 }], purchaseItems: [{ sourceId: "purchase-lines-1", purchaseReference: "ACH-1", productName: "Savon", quantity: 1, unitPrice: 400 }], expenses: [],
      },
      ignoredSheets: ["Synthese"],
      sheetSummary: [
        { name: "Produits", kind: "products", status: "imported", rows: 1, reason: "1 produit détecté." },
        { name: "Stock_Mouvements", kind: "stockMovements", status: "support", rows: 2, reason: "Utilisé pour reconstituer le stock final." },
        { name: "Synthese", kind: "unknown", status: "ignored", rows: 4, reason: "Onglet de synthèse non importable." },
      ],
    }),
  };
});

describe("accessibilité de la migration", () => {
  afterEach(cleanup);

  it("names the spreadsheet selection control and has no structural axe violation", async () => {
    render(
      <main>
        <MigrationPanel shopId="shop-test" />
      </main>
    );
    expect(screen.getByLabelText("Sélectionner")).toBeTruthy();
    const result = await axe.run(document.body, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(result.violations).toEqual([]);
  });

  it("shows detected categories and the explained sheet status before confirmation", async () => {
    render(<MigrationPanel shopId="shop-test" />);
    fireEvent.change(screen.getByLabelText("Sélectionner"), { target: { files: [new File(["test"], "gestion.xlsx")] } });
    expect(await screen.findByText("Onglets examinés avant import")).toBeTruthy();
    expect(screen.getByText("Fournisseurs")).toBeTruthy();
    expect(screen.getByText("Lignes d’achat")).toBeTruthy();
    expect(screen.getByText("Utilisé pour le stock")).toBeTruthy();
    expect(screen.getByText("Onglet de synthèse non importable.")).toBeTruthy();
    expect(screen.getByText(/1 onglet ignoré : Synthese/)).toBeTruthy();
  });
});
