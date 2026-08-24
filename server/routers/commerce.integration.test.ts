import { TRPCError } from "@trpc/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getSql } from "../db";
import { commerceRouter } from "./commerce";
import { insightsRouter } from "./insights";

const sql = getSql();
let userId = "";
let shopId = "";
let productId = "";
let customerId = "";

function caller() {
  return commerceRouter.createCaller({
    user: { id: userId, email: `test-${userId}@example.invalid`, name: "Integration Test", passwordHash: "not-used", role: "user", isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: {} as never,
    res: {} as never,
  });
}

function insightsCaller() {
  return insightsRouter.createCaller({
    user: { id: userId, email: `test-${userId}@example.invalid`, name: "Integration Test", passwordHash: "not-used", role: "user", isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: {} as never,
    res: {} as never,
  });
}

beforeEach(async () => {
  userId = crypto.randomUUID(); shopId = crypto.randomUUID(); productId = crypto.randomUUID(); customerId = crypto.randomUUID();
  await sql`INSERT INTO users (id, email, name, password_hash) VALUES (${userId}, ${`test-${userId}@example.invalid`}, 'Integration Test', 'not-used')`;
  await sql`INSERT INTO shops (id, name, slug, currency, country, created_by) VALUES (${shopId}, 'Boutique test', ${`test-${shopId.slice(0, 8)}`}, 'XAF', 'CMR', ${userId})`;
  await sql`INSERT INTO shop_members (shop_id, user_id, role) VALUES (${shopId}, ${userId}, 'owner')`;
  await sql`INSERT INTO products (id, shop_id, name, sale_price, purchase_price, stock_quantity, alert_threshold) VALUES (${productId}, ${shopId}, 'Produit test', 1000, 500, 5, 1)`;
  await sql`INSERT INTO customers (id, shop_id, name) VALUES (${customerId}, ${shopId}, 'Client test')`;
});

afterEach(async () => {
  await sql`DELETE FROM repayments WHERE shop_id = ${shopId}`;
  await sql`DELETE FROM receivables WHERE shop_id = ${shopId}`;
  await sql`DELETE FROM stock_movements WHERE shop_id = ${shopId}`;
  await sql`DELETE FROM sales WHERE shop_id = ${shopId}`;
  await sql`DELETE FROM customers WHERE shop_id = ${shopId}`;
  await sql`DELETE FROM products WHERE shop_id = ${shopId}`;
  await sql`DELETE FROM shop_members WHERE shop_id = ${shopId}`;
  await sql`DELETE FROM shops WHERE id = ${shopId}`;
  await sql`DELETE FROM users WHERE id = ${userId}`;
});

describe("commerce transaction with Neon", () => {
  it("decrements stock and writes a receivable for a credit sale", async () => {
    const result = await caller().sales.checkout({ shopId, customerId, operationId: crypto.randomUUID(), discountAmount: 0, payment: { cash: 300, mobileMoney: 0 }, items: [{ productId, quantity: 1 }] });
    expect(result.creditAmount).toBe(700);
    const product = await sql`SELECT stock_quantity FROM products WHERE id = ${productId}`;
    const receivable = await sql`SELECT balance FROM receivables WHERE shop_id = ${shopId}`;
    expect(Number(product[0]?.stock_quantity)).toBe(4);
    expect(Number(receivable[0]?.balance)).toBe(700);
  });

  it("stores the due date selected for a credit sale", async () => {
    const dueDate = new Date("2026-09-30T23:59:59.000Z");
    await caller().sales.checkout({ shopId, customerId, operationId: crypto.randomUUID(), discountAmount: 0, payment: { cash: 0, mobileMoney: 0 }, dueDate, items: [{ productId, quantity: 1 }] });
    const receivable = await sql`SELECT due_date FROM receivables WHERE shop_id = ${shopId}`;
    expect(new Date(String(receivable[0]?.due_date)).toISOString()).toBe(dueDate.toISOString());
  });

  it("reports low-stock products and overdue receivables to the dashboard", async () => {
    await sql`UPDATE products SET stock_quantity = 1 WHERE id = ${productId}`;
    await caller().sales.checkout({ shopId, customerId, operationId: crypto.randomUUID(), discountAmount: 0, payment: { cash: 0, mobileMoney: 0 }, dueDate: new Date(Date.now() - 86_400_000), items: [{ productId, quantity: 1 }] });
    const dashboard = await insightsCaller().dashboard({ shopId });
    expect(dashboard.lowStockItems).toEqual(expect.arrayContaining([expect.objectContaining({ id: productId, name: "Produit test", stockQuantity: 0 })]));
    expect(dashboard.overdueReceivables).toEqual(expect.arrayContaining([expect.objectContaining({ customerName: "Client test", balance: 1000 })]));
  });

  it("records a partial repayment and retains the remaining balance", async () => {
    await caller().sales.checkout({ shopId, customerId, operationId: crypto.randomUUID(), discountAmount: 0, payment: { cash: 0, mobileMoney: 0 }, items: [{ productId, quantity: 1 }] });
    const receivable = await sql`SELECT id FROM receivables WHERE shop_id = ${shopId}`;
    await caller().receivables.repay({ shopId, receivableId: String(receivable[0]?.id), amount: 250, operationId: crypto.randomUUID(), paymentMethod: "cash" });
    const balance = await sql`SELECT balance FROM receivables WHERE id = ${String(receivable[0]?.id)}`;
    expect(Number(balance[0]?.balance)).toBe(750);
  });

  it("rejects an over-stock sale without decrementing stock", async () => {
    await expect(caller().sales.checkout({ shopId, customerId, operationId: crypto.randomUUID(), discountAmount: 0, payment: { cash: 1_000, mobileMoney: 0 }, items: [{ productId, quantity: 6 }] })).rejects.toMatchObject<Partial<TRPCError>>({ code: "CONFLICT" });
    const product = await sql`SELECT stock_quantity FROM products WHERE id = ${productId}`;
    expect(Number(product[0]?.stock_quantity)).toBe(5);
  });
}, 60_000);
