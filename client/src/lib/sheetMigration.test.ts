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
    const workbook = buildEasystorWorkbook({ products: [], variants: [], customers: [], suppliers: [], sales: [], saleItems: [], purchases: [], purchaseItems: [], expenses: [], receivables: [], repayments: [], closures: [], stockMovements: [], currencies: [], exchangeRates: [] });
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual(["Guide", "Produits", "Variantes", "Clients", "Fournisseurs", "Ventes", "Lignes de vente", "Achats", "Lignes d’achat", "Dépenses", "Créances", "Remboursements", "Clôtures", "Mouvements stock", "Devises", "Taux de change"]);
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

  it("parses a management workbook with preamble rows, SKU/client links and formulas without cached values", async () => {
    const workbook = new ExcelJS.Workbook();
    const products = workbook.addWorksheet("Produits"); products.addRows([[], [], [], ["SKU", "Produit", "Code catégorie", "Prix achat HT (€)", "Prix vente TTC (€)", "Stock initial", "Stock minimum", "Stock actuel"], ["SKU-01", "Robe importée", "CAT-01", 20, 50, 10, 3, { formula: "F5+1-3" }]]);
    const customers = workbook.addWorksheet("Clients"); customers.addRows([[], [], [], ["ID client", "Nom complet", "Téléphone"], ["CLI-01", "Aline Client", "+237600000000"]]);
    const sales = workbook.addWorksheet("Ventes"); sales.addRows([[], [], [], ["ID vente", "Date", "ID client", "Mode paiement", "Statut", "Total TTC (€)"], ["VEN-01", new Date("2026-01-10T00:00:00.000Z"), "CLI-01", "Mobile Money", "Payée", { formula: "SUMIFS(Lignes_Ventes!$H:$H,Lignes_Ventes!$B:$B,A5)" }]]);
    const lines = workbook.addWorksheet("Lignes_Ventes"); lines.addRows([[], [], [], ["ID ligne", "ID vente", "SKU", "Produit", "Quantité", "Prix unitaire TTC (€)", "Remise ligne (€)", "Total ligne (€)"], ["LV-01", "VEN-01", "SKU-01", { formula: "VLOOKUP(C5,Produits!A:B,2,FALSE)" }, 2, { formula: "VLOOKUP(C5,Produits!A:E,5,FALSE)" }, 0, { formula: "E5*F5" }]]);
    const movements = workbook.addWorksheet("Stock_Mouvements"); movements.addRows([[], [], [], ["ID mouvement", "Date", "SKU", "Type mouvement", "Quantité signée"], ["MVT-01", new Date("2026-01-10T00:00:00.000Z"), "SKU-01", "Vente", -2], ["MVT-02", new Date("2026-01-11T00:00:00.000Z"), "SKU-01", "Achat", 1]]);
    const expenses = workbook.addWorksheet("Dépenses"); expenses.addRows([[], [], [], ["ID dépense", "Date", "Catégorie", "Description", "Montant HT (€)", "Total TTC (€)"], ["DEP-01", new Date("2026-01-12T00:00:00.000Z"), "Transport", "Livraison", 20, { formula: "E5*1.2" }]]);
    const bytes = await workbook.xlsx.writeBuffer();
    const file = new File([bytes], "gestion-boutique.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const parsed = await parseMigrationFile(file);
    expect(parsed.data.products).toEqual([expect.objectContaining({ name: "Robe importée", reference: "SKU-01", category: "CAT-01", stockQuantity: 9, salePrice: 50, purchasePrice: 20 })]);
    expect(parsed.data.customers).toEqual([expect.objectContaining({ name: "Aline Client", phone: "+237600000000" })]);
    expect(parsed.data.sales).toEqual([expect.objectContaining({ reference: "VEN-01", customerName: "Aline Client", total: 100, mobileMoney: 100 })]);
    expect(parsed.data.saleItems).toEqual([expect.objectContaining({ saleReference: "VEN-01", productName: "Robe importée", quantity: 2, unitPrice: 50, purchasePrice: 20 })]);
    expect(parsed.data.expenses).toEqual([expect.objectContaining({ category: "Transport", amount: 20, note: "Livraison" })]);
    expect(parsed.ignoredSheets).not.toContain("Stock_Mouvements");
  });

  it("parses suppliers, purchases and purchase lines while reporting non-imported sheets", async () => {
    const workbook = new ExcelJS.Workbook();
    const products = workbook.addWorksheet("Produits"); products.addRows([[], [], [], ["SKU", "Produit", "Prix achat HT (€)", "Prix vente TTC (€)", "Stock initial"], ["SKU-01", "Produit fournisseur", 8, 20, 10]]);
    const suppliers = workbook.addWorksheet("Fournisseurs"); suppliers.addRows([[], [], [], ["ID fournisseur", "Entreprise", "Contact", "Téléphone", "Email", "Ville", "Délai livraison (j)", "Conditions paiement"], ["FOU-01", "Maison importée", "Maya Fournier", "+237612345678", "maya@example.test", "Douala", 4, "30 jours"]]);
    const purchases = workbook.addWorksheet("Achats"); purchases.addRows([[], [], [], ["ID achat", "Date", "ID fournisseur", "Statut", "Mode paiement", "Sous-total HT (€)", "TVA (€)", "Total TTC (€)", "Date réception"], ["ACH-01", new Date("2026-01-02T00:00:00.000Z"), "FOU-01", "Reçue", "Virement", { formula: "SUMIFS(Lignes_Achats!$H:$H,Lignes_Achats!$B:$B,A5)" }, 0, { formula: "F5+G5" }, new Date("2026-01-03T00:00:00.000Z")]]);
    const lines = workbook.addWorksheet("Lignes_Achats"); lines.addRows([[], [], [], ["ID ligne", "ID achat", "SKU", "Produit", "Quantité", "Prix achat HT (€)", "Total ligne HT (€)"], ["LA-01", "ACH-01", "SKU-01", { formula: "VLOOKUP(C5,Produits!A:B,2,FALSE)" }, 3, { formula: "VLOOKUP(C5,Produits!A:C,3,FALSE)" }, { formula: "E5*F5" }]]);
    const ignored = workbook.addWorksheet("Rapport_Mensuel"); ignored.addRows([["Mois", "CA TTC"], ["2026-01", 1000]]);
    const bytes = await workbook.xlsx.writeBuffer();
    const parsed = await parseMigrationFile(new File([bytes], "achats.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    expect(parsed.data.suppliers).toEqual([expect.objectContaining({ name: "Maison importée", reference: "FOU-01", deliveryLeadDays: 4 })]);
    expect(parsed.data.purchases).toEqual([expect.objectContaining({ reference: "ACH-01", supplierName: "Maison importée", status: "received", subtotal: 24, total: 24 })]);
    expect(parsed.data.purchaseItems).toEqual([expect.objectContaining({ purchaseReference: "ACH-01", productName: "Produit fournisseur", quantity: 3, unitPrice: 8 })]);
    expect(parsed.sheetSummary).toEqual(expect.arrayContaining([expect.objectContaining({ name: "Fournisseurs", status: "imported" }), expect.objectContaining({ name: "Rapport_Mensuel", status: "ignored" })]));
  });
});
