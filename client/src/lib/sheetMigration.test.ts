import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { buildEasystorWorkbook, detectSheetKind, parseMigrationFile, parseSheetDate } from "./sheetMigration";

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
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual(["Guide", "Produits", "Variantes", "Clients", "Ventes", "Lignes de vente", "Dépenses", "Créances", "Remboursements", "Clôtures", "Mouvements stock", "Devises", "Taux de change"]);
  });

  it("parses a bounded CSV import without relying on the legacy XLSX parser", async () => {
    const content = "Nom;Prix de vente;Prix d’achat;Stock\nSavon;750;400;6";
    const file = { name: "produits.csv", size: new TextEncoder().encode(content).byteLength, text: async () => content } as File;
    const parsed = await parseMigrationFile(file);
    expect(parsed.data.products).toEqual([expect.objectContaining({ name: "Savon", salePrice: 750, purchasePrice: 400, stockQuantity: 6 })]);
  });

  it("parses a generated XLSX product sheet with the browser parser", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Produits");
    sheet.addRow(["Nom", "Prix de vente", "Prix d’achat", "Stock"]);
    sheet.addRow(["Savon XLSX", 900, 500, 4]);
    const bytes = await workbook.xlsx.writeBuffer();
    const file = new File([bytes], "produits.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const parsed = await parseMigrationFile(file);
    expect(parsed.data.products).toEqual([expect.objectContaining({ name: "Savon XLSX", salePrice: 900, purchasePrice: 500, stockQuantity: 4 })]);
  });
});
