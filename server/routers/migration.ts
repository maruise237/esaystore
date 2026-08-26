import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { createHash } from "node:crypto";
import { z } from "zod";
import { cashClosures, customers, dataImports, exchangeRates, expenses, productVariants, products, purchaseItems, purchases, receivables, repayments, saleItems, sales, shopCurrencies, stockMovements, suppliers } from "../../drizzle/schema";
import { MAX_IMPORT_PAYLOAD_BYTES, serializedByteLength } from "../../shared/importLimits";
import { getDb, getSql } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { assertShopAccess } from "./helpers";

const sourceId = z.string().trim().min(1).max(70);
const productRow = z.object({ sourceId, name: z.string().trim().min(1).max(240), barcode: z.string().trim().max(120).optional(), reference: z.string().trim().max(120).optional(), category: z.string().trim().max(120).optional(), unit: z.string().trim().max(24).optional(), salePrice: z.coerce.number().min(0), purchasePrice: z.coerce.number().min(0).default(0), stockQuantity: z.coerce.number().min(0).default(0), alertThreshold: z.coerce.number().min(0).default(5) });
const customerRow = z.object({ sourceId, name: z.string().trim().min(1).max(180), phone: z.string().trim().max(48).optional(), note: z.string().trim().max(1000).optional() });
const supplierRow = z.object({ sourceId, name: z.string().trim().min(1).max(180), reference: z.string().trim().max(80).optional(), contactName: z.string().trim().max(180).optional(), phone: z.string().trim().max(48).optional(), email: z.string().trim().email().max(320).optional(), city: z.string().trim().max(120).optional(), deliveryLeadDays: z.coerce.number().int().min(0).max(365).optional(), paymentTerms: z.string().trim().max(120).optional() });
const saleRow = z.object({ sourceId, reference: z.string().trim().max(40).optional(), soldAt: z.coerce.date(), customerName: z.string().trim().max(180).optional(), total: z.coerce.number().positive(), cash: z.coerce.number().min(0).default(0), mobileMoney: z.coerce.number().min(0).default(0), discountAmount: z.coerce.number().min(0).default(0), dueDate: z.coerce.date().optional() });
const saleItemRow = z.object({ sourceId, saleReference: z.string().trim().min(1).max(40), productName: z.string().trim().min(1).max(240), barcode: z.string().trim().max(120).optional(), quantity: z.coerce.number().positive(), unitPrice: z.coerce.number().min(0), purchasePrice: z.coerce.number().min(0).default(0) });
const purchaseRow = z.object({ sourceId, reference: z.string().trim().min(1).max(80), purchasedAt: z.coerce.date(), supplierName: z.string().trim().max(180).optional(), status: z.enum(["received", "pending"]), paymentMethod: z.string().trim().max(48).optional(), subtotal: z.coerce.number().min(0).default(0), taxAmount: z.coerce.number().min(0).default(0), total: z.coerce.number().positive(), receivedAt: z.coerce.date().optional() });
const purchaseItemRow = z.object({ sourceId, purchaseReference: z.string().trim().min(1).max(80), productName: z.string().trim().min(1).max(240), barcode: z.string().trim().max(120).optional(), quantity: z.coerce.number().positive(), unitPrice: z.coerce.number().min(0) });
const expenseRow = z.object({ sourceId, category: z.string().trim().min(1).max(120), amount: z.coerce.number().positive(), note: z.string().trim().max(1000).optional(), spentAt: z.coerce.date() });
const payload = z.object({ products: z.array(productRow).max(1000).default([]), customers: z.array(customerRow).max(1000).default([]), suppliers: z.array(supplierRow).max(1000).default([]), sales: z.array(saleRow).max(1000).default([]), saleItems: z.array(saleItemRow).max(5000).default([]), purchases: z.array(purchaseRow).max(1000).default([]), purchaseItems: z.array(purchaseItemRow).max(5000).default([]), expenses: z.array(expenseRow).max(1000).default([]) }).superRefine((value, ctx) => {
  if (serializedByteLength(value) > MAX_IMPORT_PAYLOAD_BYTES) ctx.addIssue({ code: "custom", message: "Les données d’import dépassent la limite sécurisée de 2 Mo." });
});
const conflictStrategy = z.enum(["skip", "update", "copy", "block"]);

type Payload = z.infer<typeof payload>;
type Conflict = { type: "product" | "customer" | "supplier" | "sale" | "purchase" | "business_day" | "reimport"; sourceId: string; reason: string };
const normal = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/\s+/g, " ");
const dateKey = (value: Date) => value.toISOString().slice(0, 10);
const fingerprint = (data: Payload) => createHash("sha256").update(JSON.stringify(data)).digest("hex");
const operation = (kind: string, fileHash: string, value: string) => `import-${kind}-${fileHash.slice(0, 18)}-${value}`.slice(0, 96);

async function detectConflicts(shopId: string, data: Payload, fileHash: string): Promise<Conflict[]> {
  const db = getDb();
  const dates = Array.from(new Set(data.sales.map((row) => dateKey(row.soldAt)).concat(data.expenses.map((row) => dateKey(row.spentAt)))));
  const saleRefs = data.sales.map((row) => row.reference).filter((value): value is string => Boolean(value));
  const purchaseRefs = data.purchases.map((row) => row.reference);
  const [knownProducts, knownCustomers, knownSuppliers, knownSales, knownPurchases, closedDays, imported] = await Promise.all([
    db.select({ id: products.id, name: products.name, barcode: products.barcode }).from(products).where(eq(products.shopId, shopId)),
    db.select({ id: customers.id, name: customers.name, phone: customers.phone }).from(customers).where(eq(customers.shopId, shopId)),
    db.select({ id: suppliers.id, name: suppliers.name, email: suppliers.email }).from(suppliers).where(eq(suppliers.shopId, shopId)),
    saleRefs.length ? db.select({ saleNumber: sales.saleNumber }).from(sales).where(and(eq(sales.shopId, shopId), inArray(sales.saleNumber, saleRefs))) : Promise.resolve([]),
    purchaseRefs.length ? db.select({ purchaseNumber: purchases.purchaseNumber }).from(purchases).where(and(eq(purchases.shopId, shopId), inArray(purchases.purchaseNumber, purchaseRefs))) : Promise.resolve([]),
    dates.length ? db.select({ businessDate: cashClosures.businessDate }).from(cashClosures).where(and(eq(cashClosures.shopId, shopId), inArray(cashClosures.businessDate, dates))) : Promise.resolve([]),
    db.select({ id: dataImports.id }).from(dataImports).where(and(eq(dataImports.shopId, shopId), eq(dataImports.fingerprint, fileHash))).limit(1),
  ]);
  const productNames = new Set(knownProducts.map((row) => normal(row.name))); const productBarcodes = new Set(knownProducts.map((row) => row.barcode).filter(Boolean));
  const customerNames = new Set(knownCustomers.map((row) => normal(row.name))); const customerPhones = new Set(knownCustomers.map((row) => row.phone).filter(Boolean));
  const supplierNames = new Set(knownSuppliers.map((row) => normal(row.name))); const supplierEmails = new Set(knownSuppliers.map((row) => row.email).filter(Boolean));
  const salesByNumber = new Set(knownSales.map((row) => row.saleNumber)); const purchasesByNumber = new Set(knownPurchases.map((row) => row.purchaseNumber)); const closed = new Set(closedDays.map((row) => row.businessDate));
  const seenProducts = new Set<string>(); const seenCustomers = new Set<string>(); const seenSuppliers = new Set<string>(); const seenPurchases = new Set<string>(); const conflicts: Conflict[] = [];
  if (imported[0]) conflicts.push({ type: "reimport", sourceId: "fichier", reason: "Ce même contenu a déjà été importé pour cette boutique." });
  for (const item of data.products) { const key = item.barcode ? `barcode:${item.barcode}` : `name:${normal(item.name)}`; if (seenProducts.has(key) || (item.barcode && productBarcodes.has(item.barcode)) || productNames.has(normal(item.name))) conflicts.push({ type: "product", sourceId: item.sourceId, reason: item.barcode && productBarcodes.has(item.barcode) ? "Code-barres déjà présent" : "Produit déjà présent ou répété dans le fichier" }); seenProducts.add(key); }
  for (const item of data.customers) { const key = item.phone ? `phone:${item.phone}` : `name:${normal(item.name)}`; if (seenCustomers.has(key) || (item.phone && customerPhones.has(item.phone)) || customerNames.has(normal(item.name))) conflicts.push({ type: "customer", sourceId: item.sourceId, reason: item.phone && customerPhones.has(item.phone) ? "Téléphone déjà présent" : "Client déjà présent ou répété dans le fichier" }); seenCustomers.add(key); }
  for (const item of data.suppliers) { const key = item.email ? `email:${item.email}` : `name:${normal(item.name)}`; if (seenSuppliers.has(key) || (item.email && supplierEmails.has(item.email)) || supplierNames.has(normal(item.name))) conflicts.push({ type: "supplier", sourceId: item.sourceId, reason: item.email && supplierEmails.has(item.email) ? "E-mail fournisseur déjà présent" : "Fournisseur déjà présent ou répété dans le fichier" }); seenSuppliers.add(key); }
  for (const item of data.sales) { if (item.reference && salesByNumber.has(item.reference)) conflicts.push({ type: "sale", sourceId: item.sourceId, reason: "Référence de vente déjà présente" }); if (closed.has(dateKey(item.soldAt))) conflicts.push({ type: "business_day", sourceId: item.sourceId, reason: `La caisse du ${dateKey(item.soldAt)} est déjà clôturée` }); }
  const fileSupplierNames = new Set(data.suppliers.map((item) => normal(item.name)));
  for (const item of data.purchases) {
    if (seenPurchases.has(item.reference) || purchasesByNumber.has(item.reference)) conflicts.push({ type: "purchase", sourceId: item.sourceId, reason: "Référence d’achat déjà présente ou répétée dans le fichier" });
    if (item.supplierName && !supplierNames.has(normal(item.supplierName)) && !fileSupplierNames.has(normal(item.supplierName))) conflicts.push({ type: "purchase", sourceId: item.sourceId, reason: `Le fournisseur ${item.supplierName} est introuvable dans l’onglet Fournisseurs` });
    seenPurchases.add(item.reference);
  }
  const fileSaleReferences = new Set(data.sales.map((item) => item.reference).filter((value): value is string => Boolean(value)));
  for (const item of data.saleItems) if (!fileSaleReferences.has(item.saleReference)) conflicts.push({ type: "sale", sourceId: item.sourceId, reason: `La vente ${item.saleReference} est introuvable dans le fichier` });
  const filePurchaseReferences = new Set(data.purchases.map((item) => item.reference));
  for (const item of data.purchaseItems) if (!filePurchaseReferences.has(item.purchaseReference)) conflicts.push({ type: "purchase", sourceId: item.sourceId, reason: `L’achat ${item.purchaseReference} est introuvable dans le fichier` });
  const fileProductNames = new Set(data.products.map((item) => normal(item.name))); const fileProductBarcodes = new Set(data.products.map((item) => item.barcode).filter(Boolean));
  for (const item of data.saleItems) if ((!item.barcode || !fileProductBarcodes.has(item.barcode)) && !fileProductNames.has(normal(item.productName))) conflicts.push({ type: "product", sourceId: item.sourceId, reason: `Ajoutez ${item.productName} dans l’onglet Produits avec son stock final avant d’importer ses ventes détaillées` });
  for (const item of data.purchaseItems) if ((!item.barcode || !fileProductBarcodes.has(item.barcode)) && !fileProductNames.has(normal(item.productName))) conflicts.push({ type: "product", sourceId: item.sourceId, reason: `Ajoutez ${item.productName} dans l’onglet Produits pour rattacher cette ligne d’achat` });
  for (const product of data.products) if (conflicts.some((row) => row.type === "product" && row.sourceId === product.sourceId)) for (const line of data.saleItems) if ((line.barcode && product.barcode === line.barcode) || normal(line.productName) === normal(product.name)) conflicts.push({ type: "product", sourceId: line.sourceId, reason: `Le produit ${product.name} existe déjà : choisissez « Créer une copie » pour reconstituer son historique détaillé sans modifier son stock actuel` });
  for (const item of data.expenses) if (closed.has(dateKey(item.spentAt))) conflicts.push({ type: "business_day", sourceId: item.sourceId, reason: `La caisse du ${dateKey(item.spentAt)} est déjà clôturée` });
  return conflicts;
}

export const migrationRouter = router({
  exportData: protectedProcedure.input(z.object({ shopId: z.string().uuid() })).query(async ({ ctx, input }) => {
    await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
    const db = getDb();
    const [productRows, variantRows, customerRows, supplierRows, saleRows, lineRows, purchaseRows, purchaseLineRows, expenseRows, receivableRows, repaymentRows, closureRows, movementRows, currencyRows, rateRows] = await Promise.all([
      db.select().from(products).where(eq(products.shopId, input.shopId)),
      db.select().from(productVariants).where(eq(productVariants.shopId, input.shopId)),
      db.select().from(customers).where(eq(customers.shopId, input.shopId)),
      db.select().from(suppliers).where(eq(suppliers.shopId, input.shopId)),
      db.select({ sale: sales, customerName: customers.name }).from(sales).leftJoin(customers, eq(sales.customerId, customers.id)).where(eq(sales.shopId, input.shopId)),
      db.select({ line: saleItems, saleNumber: sales.saleNumber, productBarcode: products.barcode }).from(saleItems).innerJoin(sales, eq(saleItems.saleId, sales.id)).leftJoin(products, eq(saleItems.productId, products.id)).where(eq(sales.shopId, input.shopId)),
      db.select({ purchase: purchases, supplierName: suppliers.name }).from(purchases).leftJoin(suppliers, eq(purchases.supplierId, suppliers.id)).where(eq(purchases.shopId, input.shopId)),
      db.select({ line: purchaseItems, purchaseNumber: purchases.purchaseNumber, productBarcode: products.barcode }).from(purchaseItems).innerJoin(purchases, eq(purchaseItems.purchaseId, purchases.id)).leftJoin(products, eq(purchaseItems.productId, products.id)).where(eq(purchases.shopId, input.shopId)),
      db.select().from(expenses).where(eq(expenses.shopId, input.shopId)),
      db.select({ receivable: receivables, customerName: customers.name, saleNumber: sales.saleNumber }).from(receivables).innerJoin(customers, eq(receivables.customerId, customers.id)).innerJoin(sales, eq(receivables.saleId, sales.id)).where(eq(receivables.shopId, input.shopId)),
      db.select({ repayment: repayments, customerName: customers.name, saleNumber: sales.saleNumber }).from(repayments).innerJoin(receivables, eq(repayments.receivableId, receivables.id)).innerJoin(customers, eq(receivables.customerId, customers.id)).innerJoin(sales, eq(receivables.saleId, sales.id)).where(eq(repayments.shopId, input.shopId)),
      db.select().from(cashClosures).where(eq(cashClosures.shopId, input.shopId)),
      db.select({ movement: stockMovements, productName: products.name }).from(stockMovements).innerJoin(products, eq(stockMovements.productId, products.id)).where(eq(stockMovements.shopId, input.shopId)),
      db.select().from(shopCurrencies).where(eq(shopCurrencies.shopId, input.shopId)),
      db.select().from(exchangeRates).where(eq(exchangeRates.shopId, input.shopId)),
    ]);
    return { products: productRows, variants: variantRows, customers: customerRows, suppliers: supplierRows, sales: saleRows, saleItems: lineRows, purchases: purchaseRows, purchaseItems: purchaseLineRows, expenses: expenseRows, receivables: receivableRows, repayments: repaymentRows, closures: closureRows, stockMovements: movementRows, currencies: currencyRows, exchangeRates: rateRows };
  }),
  preview: protectedProcedure.input(z.object({ shopId: z.string().uuid(), data: payload })).mutation(async ({ ctx, input }) => {
    await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
    const fileHash = fingerprint(input.data); const conflicts = await detectConflicts(input.shopId, input.data, fileHash);
    return { fingerprint: fileHash, totals: { products: input.data.products.length, customers: input.data.customers.length, suppliers: input.data.suppliers.length, sales: input.data.sales.length, saleItems: input.data.saleItems.length, purchases: input.data.purchases.length, purchaseItems: input.data.purchaseItems.length, expenses: input.data.expenses.length }, conflicts, importable: input.data.products.length + input.data.customers.length + input.data.suppliers.length + input.data.sales.length + input.data.saleItems.length + input.data.purchases.length + input.data.purchaseItems.length + input.data.expenses.length - conflicts.length };
  }),
  run: protectedProcedure.input(z.object({ shopId: z.string().uuid(), fileName: z.string().trim().min(1).max(240), data: payload, conflictStrategy })).mutation(async ({ ctx, input }) => {
    await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
    const db = getDb(); const fileHash = fingerprint(input.data); const conflicts = await detectConflicts(input.shopId, input.data, fileHash);
    if (conflicts.some((row) => row.type === "reimport")) return { replayed: true, imported: { products: 0, customers: 0, suppliers: 0, sales: 0, saleItems: 0, purchases: 0, purchaseItems: 0, expenses: 0 }, skipped: 0, conflicts };
    if (conflicts.some((row) => row.type === "business_day")) throw new TRPCError({ code: "CONFLICT", message: "L’import contient une opération datée sur une journée déjà clôturée. Corrigez le fichier ou choisissez une autre boutique." });
    const lineProductConflicts = conflicts.filter((row) => row.type === "product" && input.data.saleItems.some((item) => item.sourceId === row.sourceId));
    const purchaseLineProductConflicts = conflicts.filter((row) => row.type === "product" && input.data.purchaseItems.some((item) => item.sourceId === row.sourceId));
    if (lineProductConflicts.some((row) => row.reason.startsWith("Ajoutez"))) throw new TRPCError({ code: "BAD_REQUEST", message: "Chaque ligne de vente détaillée doit avoir un produit correspondant dans l’onglet Produits, avec son stock final." });
    if (purchaseLineProductConflicts.some((row) => row.reason.startsWith("Ajoutez"))) throw new TRPCError({ code: "BAD_REQUEST", message: "Chaque ligne d’achat détaillée doit avoir un produit correspondant dans l’onglet Produits." });
    if (lineProductConflicts.length && input.conflictStrategy !== "copy") throw new TRPCError({ code: "CONFLICT", message: "Une vente détaillée vise un produit existant. Choisissez « Créer une copie » pour conserver le stock actuel et reconstituer l’historique séparément." });
    if (input.conflictStrategy === "block" && conflicts.length) throw new TRPCError({ code: "CONFLICT", message: "Des collisions ont été détectées. Choisissez ignorer, mettre à jour ou créer une copie." });
    const blocked = new Set(conflicts.filter((row) => row.type === "sale" || row.type === "purchase" || (input.conflictStrategy === "skip" && (row.type === "product" || row.type === "customer" || row.type === "supplier"))).map((row) => `${row.type}:${row.sourceId}`));
    const sql = getSql();
    const knownProducts = await db.select({ id: products.id, name: products.name, barcode: products.barcode, stockQuantity: products.stockQuantity }).from(products).where(eq(products.shopId, input.shopId));
    const knownCustomers = await db.select({ id: customers.id, name: customers.name, phone: customers.phone }).from(customers).where(eq(customers.shopId, input.shopId));
    const knownSuppliers = await db.select({ id: suppliers.id, name: suppliers.name, email: suppliers.email }).from(suppliers).where(eq(suppliers.shopId, input.shopId));
    const queries = [];
    const customerByName = new Map(knownCustomers.map((row) => [normal(row.name), row.id]));
    const supplierByName = new Map(knownSuppliers.map((row) => [normal(row.name), row.id]));
    const productByName = new Map(knownProducts.map((row) => [normal(row.name), row.id])); const productByBarcode = new Map(knownProducts.filter((row) => Boolean(row.barcode)).map((row) => [row.barcode!, row.id]));
    const finalStockByProduct = new Map<string, number>();
    const saleByReference = new Map<string, { id: string; soldAt: Date }>();
    const purchaseByReference = new Map<string, string>();
    let productCount = 0; let customerCount = 0; let supplierCount = 0; let saleCount = 0; let saleItemCount = 0; let purchaseCount = 0; let purchaseItemCount = 0; let expenseCount = 0;
    for (const item of input.data.products) {
      const clash = conflicts.find((row) => row.type === "product" && row.sourceId === item.sourceId); const matched = knownProducts.find((row) => (item.barcode && row.barcode === item.barcode) || normal(row.name) === normal(item.name));
      if (blocked.has(`product:${item.sourceId}`) || (clash && input.conflictStrategy === "update" && !matched)) continue;
      if (clash && input.conflictStrategy === "update" && matched) { queries.push(sql`UPDATE products SET sale_price = ${item.salePrice}, purchase_price = ${item.purchasePrice}, category = ${item.category || "Sans catégorie"}, unit = ${item.unit || "unité"}, alert_threshold = ${item.alertThreshold}, updated_at = now() WHERE id = ${matched.id}`); productByName.set(normal(item.name), matched.id); if (item.barcode) productByBarcode.set(item.barcode, matched.id); finalStockByProduct.set(matched.id, matched.stockQuantity); productCount++; continue; }
      const copy = Boolean(clash && input.conflictStrategy === "copy"); const productId = crypto.randomUUID(); const productName = copy ? `${item.name} (import ${item.sourceId})` : item.name;
      queries.push(sql`INSERT INTO products (id, shop_id, name, barcode, reference, category, unit, sale_price, purchase_price, stock_quantity, alert_threshold) VALUES (${productId}, ${input.shopId}, ${productName}, ${copy ? null : item.barcode || null}, ${item.reference || null}, ${item.category || "Sans catégorie"}, ${item.unit || "unité"}, ${item.salePrice}, ${item.purchasePrice}, ${item.stockQuantity}, ${item.alertThreshold})`);
      productByName.set(normal(item.name), productId); if (item.barcode) productByBarcode.set(item.barcode, productId); finalStockByProduct.set(productId, item.stockQuantity);
      productCount++;
    }
    for (const item of input.data.customers) {
      const clash = conflicts.find((row) => row.type === "customer" && row.sourceId === item.sourceId); const matched = knownCustomers.find((row) => (item.phone && row.phone === item.phone) || normal(row.name) === normal(item.name));
      if (blocked.has(`customer:${item.sourceId}`) || (clash && input.conflictStrategy === "update" && !matched)) continue;
      if (clash && input.conflictStrategy === "update" && matched) { queries.push(sql`UPDATE customers SET phone = ${item.phone || matched.phone}, note = ${item.note || null}, updated_at = now() WHERE id = ${matched.id}`); customerByName.set(normal(item.name), matched.id); customerCount++; continue; }
      const copy = Boolean(clash && input.conflictStrategy === "copy"); const customerId = crypto.randomUUID(); const customerName = copy ? `${item.name} (import ${item.sourceId})` : item.name;
      queries.push(sql`INSERT INTO customers (id, shop_id, name, phone, note) VALUES (${customerId}, ${input.shopId}, ${customerName}, ${copy ? null : item.phone || null}, ${item.note || null})`); customerByName.set(normal(item.name), customerId); customerCount++;
    }
    for (const item of input.data.suppliers) {
      const clash = conflicts.find((row) => row.type === "supplier" && row.sourceId === item.sourceId); const matched = knownSuppliers.find((row) => (item.email && row.email === item.email) || normal(row.name) === normal(item.name));
      if (blocked.has(`supplier:${item.sourceId}`) || (clash && input.conflictStrategy === "update" && !matched)) continue;
      if (clash && input.conflictStrategy === "update" && matched) { queries.push(sql`UPDATE suppliers SET reference = ${item.reference || null}, contact_name = ${item.contactName || null}, phone = ${item.phone || null}, email = ${item.email || matched.email}, city = ${item.city || null}, delivery_lead_days = ${item.deliveryLeadDays || null}, payment_terms = ${item.paymentTerms || null}, updated_at = now() WHERE id = ${matched.id}`); supplierByName.set(normal(item.name), matched.id); supplierCount++; continue; }
      const copy = Boolean(clash && input.conflictStrategy === "copy"); const supplierId = crypto.randomUUID(); const supplierName = copy ? `${item.name} (import ${item.sourceId})` : item.name;
      queries.push(sql`INSERT INTO suppliers (id, shop_id, name, reference, contact_name, phone, email, city, delivery_lead_days, payment_terms) VALUES (${supplierId}, ${input.shopId}, ${supplierName}, ${item.reference || null}, ${item.contactName || null}, ${item.phone || null}, ${copy ? null : item.email || null}, ${item.city || null}, ${item.deliveryLeadDays || null}, ${item.paymentTerms || null})`); supplierByName.set(normal(item.name), supplierId); supplierCount++;
    }
    for (const item of input.data.sales) {
      if (blocked.has(`sale:${item.sourceId}`)) continue; const customerId = item.customerName ? customerByName.get(normal(item.customerName)) : undefined; const amountPaid = Math.min(item.total, item.cash + item.mobileMoney); const creditAmount = Math.max(0, item.total - amountPaid); if (creditAmount > 0 && !customerId) continue;
      const saleId = crypto.randomUUID(); const paymentMethod = creditAmount > 0 ? (amountPaid > 0 ? "mixed" : "credit") : (item.mobileMoney > 0 && item.cash > 0 ? "mixed" : item.mobileMoney > 0 ? "mobile_money" : "cash"); const saleNumber = item.reference || `IMP-${fileHash.slice(0, 8).toUpperCase()}-${item.sourceId.slice(0, 24).toUpperCase()}`;
      queries.push(sql`INSERT INTO sales (id, shop_id, customer_id, created_by, sale_number, operation_id, subtotal, discount_amount, total, amount_paid, credit_amount, payment_method, payment_breakdown, sold_at) VALUES (${saleId}, ${input.shopId}, ${customerId || null}, ${ctx.user.id}, ${saleNumber}, ${operation("sale", fileHash, item.sourceId)}, ${item.total + item.discountAmount}, ${item.discountAmount}, ${item.total}, ${amountPaid}, ${creditAmount}, ${paymentMethod}::payment_method, ${JSON.stringify({ cash: Math.min(item.cash, item.total), mobileMoney: Math.min(item.mobileMoney, Math.max(0, item.total - item.cash)) })}::jsonb, ${item.soldAt})`);
      if (creditAmount > 0 && customerId) queries.push(sql`INSERT INTO receivables (shop_id, customer_id, sale_id, original_amount, balance, due_date) VALUES (${input.shopId}, ${customerId}, ${saleId}, ${creditAmount}, ${creditAmount}, ${item.dueDate || null})`); if (item.reference) saleByReference.set(item.reference, { id: saleId, soldAt: item.soldAt }); saleCount++;
    }
    const plannedLines = input.data.saleItems.flatMap((item) => { const sale = saleByReference.get(item.saleReference); const productId = item.barcode ? productByBarcode.get(item.barcode) : productByName.get(normal(item.productName)); if (!sale || !productId || !finalStockByProduct.has(productId) || blocked.has(`product:${item.sourceId}`)) return []; return [{ ...item, saleId: sale.id, soldAt: sale.soldAt, productId }]; }).sort((left, right) => left.soldAt.valueOf() - right.soldAt.valueOf());
    const soldByProduct = new Map<string, number>(); for (const item of plannedLines) soldByProduct.set(item.productId, (soldByProduct.get(item.productId) ?? 0) + item.quantity);
    const stockAfter = new Map<string, number>(); for (const [productId, finalStock] of Array.from(finalStockByProduct.entries())) { const soldQuantity = soldByProduct.get(productId) ?? 0; const openingStock = finalStock + soldQuantity; const firstSaleAt = plannedLines.find((item) => item.productId === productId)?.soldAt; const openingAt = new Date((firstSaleAt?.valueOf() ?? Date.now()) - 1); stockAfter.set(productId, openingStock); queries.push(sql`INSERT INTO stock_movements (shop_id, product_id, created_by, type, quantity_delta, stock_after, reason, created_at) VALUES (${input.shopId}, ${productId}, ${ctx.user.id}, 'opening'::stock_movement_type, ${openingStock}, ${openingStock}, ${soldQuantity > 0 ? "Solde d’ouverture historique reconstitué" : "Stock initial importé"}, ${openingAt})`); }
    for (const item of plannedLines) { const remaining = Math.max(0, (stockAfter.get(item.productId) ?? item.quantity) - item.quantity); stockAfter.set(item.productId, remaining); queries.push(sql`INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, purchase_price, line_total) VALUES (${item.saleId}, ${item.productId}, ${item.productName}, ${item.quantity}, ${item.unitPrice}, ${item.purchasePrice}, ${item.quantity * item.unitPrice})`); queries.push(sql`INSERT INTO stock_movements (shop_id, product_id, sale_id, created_by, type, quantity_delta, stock_after, reason, created_at) VALUES (${input.shopId}, ${item.productId}, ${item.saleId}, ${ctx.user.id}, 'sale'::stock_movement_type, ${-item.quantity}, ${remaining}, 'Vente historique importée', ${item.soldAt})`); saleItemCount++; }
    for (const item of input.data.purchases) {
      if (blocked.has(`purchase:${item.sourceId}`)) continue;
      const purchaseId = crypto.randomUUID(); const supplierId = item.supplierName ? supplierByName.get(normal(item.supplierName)) : undefined;
      queries.push(sql`INSERT INTO purchases (id, shop_id, supplier_id, created_by, purchase_number, operation_id, status, payment_method, subtotal, tax_amount, total, purchased_at, received_at) VALUES (${purchaseId}, ${input.shopId}, ${supplierId || null}, ${ctx.user.id}, ${item.reference}, ${operation("purchase", fileHash, item.sourceId)}, ${item.status}::purchase_status, ${item.paymentMethod || null}, ${item.subtotal}, ${item.taxAmount}, ${item.total}, ${item.purchasedAt}, ${item.status === "received" ? item.receivedAt || item.purchasedAt : null})`); purchaseByReference.set(item.reference, purchaseId); purchaseCount++;
    }
    for (const item of input.data.purchaseItems) {
      const purchaseId = purchaseByReference.get(item.purchaseReference); const productId = item.barcode ? productByBarcode.get(item.barcode) : productByName.get(normal(item.productName));
      if (!purchaseId || !productId || blocked.has(`product:${item.sourceId}`)) continue;
      queries.push(sql`INSERT INTO purchase_items (purchase_id, product_id, product_name, quantity, unit_price, line_total) VALUES (${purchaseId}, ${productId}, ${item.productName}, ${item.quantity}, ${item.unitPrice}, ${item.quantity * item.unitPrice})`); purchaseItemCount++;
    }
    for (const item of input.data.expenses) { queries.push(sql`INSERT INTO expenses (shop_id, created_by, operation_id, category, amount, note, spent_at) VALUES (${input.shopId}, ${ctx.user.id}, ${operation("expense", fileHash, item.sourceId)}, ${item.category}, ${item.amount}, ${item.note || null}, ${item.spentAt})`); expenseCount++; }
    const imported = { products: productCount, customers: customerCount, suppliers: supplierCount, sales: saleCount, saleItems: saleItemCount, purchases: purchaseCount, purchaseItems: purchaseItemCount, expenses: expenseCount };
    queries.unshift(sql`INSERT INTO data_imports (shop_id, fingerprint, file_name, summary, imported_by) VALUES (${input.shopId}, ${fileHash}, ${input.fileName}, ${JSON.stringify(imported)}::jsonb, ${ctx.user.id})`);
    await sql.transaction(queries);
    return { replayed: false, imported, skipped: conflicts.length, conflicts };
  }),
});
