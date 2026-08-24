import { describe, expect, it } from "vitest";
import { buildEasystorWorkbook, detectSheetKind, parseSheetDate } from "./sheetMigration";

describe("migration de fichiers", () => {
  it("recognizes common French worksheet names and headers", () => {
    expect(detectSheetKind("Produits", [])).toBe("products");
    expect(detectSheetKind("Historique des ventes", [])).toBe("sales");
    expect(detectSheetKind("Lignes de vente", [])).toBe("saleItems");
    expect(detectSheetKind("Divers", [{ "Date dépense": "2026-01-01", Montant: 1000 }])).toBe("expenses");
  });

  it("parses spreadsheet serial dates and ISO dates", () => {
    expect(parseSheetDate(46023)?.toISOString().slice(0, 10)).toBe("2026-01-01");
    expect(parseSheetDate("2026-08-24")?.toISOString().slice(0, 10)).toBe("2026-08-24");
    expect(parseSheetDate("24/08/2026")?.toISOString().slice(0, 10)).toBe("2026-08-24");
  });

  it("builds one Google Sheets-compatible workbook with all business tabs", () => {
    const workbook = buildEasystorWorkbook({ products: [], variants: [], customers: [], sales: [], saleItems: [], expenses: [], receivables: [], repayments: [], closures: [], stockMovements: [], currencies: [], exchangeRates: [] });
    expect(workbook.SheetNames).toEqual(["Guide", "Produits", "Variantes", "Clients", "Ventes", "Lignes de vente", "Dépenses", "Créances", "Remboursements", "Clôtures", "Mouvements stock", "Devises", "Taux de change"]);
  });
});
