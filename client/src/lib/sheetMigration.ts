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
  suppliers: Array<{ sourceId: string; name: string; reference?: string; contactName?: string; phone?: string; email?: string; city?: string; deliveryLeadDays?: number; paymentTerms?: string }>;
  sales: Array<{ sourceId: string; reference?: string; soldAt: Date; customerName?: string; total: number; cash: number; mobileMoney: number; discountAmount: number; dueDate?: Date }>;
  saleItems: Array<{ sourceId: string; saleReference: string; productName: string; barcode?: string; quantity: number; unitPrice: number; purchasePrice: number }>;
  purchases: Array<{ sourceId: string; reference: string; purchasedAt: Date; supplierName?: string; status: "received" | "pending"; paymentMethod?: string; subtotal: number; taxAmount: number; total: number; receivedAt?: Date }>;
  purchaseItems: Array<{ sourceId: string; purchaseReference: string; productName: string; barcode?: string; quantity: number; unitPrice: number }>;
  expenses: Array<{ sourceId: string; category: string; amount: number; note?: string; spentAt: Date }>;
};

type SheetKind = "products" | "customers" | "suppliers" | "sales" | "saleItems" | "purchases" | "purchaseItems" | "expenses" | "stockMovements" | "unknown";
export type MigrationSheetSummary = { name: string; label: string; rows: number; status: "imported" | "support" | "ignored"; reason: string };

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

export function detectSheetKind(name: string, rows: SheetRows): SheetKind {
  const title = clean(name);
  if (/stock.*mouvement|mouvement.*stock/.test(title)) return "stockMovements";
  if (/ligne.*achat|achat.*ligne|purchase.*line/.test(title)) return "purchaseItems";
  if (/ligne.*vente|sale.*line|articles.*vente/.test(title)) return "saleItems";
  if (/fournisseur|supplier/.test(title)) return "suppliers";
  if (/achat|purchase|approvisionnement/.test(title)) return "purchases";
  if (/produit|product|stock|inventaire/.test(title)) return "products";
  if (/client|customer/.test(title)) return "customers";
  if (/vente|sale|transaction/.test(title)) return "sales";
  if (/depense|expense|charge/.test(title)) return "expenses";
  const keys = Object.keys(rows[0] ?? {}).map(clean);
  if (keys.some((key) => ["id fournisseur", "entreprise", "contact fournisseur"].includes(key))) return "suppliers";
  if (keys.some((key) => ["id achat", "numero achat", "purchase number"].includes(key))) return "purchases";
  if (keys.some((key) => ["code barres", "barcode", "prix vente", "stock"].includes(key))) return "products";
  if (keys.some((key) => ["quantite signee", "stock apres", "variation"].includes(key))) return "stockMovements";
  if (keys.some((key) => ["telephone", "phone"].includes(key)) && keys.some((key) => ["client", "nom", "name"].includes(key))) return "customers";
  if (keys.some((key) => ["date vente", "sale date", "montant total", "total"].includes(key))) return "sales";
  if (keys.some((key) => ["date depense", "expense date", "categorie"].includes(key))) return "expenses";
  return "unknown";
}

function rowsFromMatrix(matrix: Array<Array<unknown>>): SheetRows {
  const headerTerms = new Set(["sku", "produit", "nom", "id client", "id fournisseur", "id vente", "id achat", "id ligne", "date", "categorie", "quantite", "quantite signee", "montant", "prix vente", "prix vente ttc", "prix achat ht", "stock initial", "stock actuel", "mode paiement", "statut", "entreprise"]);
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
function readSuppliers(rows: SheetRows, sheet: string): MigrationData["suppliers"] {
  return rows.map((row, index) => ({
    sourceId: `${sheet}-${index + 1}`,
    name: text(field(row, ["entreprise", "nom fournisseur", "fournisseur", "supplier", "name"])),
    reference: text(field(row, ["id fournisseur", "reference", "code fournisseur"])) || undefined,
    contactName: text(field(row, ["contact", "nom contact"])) || undefined,
    phone: text(field(row, ["telephone", "phone", "tel"])) || undefined,
    email: text(field(row, ["email", "e mail", "courriel"])) || undefined,
    city: text(field(row, ["ville", "city"])) || undefined,
    deliveryLeadDays: number(field(row, ["delai livraison j", "delai livraison", "delivery lead days"])) || undefined,
    paymentTerms: text(field(row, ["conditions paiement", "payment terms", "conditions de paiement"])) || undefined,
  })).filter((row) => Boolean(row.name));
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
function readPurchases(rows: SheetRows, sheet: string, suppliersByReference: Map<string, string>): MigrationData["purchases"] {
  return rows.flatMap((row, index) => {
    const purchasedAt = parseSheetDate(field(row, ["date", "date achat", "purchase date"]));
    const reference = text(field(row, ["id achat", "reference", "numero achat", "purchase number"]));
    if (!purchasedAt || !reference) return [];
    const statusText = clean(field(row, ["statut", "status", "reception"]));
    const received = /recu|recue|received|livre/.test(statusText);
    const supplierReference = text(field(row, ["id fournisseur", "fournisseur", "supplier"]));
    return [{
      sourceId: `${sheet}-${index + 1}`,
      reference,
      purchasedAt,
      supplierName: suppliersByReference.get(supplierReference) || supplierReference || undefined,
      status: received ? "received" : "pending",
      paymentMethod: text(field(row, ["mode paiement", "payment method", "paiement"])) || undefined,
      subtotal: number(field(row, ["sous total ht", "subtotal", "montant ht"])),
      taxAmount: number(field(row, ["tva", "tax"])),
      total: number(field(row, ["total ttc", "total", "montant"])),
      receivedAt: parseSheetDate(field(row, ["date reception", "received at", "reception"])),
    }];
  });
}
function readPurchaseItems(rows: SheetRows, sheet: string, productsByReference: Map<string, MigrationData["products"][number]>): MigrationData["purchaseItems"] {
  return rows.map((row, index) => {
    const reference = text(field(row, ["sku", "reference produit", "code produit"]));
    const product = productsByReference.get(reference);
    return {
      sourceId: `${sheet}-${index + 1}`,
      purchaseReference: text(field(row, ["id achat", "reference achat", "purchase reference", "reference"])),
      productName: text(field(row, ["produit", "product", "nom produit"])) || product?.name || "",
      barcode: text(field(row, ["code barres", "barcode", "ean"])) || undefined,
      quantity: number(field(row, ["quantite", "quantity", "qte"])),
      unitPrice: number(field(row, ["prix achat ht", "prix unitaire", "purchase price", "unit price", "prix"])) || product?.purchasePrice || 0,
    };
  }).filter((row) => Boolean(row.purchaseReference) && Boolean(row.productName) && row.quantity > 0 && row.unitPrice > 0);
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
  const data: MigrationData = { products: [], customers: [], suppliers: [], sales: [], saleItems: [], purchases: [], purchaseItems: [], expenses: [] };
  const ignoredSheets = parsedSheets.filter((sheet) => sheet.kind === "unknown").map((sheet) => sheet.name);
  const movementDeltas = new Map<string, number>();
  for (const sheet of parsedSheets.filter((item) => item.kind === "stockMovements")) for (const [reference, delta] of Array.from(stockDeltas(sheet.rows).entries())) movementDeltas.set(reference, (movementDeltas.get(reference) ?? 0) + delta);
  for (const sheet of parsedSheets.filter((item) => item.kind === "customers")) data.customers.push(...readCustomers(sheet.rows, sheet.name));
  const customersByReference = new Map<string, string>();
  for (const sheet of parsedSheets.filter((item) => item.kind === "customers")) for (const row of sheet.rows) { const reference = text(field(row, ["id client", "reference", "code client"])); const name = text(field(row, ["nom complet", "nom", "name", "client"])); if (reference && name) customersByReference.set(reference, name); }
  for (const sheet of parsedSheets.filter((item) => item.kind === "suppliers")) data.suppliers.push(...readSuppliers(sheet.rows, sheet.name));
  const suppliersByReference = new Map<string, string>();
  for (const supplier of data.suppliers) if (supplier.reference) suppliersByReference.set(supplier.reference, supplier.name);
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
  const rawPurchaseItems = parsedSheets.filter((item) => item.kind === "purchaseItems").flatMap((sheet) => readPurchaseItems(sheet.rows, sheet.name, productsByReference));
  const rawPurchases = parsedSheets.filter((item) => item.kind === "purchases").flatMap((sheet) => readPurchases(sheet.rows, sheet.name, suppliersByReference));
  const totalsByPurchaseReference = new Map<string, number>();
  for (const item of rawPurchaseItems) totalsByPurchaseReference.set(item.purchaseReference, (totalsByPurchaseReference.get(item.purchaseReference) ?? 0) + item.quantity * item.unitPrice);
  data.purchases = rawPurchases.map((purchase) => {
    const subtotal = purchase.subtotal > 0 ? purchase.subtotal : totalsByPurchaseReference.get(purchase.reference || "") ?? 0;
    const total = purchase.total > 0 ? purchase.total : subtotal + purchase.taxAmount;
    return { ...purchase, subtotal, total };
  }).filter((purchase) => Boolean(purchase.reference) && purchase.total > 0);
  const purchaseReferences = new Set(data.purchases.map((purchase) => purchase.reference).filter((value): value is string => Boolean(value)));
  data.purchaseItems = rawPurchaseItems.filter((item) => purchaseReferences.has(item.purchaseReference));
  for (const sheet of parsedSheets.filter((item) => item.kind === "expenses")) data.expenses.push(...readExpenses(sheet.rows, sheet.name));
  if (serializedByteLength(data) > MAX_IMPORT_PAYLOAD_BYTES) throw new Error("Parsed import exceeds the supported payload size");
  const labels: Record<SheetKind, string> = { products: "Produits", customers: "Clients", suppliers: "Fournisseurs", sales: "Ventes", saleItems: "Lignes de vente", purchases: "Achats", purchaseItems: "Lignes d’achat", expenses: "Dépenses", stockMovements: "Mouvements de stock", unknown: "Onglet non reconnu" };
  const sheetSummary: MigrationSheetSummary[] = parsedSheets.map((sheet) => sheet.kind === "unknown"
    ? { name: sheet.name, label: labels[sheet.kind], rows: sheet.rows.length, status: "ignored", reason: "Aucune donnée EASYSTOR importable n’a été reconnue dans cet onglet." }
    : sheet.kind === "stockMovements"
      ? { name: sheet.name, label: labels[sheet.kind], rows: sheet.rows.length, status: "support", reason: "Utilisé pour reconstituer le stock final des produits, sans créer de doublon de mouvement." }
      : { name: sheet.name, label: labels[sheet.kind], rows: sheet.rows.length, status: "imported", reason: "Données détectées et prêtes pour la prévisualisation d’import." });
  return { data, ignoredSheets, sheetSummary };
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
  append("Guide", [{ "EASYSTOR — export de données": "Ce classeur est compatible avec l’import Google Sheets.", "Import dans EASYSTOR": "Conservez les noms d’onglets et les en-têtes Produits, Clients, Fournisseurs, Ventes, Achats et Dépenses pour une détection automatique.", "Date d’export": new Date().toISOString(), "Note": "Il s’agit d’un export de fichier, sans synchronisation directe avec Google." }]);
  append("Produits", ((data.products as Array<Record<string, unknown>>) ?? []).map((item) => ({ Nom: item.name, "Code-barres": item.barcode || "", Référence: item.reference || "", Catégorie: item.category, Unité: item.unit, "Prix de vente": money(item.salePrice), "Prix d’achat": money(item.purchasePrice), Stock: money(item.stockQuantity), "Seuil alerte": money(item.alertThreshold), Actif: item.isActive ? "Oui" : "Non", Créé: iso(item.createdAt) })));
  append("Variantes", ((data.variants as Array<Record<string, unknown>>) ?? []).map((item) => ({ Produit: item.productId, Nom: item.name, Attributs: JSON.stringify(item.attributes), "Code-barres": item.barcode || "", Référence: item.reference || "", "Prix de vente": money(item.salePrice), "Prix d’achat": money(item.purchasePrice), Stock: money(item.stockQuantity), "Seuil alerte": money(item.alertThreshold), Actif: item.isActive ? "Oui" : "Non" })));
  append("Clients", ((data.customers as Array<Record<string, unknown>>) ?? []).map((item) => ({ Nom: item.name, Téléphone: item.phone || "", Note: item.note || "", Créé: iso(item.createdAt) })));
  append("Fournisseurs", ((data.suppliers as Array<Record<string, unknown>>) ?? []).map((item) => ({ Référence: item.reference || "", Entreprise: item.name, Contact: item.contactName || "", Téléphone: item.phone || "", Email: item.email || "", Ville: item.city || "", "Délai livraison (j)": money(item.deliveryLeadDays), "Conditions paiement": item.paymentTerms || "" })));
  append("Ventes", ((data.sales as Array<{ sale: Record<string, unknown>; customerName?: string }>) ?? []).map((item) => ({ Référence: item.sale.saleNumber, Date: iso(item.sale.soldAt), Client: item.customerName || "", "Sous-total": money(item.sale.subtotal), Remise: money(item.sale.discountAmount), Total: money(item.sale.total), Espèces: money((item.sale.paymentBreakdown as Record<string, unknown> | undefined)?.cash), "Mobile money": money((item.sale.paymentBreakdown as Record<string, unknown> | undefined)?.mobileMoney), Crédit: money(item.sale.creditAmount), Paiement: item.sale.paymentMethod, Statut: item.sale.status })));
  append("Lignes de vente", ((data.saleItems as Array<{ line: Record<string, unknown>; saleNumber?: string; productBarcode?: string }>) ?? []).map((item) => ({ "Référence vente": item.saleNumber, Produit: item.line.productName, "Code-barres": item.productBarcode || "", Quantité: money(item.line.quantity), "Prix unitaire": money(item.line.unitPrice), "Prix d’achat": money(item.line.purchasePrice), Total: money(item.line.lineTotal) })));
  append("Achats", ((data.purchases as Array<{ purchase: Record<string, unknown>; supplierName?: string }>) ?? []).map((item) => ({ Référence: item.purchase.purchaseNumber, Date: iso(item.purchase.purchasedAt), Fournisseur: item.supplierName || "", Statut: item.purchase.status, Paiement: item.purchase.paymentMethod || "", "Sous-total HT": money(item.purchase.subtotal), TVA: money(item.purchase.taxAmount), "Total TTC": money(item.purchase.total), "Date réception": iso(item.purchase.receivedAt) })));
  append("Lignes d’achat", ((data.purchaseItems as Array<{ line: Record<string, unknown>; purchaseNumber?: string; productBarcode?: string }>) ?? []).map((item) => ({ "Référence achat": item.purchaseNumber, Produit: item.line.productName, "Code-barres": item.productBarcode || "", Quantité: money(item.line.quantity), "Prix achat HT": money(item.line.unitPrice), Total: money(item.line.lineTotal) })));
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
