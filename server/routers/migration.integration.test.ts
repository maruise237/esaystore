import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getSql } from "../db";
import { closingRouter } from "./closing";
import { migrationRouter } from "./migration";

const sql = getSql();
let userId = "";
let shopId = "";

function context() {
  return { user: { id: userId, email: `migration-${userId}@example.invalid`, name: "Migration Test", passwordHash: "not-used", role: "user" as const, isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as never, res: {} as never };
}

function dataFor(date = new Date("2025-05-10T10:00:00.000Z")) {
  const nextDate = new Date(date.valueOf() + 24 * 60 * 60 * 1000);
  return { products: [{ sourceId: "products-2", name: "Savon importé", barcode: "99001122", salePrice: 750, purchasePrice: 400, stockQuantity: 6, alertThreshold: 2 }, { sourceId: "products-3", name: "Produit sans vente", salePrice: 500, purchasePrice: 250, stockQuantity: 4, alertThreshold: 1 }], customers: [{ sourceId: "customers-2", name: "Aline importée", phone: "+237600000000" }], sales: [{ sourceId: "sales-2", reference: "VENTE-ANCIENNE-1", soldAt: date, customerName: "Aline importée", total: 1000, cash: 400, mobileMoney: 0, discountAmount: 0, dueDate: new Date("2025-06-10T10:00:00.000Z") }, { sourceId: "sales-3", reference: "VENTE-ANCIENNE-2", soldAt: nextDate, total: 1000, cash: 1000, mobileMoney: 0, discountAmount: 0 }], saleItems: [{ sourceId: "lignes-2", saleReference: "VENTE-ANCIENNE-1", productName: "Savon importé", barcode: "99001122", quantity: 1, unitPrice: 1000, purchasePrice: 400 }, { sourceId: "lignes-3", saleReference: "VENTE-ANCIENNE-2", productName: "Savon importé", barcode: "99001122", quantity: 1, unitPrice: 1000, purchasePrice: 400 }], expenses: [{ sourceId: "expenses-2", category: "Transport", amount: 100, spentAt: date }] };
}

beforeEach(async () => {
  userId = crypto.randomUUID(); shopId = crypto.randomUUID();
  await sql`INSERT INTO users (id, email, name, password_hash) VALUES (${userId}, ${`migration-${userId}@example.invalid`}, 'Migration Test', 'not-used')`;
  await sql`INSERT INTO shops (id, name, slug, currency, country, created_by) VALUES (${shopId}, 'Migration test', ${`migration-${shopId.slice(0, 8)}`}, 'XAF', 'CMR', ${userId})`;
  await sql`INSERT INTO shop_members (shop_id, user_id, role) VALUES (${shopId}, ${userId}, 'owner')`;
});

afterEach(async () => {
  await sql`DELETE FROM data_imports WHERE shop_id = ${shopId}`;
  await sql`DELETE FROM cash_closures WHERE shop_id = ${shopId}`;
  await sql`DELETE FROM repayments WHERE shop_id = ${shopId}`;
  await sql`DELETE FROM receivables WHERE shop_id = ${shopId}`;
  await sql`DELETE FROM expenses WHERE shop_id = ${shopId}`;
  await sql`DELETE FROM purchase_items WHERE purchase_id IN (SELECT id FROM purchases WHERE shop_id = ${shopId})`;
  await sql`DELETE FROM purchases WHERE shop_id = ${shopId}`;
  await sql`DELETE FROM stock_movements WHERE shop_id = ${shopId}`;
  await sql`DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE shop_id = ${shopId})`;
  await sql`DELETE FROM sales WHERE shop_id = ${shopId}`;
  await sql`DELETE FROM customers WHERE shop_id = ${shopId}`;
  await sql`DELETE FROM suppliers WHERE shop_id = ${shopId}`;
  await sql`DELETE FROM products WHERE shop_id = ${shopId}`;
  await sql`DELETE FROM shop_members WHERE shop_id = ${shopId}`;
  await sql`DELETE FROM shops WHERE id = ${shopId}`;
  await sql`DELETE FROM users WHERE id = ${userId}`;
});

describe("migration de fichiers avec Neon", () => {
  it("imports once, journals the fingerprint and preserves stock opening movements", async () => {
    const payload = dataFor(); const caller = migrationRouter.createCaller(context());
    const preview = await caller.preview({ shopId, data: payload });
    expect(preview.conflicts).toEqual([]);
    const first = await caller.run({ shopId, fileName: "historique.xlsx", data: payload, conflictStrategy: "skip" });
    expect(first.replayed).toBe(false); expect(first.imported).toEqual({ products: 2, customers: 1, suppliers: 0, sales: 2, saleItems: 2, purchases: 0, purchaseItems: 0, expenses: 1 });
    const [counts] = await sql`SELECT (SELECT count(*) FROM data_imports WHERE shop_id = ${shopId}) AS imports, (SELECT count(*) FROM stock_movements WHERE shop_id = ${shopId} AND type = 'opening') AS openings, (SELECT count(*) FROM stock_movements WHERE shop_id = ${shopId} AND type = 'sale') AS sale_moves, (SELECT count(*) FROM receivables WHERE shop_id = ${shopId}) AS receivables`;
    expect(Number(counts?.imports)).toBe(1); expect(Number(counts?.openings)).toBe(2); expect(Number(counts?.sale_moves)).toBe(2); expect(Number(counts?.receivables)).toBe(1);
    const [stock] = await sql`SELECT stock_quantity FROM products WHERE shop_id = ${shopId} AND name = 'Savon importé'`;
    const movements = await sql`SELECT m.type, m.quantity_delta, m.stock_after, m.created_at FROM stock_movements m INNER JOIN products p ON p.id = m.product_id WHERE m.shop_id = ${shopId} AND p.name = 'Savon importé' ORDER BY m.created_at ASC`;
    const [unsoldOpening] = await sql`SELECT quantity_delta, stock_after FROM stock_movements m INNER JOIN products p ON p.id = m.product_id WHERE m.shop_id = ${shopId} AND p.name = 'Produit sans vente' AND m.type = 'opening'`;
    expect(Number(stock?.stock_quantity)).toBe(6); expect(movements.map((row) => row.type)).toEqual(["opening", "sale", "sale"]); expect(movements.map((row) => Number(row.quantity_delta))).toEqual([8, -1, -1]); expect(movements.map((row) => Number(row.stock_after))).toEqual([8, 7, 6]); expect(Number(unsoldOpening?.quantity_delta)).toBe(4); expect(Number(unsoldOpening?.stock_after)).toBe(4); expect(new Date(String(movements[0]?.created_at)).valueOf()).toBeLessThan(new Date(String(movements[1]?.created_at)).valueOf()); expect(new Date(String(movements[1]?.created_at)).valueOf()).toBeLessThan(new Date(String(movements[2]?.created_at)).valueOf());
    const exported = await caller.exportData({ shopId });
    expect(exported.products).toHaveLength(2); expect(exported.customers).toHaveLength(1); expect(exported.suppliers).toHaveLength(0); expect(exported.sales).toHaveLength(2); expect(exported.saleItems).toHaveLength(2); expect(exported.purchases).toHaveLength(0); expect(exported.purchaseItems).toHaveLength(0); expect(exported.expenses).toHaveLength(1); expect(exported.receivables).toHaveLength(1); expect(exported.stockMovements).toHaveLength(4);
    const replay = await caller.run({ shopId, fileName: "historique.xlsx", data: payload, conflictStrategy: "skip" });
    expect(replay.replayed).toBe(true);
  }, 60_000);

  it("reports and rejects historical operations targeting a closed business day", async () => {
    const closedAt = new Date("2025-05-11T10:00:00.000Z"); const businessDate = closedAt.toISOString().slice(0, 10);
    await closingRouter.createCaller(context()).close({ shopId, businessDate, declaredCash: 0 });
    const caller = migrationRouter.createCaller(context()); const payload = dataFor(closedAt);
    const preview = await caller.preview({ shopId, data: payload });
    expect(preview.conflicts.some((item) => item.type === "business_day")).toBe(true);
    await expect(caller.run({ shopId, fileName: "jour-cloture.xlsx", data: payload, conflictStrategy: "skip" })).rejects.toMatchObject({ code: "CONFLICT" });
    const [count] = await sql`SELECT count(*) FROM sales WHERE shop_id = ${shopId}`;
    expect(Number(count?.count)).toBe(0);
  }, 60_000);

  it("requires a copy strategy when detailed sales reference an existing product", async () => {
    const existingProductId = crypto.randomUUID();
    await sql`INSERT INTO products (id, shop_id, name, barcode, sale_price, purchase_price, stock_quantity, alert_threshold) VALUES (${existingProductId}, ${shopId}, 'Savon existant', '99001122', 900, 400, 9, 2)`;
    const caller = migrationRouter.createCaller(context()); const payload = dataFor();
    const preview = await caller.preview({ shopId, data: payload });
    expect(preview.conflicts.some((item) => item.sourceId === "lignes-2" && item.reason.includes("existe déjà"))).toBe(true);
    await expect(caller.run({ shopId, fileName: "collision-produit.xlsx", data: payload, conflictStrategy: "update" })).rejects.toMatchObject({ code: "CONFLICT" });
    const copied = await caller.run({ shopId, fileName: "collision-produit.xlsx", data: payload, conflictStrategy: "copy" });
    expect(copied.imported.saleItems).toBe(2);
    const [existing] = await sql`SELECT stock_quantity FROM products WHERE id = ${existingProductId}`;
    expect(Number(existing?.stock_quantity)).toBe(9);
  }, 90_000);

  it("imports suppliers, purchases and purchase lines without altering the final stock", async () => {
    const caller = migrationRouter.createCaller(context());
    const payload = {
      ...dataFor(),
      suppliers: [{ sourceId: "suppliers-2", name: "Maison fournisseur", reference: "FOU-01", email: "fournisseur@example.invalid", city: "Douala", deliveryLeadDays: 5, paymentTerms: "30 jours" }],
      purchases: [{ sourceId: "purchases-2", reference: "ACHAT-ANCIEN-1", purchasedAt: new Date("2025-05-08T10:00:00.000Z"), supplierName: "Maison fournisseur", status: "received" as const, paymentMethod: "Virement", subtotal: 800, taxAmount: 0, total: 800, receivedAt: new Date("2025-05-09T10:00:00.000Z") }],
      purchaseItems: [{ sourceId: "purchase-lines-2", purchaseReference: "ACHAT-ANCIEN-1", productName: "Savon importé", barcode: "99001122", quantity: 2, unitPrice: 400 }],
    };
    const preview = await caller.preview({ shopId, data: payload });
    expect(preview.totals).toMatchObject({ suppliers: 1, purchases: 1, purchaseItems: 1 });
    const result = await caller.run({ shopId, fileName: "achats.xlsx", data: payload, conflictStrategy: "skip" });
    expect(result.imported).toMatchObject({ suppliers: 1, purchases: 1, purchaseItems: 1 });
    const [counts] = await sql`SELECT (SELECT count(*) FROM suppliers WHERE shop_id = ${shopId}) AS suppliers, (SELECT count(*) FROM purchases WHERE shop_id = ${shopId}) AS purchases, (SELECT count(*) FROM purchase_items WHERE purchase_id IN (SELECT id FROM purchases WHERE shop_id = ${shopId})) AS purchase_items`;
    expect(Number(counts?.suppliers)).toBe(1); expect(Number(counts?.purchases)).toBe(1); expect(Number(counts?.purchase_items)).toBe(1);
    const [stock] = await sql`SELECT stock_quantity FROM products WHERE shop_id = ${shopId} AND name = 'Savon importé'`;
    expect(Number(stock?.stock_quantity)).toBe(6);
  }, 90_000);

  it("reports an explicit purchase conflict when its supplier is not available", async () => {
    const caller = migrationRouter.createCaller(context());
    const preview = await caller.preview({
      shopId,
      data: {
        ...dataFor(),
        purchases: [{ sourceId: "purchases-orphan", reference: "ACH-SANS-FOURNISSEUR", purchasedAt: new Date("2025-05-08T10:00:00.000Z"), supplierName: "Fournisseur absent", status: "pending", subtotal: 400, taxAmount: 0, total: 400 }],
      },
    });
    expect(preview.conflicts).toEqual(expect.arrayContaining([expect.objectContaining({ type: "purchase", sourceId: "purchases-orphan", reason: expect.stringContaining("introuvable") })]));
  }, 90_000);
});
