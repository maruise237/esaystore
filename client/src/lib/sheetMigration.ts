import ExcelJS from "exceljs";
import readXlsxFile from "read-excel-file/browser";
import {
  MAX_IMPORT_FILE_BYTES,
  MAX_IMPORT_PAYLOAD_BYTES,
  serializedByteLength,
} from "../../../shared/importLimits";

export type MigrationData = {
  products: Array<{ sourceId: string; name: string; barcode?: string; reference?: string; category?: string; unit?: string; salePrice: number; purchasePrice: number; stockQuantity: number; alertThreshold: number }>;
  customers: Array<{ sourceId: string; name: string; phone?: string; note?: string }>;
  sales: Array<{ sourceId: string; reference?: string; soldAt: Date; customerName?: string; total: number; cash: number; mobileMoney: number; discountAmount: number; dueDate?: Date }>;
  saleItems: Array<{ sourceId: string; saleReference: string; productName: string; barcode?: string; quantity: number; unitPrice: number; purchasePrice: number }>;
  expenses: Array<{ sourceId: string; category: string; amount: number; note?: string; spentAt: Date }>;
};

type SheetRows = Array<Record<string, unknown>>;

const clean = (value: unknown) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, " ").trim();
const number = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const source = String(value ?? "").replace(/\s/g, "").replace(/[^0-9,.-]/g, "");
  const lastComma = source.lastIndexOf(",");
  const lastDot = source.lastIndexOf(".");
  const normalized = lastComma > -1 && lastDot > -1
    ? (lastComma > lastDot ? source.replace(/\./g, "").replace(",", ".") : source.replace(/,/g, ""))
    : source.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};
const text = (value: unknown) => String(value ?? "").trim();
const hasValue = (value: unknown) => value instanceof Date || typeof value === "number" || typeof value === "string" && value.trim().length > 0;

export function parseSheetDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value;
  if (typeof value === "number") return new Date(Date.UTC(1899, 11, 30) + Math.round(value * 86_400_000));
  const source = String(value ?? "").trim();
  const french = source.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (french) return new Date(Date.UTC(Number(french[3]), Number(french[2]) - 1, Number(french[1]), Number(french[4] || 0), Number(french[5] || 0), Number(french[6] || 0)));
  const parsed = new Date(source);
  return Number.isNaN(parsed.valueOf()) ? undefined : parsed;
}

function field(row: Record<string, unknown>, aliases: string[]) {
  const normalizedAliases = aliases.map(clean);
  const entry = Object.entries(row).find(([key]) => normalizedAliases.includes(clean(key)));
  return entry?.[1];
}

export function detectSheetKind(name: string, rows: SheetRows): "products" | "customers" | "sales" | "saleItems" | "expenses" | "stockMovements" | "unknown" {
  const title = clean(name);
  if (/stock.*mouvement|mouvement.*stock/.test(title)) return "stockMovements";
  if (/ligne.*vente|sale.*line|articles.*vente/.test(title)) return "saleItems";
  if (/produit|product|stock|inventaire/.test(title)) return "products";
  if (/client|customer/.test(title)) return "customers";
  if (/vente|sale|transaction/.test(title)) return "sales";
  if (/depense|expense|charge/.test(title)) return "expenses";
  const keys = Object.keys(rows[0] ?? {}).map(clean);
  if (keys.some((key) => ["code barres", "barcode", "prix vente", "stock"].includes(key))) return "products";
  if (keys.some((key) => ["quantite signee", "stock apres", "variation"].includes(key))) return "stockMovements";
  if (keys.some((key) => ["telephone", "phone"].includes(key)) && keys.some((key) => ["client", "nom", "name"].includes(key))) return "customers";
  if (keys.some((key) => ["date vente", "sale date", "montant total", "total"].includes(key))) return "sales";
  if (keys.some((key) => ["date depense", "expense date", "categorie"].includes(key))) return "expenses";
  return "unknown";
}

function rowsFromMatrix(matrix: Array<Array<unknown>>): SheetRows {
  const headerTerms = new Set(["sku", "produit", "nom", "id client", "id vente", "id ligne", "date", "categorie", "quantite", "quantite signee", "montant", "prix vente", "prix vente ttc", "prix achat ht", "stock initial", "stock actuel", "mode paiement", "statut"]);
  let headerIndex = -1;
  for (let index = 0; index < Math.min(matrix.length, 32); index += 1) {
    const labels = matrix[index].map((value) => clean(value)).filter(Boolean);
    const score = labels.filter((label) => headerTerms.has(label)).length;
    if (labels.length >= 2 && score >= 1) { headerIndex = index; break; }
  }
  if (headerIndex < 0) return [];
  const headers = matrix[headerIndex] ?? [];
  const values = matrix.slice(headerIndex + 1);
  const labels = headers.map((value) => text(value));
  return values
    .filter((row) => row.some((value) => text(value)))
    .map((row) => Object.fromEntries(labels.map((label, index) => [label, row[index] ?? ""])));
}

function parseCsvRows(source: string): Array<Array<string>> {
  const firstLine = source.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]!;
    if (character === '"') {
      if (quoted && source[index + 1] === '"') { cell += '"'; index += 1; }
      else quoted = !quoted;
    } else if (!quoted && character === delimiter) { row.push(cell); cell = ""; }
    else if (!quoted && (character === "\n" || character === "\r")) {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      row.push(cell); if (row.some((value) => value.trim())) rows.push(row); row = []; cell = "";
    } else cell += character;
  }
  if (quoted) throw new Error("CSV quoted field is incomplete");
  row.push(cell); if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function stockDeltas(rows: SheetRows) {
  const deltas = new Map<string, number>();
  for (const row of rows) {
    const reference = text(field(row, ["sku", "reference", "code produit", "produit"]));
    if (!reference) continue;
    const delta = number(field(row, ["quantite signee", "variation", "quantite"]));
    deltas.set(reference, (deltas.get(reference) ?? 0) + delta);
  }
  return deltas;
}

function readProducts(rows: SheetRows, sheet: string, movementDeltas: Map<string, number>): MigrationData["products"] {
  return rows.map((row, index) => {
    const reference = text(field(row, ["reference", "ref", "sku"])) || undefined;
    const initialStock = number(field(row, ["stock initial", "stock depart"]));
    const currentStock = field(row, ["stock actuel", "stock final", "stock"]);
    return {
      sourceId: `${sheet}-${index + 1}`,
      name: text(field(row, ["nom", "name", "produit", "product"])),
      barcode: text(field(row, ["code barres", "barcode", "ean"])) || undefined,
      reference,
      category: text(field(row, ["categorie", "category", "code categorie"])) || undefined,
      unit: text(field(row, ["unite", "unit"])) || undefined,
      salePrice: number(field(row, ["prix vente ttc", "prix vente", "prix de vente", "sale price", "price"])),
      purchasePrice: number(field(row, ["prix achat ht", "prix achat", "prix d achat", "purchase price", "cost"])),
      stockQuantity: Math.max(0, hasValue(currentStock) ? number(currentStock) : initialStock + (reference ? movementDeltas.get(reference) ?? 0 : 0)),
      alertThreshold: number(field(row, ["stock minimum", "seuil", "alert threshold", "seuil alerte"])) || 5,
    };
  }).filter((row) => Boolean(row.name));
}
function readCustomers(rows: SheetRows, sheet: string): MigrationData["customers"] {
  return rows.map((row, index) => ({ sourceId: `${sheet}-${index + 1}`, name: text(field(row, ["nom complet", "nom", "name", "client", "customer"])), phone: text(field(row, ["telephone", "phone", "tel"])) || undefined, note: text(field(row, ["note", "commentaire", "comment", "segment"])) || undefined })).filter((row) => Boolean(row.name));
}
type ParsedSale = MigrationData["sales"][number] & { paymentKind?: "cash" | "mobileMoney" };

function readSales(rows: SheetRows, sheet: string, customersByReference: Map<string, string>): ParsedSale[] {
  return rows.flatMap((row, index) => {
    const soldAt = parseSheetDate(field(row, ["date", "date vente", "sale date", "sold at"]));
    const status = clean(field(row, ["statut", "status"]));
    if (!soldAt || /annul|cancel/.test(status)) return [];
    const total = number(field(row, ["total ttc", "total", "montant", "montant total", "amount"]));
    const customerReference = text(field(row, ["id client", "client", "customer", "nom client"]));
    const paymentMethod = clean(field(row, ["mode paiement", "payment method", "paiement"]));
    const paid = /pay|regl|encaisse|recu/.test(status);
    const paymentKind = /mobile money|momo/.test(paymentMethod) ? "mobileMoney" : "cash";
    const mobileMoney = number(field(row, ["mobile money", "mobilemoney", "momo"])) || (paid && paymentKind === "mobileMoney" ? total : 0);
    const cash = number(field(row, ["especes", "cash"])) || (paid && paymentKind === "cash" ? total : 0);
    return [{ sourceId: `${sheet}-${index + 1}`, reference: text(field(row, ["id vente", "reference", "numero", "sale number", "numero vente"])) || undefined, soldAt, customerName: customersByReference.get(customerReference) || customerReference || undefined, total, cash, mobileMoney, discountAmount: number(field(row, ["remise", "discount"])), dueDate: parseSheetDate(field(row, ["echeance", "due date"])), paymentKind: paid ? paymentKind : undefined }];
  });
}
function readSaleItems(rows: SheetRows, sheet: string, productsByReference: Map<string, MigrationData["products"][number]>): MigrationData["saleItems"] {
  return rows.map((row, index) => {
    const reference = text(field(row, ["sku", "reference produit", "code produit"]));
    const product = productsByReference.get(reference);
    return { sourceId: `${sheet}-${index + 1}`, saleReference: text(field(row, ["id vente", "reference vente", "sale reference", "reference", "numero vente"])), productName: text(field(row, ["produit", "product", "nom produit"])) || product?.name || "", barcode: text(field(row, ["code barres", "barcode", "ean"])) || undefined, quantity: number(field(row, ["quantite", "quantity", "qte"])), unitPrice: number(field(row, ["prix unitaire ttc", "prix unitaire", "unit price", "prix", "price"])) || product?.salePrice || 0, purchasePrice: number(field(row, ["prix achat ht", "prix achat", "purchase price", "cost"])) || product?.purchasePrice || 0 };
  }).filter((row) => Boolean(row.saleReference) && Boolean(row.productName) && row.quantity > 0 && row.unitPrice > 0);
}
function readExpenses(rows: SheetRows, sheet: string): MigrationData["expenses"] {
  return rows.flatMap((row, index) => { const spentAt = parseSheetDate(field(row, ["date", "date depense", "expense date", "spent at"])); const amount = number(field(row, ["total ttc", "montant ht", "montant", "amount", "total"])); if (!spentAt || amount <= 0) return []; return [{ sourceId: `${sheet}-${index + 1}`, category: text(field(row, ["categorie", "category", "type"])) || "Autre", amount, note: text(field(row, ["description", "note", "commentaire", "comment"])) || undefined, spentAt }]; });
}

export async function parseMigrationFile(file: File) {
  if (file.size > MAX_IMPORT_FILE_BYTES) throw new Error("Import file exceeds the supported size");
  const sheets = /\.csv$/i.test(file.name)
    ? [{ sheet: "CSV", data: parseCsvRows(await file.text()) }]
    : await readXlsxFile(file);
  const parsedSheets = sheets.map(({ sheet: name, data: matrix }) => { const rows = rowsFromMatrix(matrix as Array<Array<unknown>>); return { name, rows, kind: detectSheetKind(name, rows) }; });
  const data: MigrationData = { products: [], customers: [], sales: [], saleItems: [], expenses: [] };
  const ignoredSheets = parsedSheets.filter((sheet) => sheet.kind === "unknown").map((sheet) => sheet.name);
  const movementDeltas = new Map<string, number>();
  for (const sheet of parsedSheets.filter((item) => item.kind === "stockMovements")) for (const [reference, delta] of Array.from(stockDeltas(sheet.rows).entries())) movementDeltas.set(reference, (movementDeltas.get(reference) ?? 0) + delta);
  for (const sheet of parsedSheets.filter((item) => item.kind === "customers")) data.customers.push(...readCustomers(sheet.rows, sheet.name));
  const customersByReference = new Map<string, string>();
  for (const sheet of parsedSheets.filter((item) => item.kind === "customers")) for (const row of sheet.rows) { const reference = text(field(row, ["id client", "reference", "code client"])); const name = text(field(row, ["nom complet", "nom", "name", "client"])); if (reference && name) customersByReference.set(reference, name); }
  for (const sheet of parsedSheets.filter((item) => item.kind === "products")) data.products.push(...readProducts(sheet.rows, sheet.name, movementDeltas));
  const productsByReference = new Map(data.products.filter((item) => item.reference).map((item) => [item.reference!, item]));
  const rawSaleItems = parsedSheets.filter((item) => item.kind === "saleItems").flatMap((sheet) => readSaleItems(sheet.rows, sheet.name, productsByReference));
  const rawSales = parsedSheets.filter((item) => item.kind === "sales").flatMap((sheet) => readSales(sheet.rows, sheet.name, customersByReference));
  const totalsBySaleReference = new Map<string, number>();
  for (const item of rawSaleItems) totalsBySaleReference.set(item.saleReference, (totalsBySaleReference.get(item.saleReference) ?? 0) + item.quantity * item.unitPrice);
  data.sales = rawSales.map(({ paymentKind, ...sale }) => {
    const total = sale.total > 0 ? sale.total : totalsBySaleReference.get(sale.reference || "") ?? 0;
    const paid = sale.cash + sale.mobileMoney;
    if (sale.total === 0 && paymentKind) return { ...sale, total, cash: paymentKind === "cash" ? total : 0, mobileMoney: paymentKind === "mobileMoney" ? total : 0 };
    return { ...sale, total, cash: paid > 0 && sale.total === 0 ? Math.min(total, sale.cash) : sale.cash, mobileMoney: paid > 0 && sale.total === 0 ? Math.min(Math.max(0, total - sale.cash), sale.mobileMoney) : sale.mobileMoney };
  }).filter((sale) => sale.total > 0);
  const saleReferences = new Set(data.sales.map((sale) => sale.reference).filter((value): value is string => Boolean(value)));
  data.saleItems = rawSaleItems.filter((item) => saleReferences.has(item.saleReference));
  for (const sheet of parsedSheets.filter((item) => item.kind === "expenses")) data.expenses.push(...readExpenses(sheet.rows, sheet.name));
  if (serializedByteLength(data) > MAX_IMPORT_PAYLOAD_BYTES) throw new Error("Parsed import exceeds the supported payload size");
  return { data, ignoredSheets };
}

const iso = (value: unknown) => value instanceof Date ? value.toISOString() : value ? new Date(value as string).toISOString() : "";
const money = (value: unknown) => typeof value === "number" ? value : Number(value || 0);

export function buildEasystorWorkbook(data: Record<string, unknown>) {
  const workbook = new ExcelJS.Workbook();
  const append = (name: string, rows: Record<string, unknown>[]) => {
    const worksheet = workbook.addWorksheet(name);
    const headers = Object.keys(rows[0] ?? {});
    if (!headers.length) return;
    worksheet.addRow(headers);
    worksheet.getRow(1).font = { bold: true };
    rows.forEach((row) => worksheet.addRow(headers.map((header) => row[header] ?? "")));
  };
  append("Guide", [{ "EASYSTOR — export de données": "Ce classeur est compatible avec l’import Google Sheets.", "Import dans EASYSTOR": "Conservez les noms d’onglets et les en-têtes Produits, Clients, Ventes et Dépenses pour une détection automatique.", "Date d’export": new Date().toISOString(), "Note": "Il s’agit d’un export de fichier, sans synchronisation directe avec Google." }]);
  append("Produits", ((data.products as Array<Record<string, unknown>>) ?? []).map((item) => ({ Nom: item.name, "Code-barres": item.barcode || "", Référence: item.reference || "", Catégorie: item.category, Unité: item.unit, "Prix de vente": money(item.salePrice), "Prix d’achat": money(item.purchasePrice), Stock: money(item.stockQuantity), "Seuil alerte": money(item.alertThreshold), Actif: item.isActive ? "Oui" : "Non", Créé: iso(item.createdAt) })));
  append("Variantes", ((data.variants as Array<Record<string, unknown>>) ?? []).map((item) => ({ Produit: item.productId, Nom: item.name, Attributs: JSON.stringify(item.attributes), "Code-barres": item.barcode || "", Référence: item.reference || "", "Prix de vente": money(item.salePrice), "Prix d’achat": money(item.purchasePrice), Stock: money(item.stockQuantity), "Seuil alerte": money(item.alertThreshold), Actif: item.isActive ? "Oui" : "Non" })));
  append("Clients", ((data.customers as Array<Record<string, unknown>>) ?? []).map((item) => ({ Nom: item.name, Téléphone: item.phone || "", Note: item.note || "", Créé: iso(item.createdAt) })));
  append("Ventes", ((data.sales as Array<{ sale: Record<string, unknown>; customerName?: string }>) ?? []).map((item) => ({ Référence: item.sale.saleNumber, Date: iso(item.sale.soldAt), Client: item.customerName || "", "Sous-total": money(item.sale.subtotal), Remise: money(item.sale.discountAmount), Total: money(item.sale.total), Espèces: money((item.sale.paymentBreakdown as Record<string, unknown> | undefined)?.cash), "Mobile money": money((item.sale.paymentBreakdown as Record<string, unknown> | undefined)?.mobileMoney), Crédit: money(item.sale.creditAmount), Paiement: item.sale.paymentMethod, Statut: item.sale.status })));
  append("Lignes de vente", ((data.saleItems as Array<{ line: Record<string, unknown>; saleNumber?: string; productBarcode?: string }>) ?? []).map((item) => ({ "Référence vente": item.saleNumber, Produit: item.line.productName, "Code-barres": item.productBarcode || "", Quantité: money(item.line.quantity), "Prix unitaire": money(item.line.unitPrice), "Prix d’achat": money(item.line.purchasePrice), Total: money(item.line.lineTotal) })));
  append("Dépenses", ((data.expenses as Array<Record<string, unknown>>) ?? []).map((item) => ({ Date: iso(item.spentAt), Catégorie: item.category, Montant: money(item.amount), Note: item.note || "" })));
  append("Créances", ((data.receivables as Array<{ receivable: Record<string, unknown>; customerName?: string; saleNumber?: string }>) ?? []).map((item) => ({ Client: item.customerName, "Référence vente": item.saleNumber, "Montant initial": money(item.receivable.originalAmount), Solde: money(item.receivable.balance), Échéance: iso(item.receivable.dueDate), Statut: item.receivable.isSettled ? "Réglée" : "Ouverte" })));
  append("Remboursements", ((data.repayments as Array<{ repayment: Record<string, unknown>; customerName?: string; saleNumber?: string }>) ?? []).map((item) => ({ Date: iso(item.repayment.paidAt), Client: item.customerName, "Référence vente": item.saleNumber, Montant: money(item.repayment.amount), Moyen: item.repayment.paymentMethod })));
  append("Clôtures", ((data.closures as Array<Record<string, unknown>>) ?? []).map((item) => ({ Date: item.businessDate, "Cash attendu": money(item.expectedCash), "Cash compté": money(item.declaredCash), Écart: money(item.difference), Clôturé: iso(item.closedAt), Détail: JSON.stringify(item.snapshot) })));
  append("Mouvements stock", ((data.stockMovements as Array<{ movement: Record<string, unknown>; productName?: string }>) ?? []).map((item) => ({ Date: iso(item.movement.createdAt), Produit: item.productName, Type: item.movement.type, Variation: money(item.movement.quantityDelta), "Stock après": money(item.movement.stockAfter), Motif: item.movement.reason || "" })));
  append("Devises", ((data.currencies as Array<Record<string, unknown>>) ?? []).map((item) => ({ Devise: item.currency, Libellé: item.label || "", Active: item.isActive ? "Oui" : "Non" })));
  append("Taux de change", ((data.exchangeRates as Array<Record<string, unknown>>) ?? []).map((item) => ({ Devise: item.currency, "Taux vers devise de référence": money(item.rateToBase), "Date d’effet": iso(item.effectiveAt), Note: item.note || "" })));
  return workbook;
}

export async function downloadEasystorWorkbook(data: Record<string, unknown>, fileName: string) {
  const bytes = await buildEasystorWorkbook(data).xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
