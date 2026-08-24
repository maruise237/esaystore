import * as XLSX from "xlsx";

export type MigrationData = {
  products: Array<{ sourceId: string; name: string; barcode?: string; reference?: string; category?: string; unit?: string; salePrice: number; purchasePrice: number; stockQuantity: number; alertThreshold: number }>;
  customers: Array<{ sourceId: string; name: string; phone?: string; note?: string }>;
  sales: Array<{ sourceId: string; reference?: string; soldAt: Date; customerName?: string; total: number; cash: number; mobileMoney: number; discountAmount: number; dueDate?: Date }>;
  saleItems: Array<{ sourceId: string; saleReference: string; productName: string; barcode?: string; quantity: number; unitPrice: number; purchasePrice: number }>;
  expenses: Array<{ sourceId: string; category: string; amount: number; note?: string; spentAt: Date }>;
};

const clean = (value: unknown) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, " ").trim();
const number = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value ?? "").replace(/\s/g, "").replace(",", ".").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};
const text = (value: unknown) => String(value ?? "").trim();

export function parseSheetDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value;
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d, parsed.H, parsed.M, parsed.S));
  }
  const source = String(value ?? "").trim();
  const french = source.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (french) return new Date(Date.UTC(Number(french[3]), Number(french[2]) - 1, Number(french[1]), Number(french[4] || 0), Number(french[5] || 0), Number(french[6] || 0)));
  const parsed = new Date(source);
  return Number.isNaN(parsed.valueOf()) ? undefined : parsed;
}

function field(row: Record<string, unknown>, aliases: string[]) {
  const entry = Object.entries(row).find(([key]) => aliases.includes(clean(key)));
  return entry?.[1];
}

export function detectSheetKind(name: string, rows: Array<Record<string, unknown>>): "products" | "customers" | "sales" | "saleItems" | "expenses" | "unknown" {
  const title = clean(name);
  if (/ligne.*vente|sale.*line|articles.*vente/.test(title)) return "saleItems";
  if (/produit|product|stock|inventaire/.test(title)) return "products";
  if (/client|customer/.test(title)) return "customers";
  if (/vente|sale|transaction/.test(title)) return "sales";
  if (/depense|expense|charge/.test(title)) return "expenses";
  const keys = Object.keys(rows[0] ?? {}).map(clean);
  if (keys.some((key) => ["code barres", "barcode", "prix vente", "stock"].includes(key))) return "products";
  if (keys.some((key) => ["telephone", "phone"].includes(key)) && keys.some((key) => ["client", "nom", "name"].includes(key))) return "customers";
  if (keys.some((key) => ["date vente", "sale date", "montant total", "total"].includes(key))) return "sales";
  if (keys.some((key) => ["date depense", "expense date", "categorie"].includes(key))) return "expenses";
  return "unknown";
}

function readProducts(rows: Array<Record<string, unknown>>, sheet: string): MigrationData["products"] {
  return rows.map((row, index) => ({ sourceId: `${sheet}-${index + 2}`, name: text(field(row, ["nom", "name", "produit", "product"])), barcode: text(field(row, ["code barres", "barcode", "ean"])) || undefined, reference: text(field(row, ["reference", "ref", "sku"])) || undefined, category: text(field(row, ["categorie", "category"])) || undefined, unit: text(field(row, ["unite", "unit"])) || undefined, salePrice: number(field(row, ["prix vente", "prix de vente", "sale price", "price"])), purchasePrice: number(field(row, ["prix achat", "prix d achat", "purchase price", "cost"])), stockQuantity: number(field(row, ["stock", "quantite", "quantity", "stock initial"])), alertThreshold: number(field(row, ["seuil", "alert threshold", "seuil alerte"])) || 5 })).filter((row) => Boolean(row.name));
}
function readCustomers(rows: Array<Record<string, unknown>>, sheet: string): MigrationData["customers"] {
  return rows.map((row, index) => ({ sourceId: `${sheet}-${index + 2}`, name: text(field(row, ["nom", "name", "client", "customer"])), phone: text(field(row, ["telephone", "phone", "tel"])) || undefined, note: text(field(row, ["note", "commentaire", "comment"])) || undefined })).filter((row) => Boolean(row.name));
}
function readSales(rows: Array<Record<string, unknown>>, sheet: string): MigrationData["sales"] {
  return rows.flatMap((row, index) => { const soldAt = parseSheetDate(field(row, ["date", "date vente", "sale date", "sold at"])); const total = number(field(row, ["total", "montant", "montant total", "amount"])); if (!soldAt || total <= 0) return []; return [{ sourceId: `${sheet}-${index + 2}`, reference: text(field(row, ["reference", "numero", "sale number", "numero vente"])) || undefined, soldAt, customerName: text(field(row, ["client", "customer", "nom client"])) || undefined, total, cash: number(field(row, ["especes", "cash"])), mobileMoney: number(field(row, ["mobile money", "mobilemoney", "momo"])), discountAmount: number(field(row, ["remise", "discount"])), dueDate: parseSheetDate(field(row, ["echeance", "due date"])) }]; });
}
function readSaleItems(rows: Array<Record<string, unknown>>, sheet: string): MigrationData["saleItems"] {
  return rows.map((row, index) => ({ sourceId: `${sheet}-${index + 2}`, saleReference: text(field(row, ["reference vente", "sale reference", "reference", "numero vente"])), productName: text(field(row, ["produit", "product", "nom produit"])), barcode: text(field(row, ["code barres", "barcode", "ean"])) || undefined, quantity: number(field(row, ["quantite", "quantity", "qte"])), unitPrice: number(field(row, ["prix unitaire", "unit price", "prix", "price"])), purchasePrice: number(field(row, ["prix achat", "purchase price", "cost"])) })).filter((row) => Boolean(row.saleReference) && Boolean(row.productName) && row.quantity > 0 && row.unitPrice >= 0);
}
function readExpenses(rows: Array<Record<string, unknown>>, sheet: string): MigrationData["expenses"] {
  return rows.flatMap((row, index) => { const spentAt = parseSheetDate(field(row, ["date", "date depense", "expense date", "spent at"])); const amount = number(field(row, ["montant", "amount", "total"])); if (!spentAt || amount <= 0) return []; return [{ sourceId: `${sheet}-${index + 2}`, category: text(field(row, ["categorie", "category", "type"])) || "Autre", amount, note: text(field(row, ["note", "commentaire", "comment"])) || undefined, spentAt }]; });
}

export async function parseMigrationFile(file: File) {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const data: MigrationData = { products: [], customers: [], sales: [], saleItems: [], expenses: [] };
  const ignoredSheets: string[] = [];
  for (const name of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[name]!, { defval: "", raw: true });
    const kind = detectSheetKind(name, rows);
    if (kind === "products") data.products.push(...readProducts(rows, name));
    else if (kind === "customers") data.customers.push(...readCustomers(rows, name));
    else if (kind === "sales") data.sales.push(...readSales(rows, name));
    else if (kind === "saleItems") data.saleItems.push(...readSaleItems(rows, name));
    else if (kind === "expenses") data.expenses.push(...readExpenses(rows, name));
    else ignoredSheets.push(name);
  }
  return { data, ignoredSheets };
}

const iso = (value: unknown) => value instanceof Date ? value.toISOString() : value ? new Date(value as string).toISOString() : "";
const money = (value: unknown) => typeof value === "number" ? value : Number(value || 0);

export function buildEasystorWorkbook(data: Record<string, any>) {
  const workbook = XLSX.utils.book_new();
  const append = (name: string, rows: Record<string, unknown>[]) => XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), name);
  append("Guide", [{ "EASYSTOR — export de données": "Ce classeur est compatible avec l’import Google Sheets.", "Import dans EASYSTOR": "Conservez les noms d’onglets et les en-têtes Produits, Clients, Ventes et Dépenses pour une détection automatique.", "Date d’export": new Date().toISOString(), "Note": "Il s’agit d’un export de fichier, sans synchronisation directe avec Google." }]);
  append("Produits", (data.products ?? []).map((item: any) => ({ Nom: item.name, "Code-barres": item.barcode || "", Référence: item.reference || "", Catégorie: item.category, Unité: item.unit, "Prix de vente": money(item.salePrice), "Prix d’achat": money(item.purchasePrice), Stock: money(item.stockQuantity), "Seuil alerte": money(item.alertThreshold), Actif: item.isActive ? "Oui" : "Non", Créé: iso(item.createdAt) })));
  append("Variantes", (data.variants ?? []).map((item: any) => ({ Produit: item.productId, Nom: item.name, Attributs: JSON.stringify(item.attributes), "Code-barres": item.barcode || "", Référence: item.reference || "", "Prix de vente": money(item.salePrice), "Prix d’achat": money(item.purchasePrice), Stock: money(item.stockQuantity), "Seuil alerte": money(item.alertThreshold), Actif: item.isActive ? "Oui" : "Non" })));
  append("Clients", (data.customers ?? []).map((item: any) => ({ Nom: item.name, Téléphone: item.phone || "", Note: item.note || "", Créé: iso(item.createdAt) })));
  append("Ventes", (data.sales ?? []).map((item: any) => ({ Référence: item.sale.saleNumber, Date: iso(item.sale.soldAt), Client: item.customerName || "", "Sous-total": money(item.sale.subtotal), Remise: money(item.sale.discountAmount), Total: money(item.sale.total), Espèces: money(item.sale.paymentBreakdown?.cash), "Mobile money": money(item.sale.paymentBreakdown?.mobileMoney), Crédit: money(item.sale.creditAmount), Paiement: item.sale.paymentMethod, Statut: item.sale.status })));
  append("Lignes de vente", (data.saleItems ?? []).map((item: any) => ({ "Référence vente": item.saleNumber, Produit: item.line.productName, "Code-barres": item.productBarcode || "", Quantité: money(item.line.quantity), "Prix unitaire": money(item.line.unitPrice), "Prix d’achat": money(item.line.purchasePrice), Total: money(item.line.lineTotal) })));
  append("Dépenses", (data.expenses ?? []).map((item: any) => ({ Date: iso(item.spentAt), Catégorie: item.category, Montant: money(item.amount), Note: item.note || "" })));
  append("Créances", (data.receivables ?? []).map((item: any) => ({ Client: item.customerName, "Référence vente": item.saleNumber, "Montant initial": money(item.receivable.originalAmount), Solde: money(item.receivable.balance), Échéance: iso(item.receivable.dueDate), Statut: item.receivable.isSettled ? "Réglée" : "Ouverte" })));
  append("Remboursements", (data.repayments ?? []).map((item: any) => ({ Date: iso(item.repayment.paidAt), Client: item.customerName, "Référence vente": item.saleNumber, Montant: money(item.repayment.amount), Moyen: item.repayment.paymentMethod })));
  append("Clôtures", (data.closures ?? []).map((item: any) => ({ Date: item.businessDate, "Cash attendu": money(item.expectedCash), "Cash compté": money(item.declaredCash), Écart: money(item.difference), Clôturé: iso(item.closedAt), Détail: JSON.stringify(item.snapshot) })));
  append("Mouvements stock", (data.stockMovements ?? []).map((item: any) => ({ Date: iso(item.movement.createdAt), Produit: item.productName, Type: item.movement.type, Variation: money(item.movement.quantityDelta), "Stock après": money(item.movement.stockAfter), Motif: item.movement.reason || "" })));
  append("Devises", (data.currencies ?? []).map((item: any) => ({ Devise: item.currency, Libellé: item.label || "", Active: item.isActive ? "Oui" : "Non" })));
  append("Taux de change", (data.exchangeRates ?? []).map((item: any) => ({ Devise: item.currency, "Taux vers devise de référence": money(item.rateToBase), "Date d’effet": iso(item.effectiveAt), Note: item.note || "" })));
  return workbook;
}

export function downloadEasystorWorkbook(data: Record<string, any>, fileName: string) {
  XLSX.writeFile(buildEasystorWorkbook(data), fileName, { compression: true });
}
