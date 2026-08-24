import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getSql } from "../db";
import { closingRouter } from "./closing";
import { commerceRouter } from "./commerce";

const sql = getSql();
let userId = "";
let shopId = "";
let productId = "";
let customerId = "";
const businessDate = new Date().toISOString().slice(0, 10);

function context() {
  return { user: { id: userId, email: `closing-${userId}@example.invalid`, name: "Closing Test", passwordHash: "not-used", role: "user" as const, isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as never, res: {} as never };
}

beforeEach(async () => {
  userId = crypto.randomUUID(); shopId = crypto.randomUUID(); productId = crypto.randomUUID(); customerId = crypto.randomUUID();
  await sql`INSERT INTO users (id, email, name, password_hash) VALUES (${userId}, ${`closing-${userId}@example.invalid`}, 'Closing Test', 'not-used')`;
  await sql`INSERT INTO shops (id, name, slug, currency, country, created_by) VALUES (${shopId}, 'Clôture test', ${`closing-${shopId.slice(0, 8)}`}, 'XAF', 'CMR', ${userId})`;
  await sql`INSERT INTO shop_members (shop_id, user_id, role) VALUES (${shopId}, ${userId}, 'owner')`;
  await sql`INSERT INTO products (id, shop_id, name, sale_price, purchase_price, stock_quantity, alert_threshold) VALUES (${productId}, ${shopId}, 'Produit clôture', 1000, 500, 5, 1)`;
  await sql`INSERT INTO customers (id, shop_id, name) VALUES (${customerId}, ${shopId}, 'Client clôture')`;
});

afterEach(async () => {
  await sql`DELETE FROM cash_closures WHERE shop_id = ${shopId}`;
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

describe("daily cash closing with Neon", () => {
  it("summarizes cash, subtracts expenses and locks the day idempotently", async () => {
    await commerceRouter.createCaller(context()).sales.checkout({ shopId, operationId: crypto.randomUUID(), discountAmount: 0, payment: { cash: 1000, mobileMoney: 0 }, items: [{ productId, quantity: 1 }] });
    await commerceRouter.createCaller(context()).sales.checkout({ shopId, customerId, operationId: crypto.randomUUID(), discountAmount: 0, payment: { cash: 0, mobileMoney: 0 }, items: [{ productId, quantity: 1 }] });
    await commerceRouter.createCaller(context()).expenses.create({ shopId, category: "Transport", amount: 200, operationId: crypto.randomUUID() });
    const preview = await closingRouter.createCaller(context()).preview({ shopId, businessDate });
    expect(preview.expected_cash).toBe(800);
    expect(preview.sale_count).toBe(2);
    const closed = await closingRouter.createCaller(context()).close({ shopId, businessDate, declaredCash: 800 });
    expect(closed.replayed).toBe(false);
    expect(closed.closure.difference).toBe(0);
    const initialReport = { expectedCash: closed.closure.expectedCash, declaredCash: closed.closure.declaredCash, difference: closed.closure.difference, snapshot: closed.closure.snapshot };
    const replayed = await closingRouter.createCaller(context()).close({ shopId, businessDate, declaredCash: 0 });
    expect(replayed.replayed).toBe(true);
    expect(replayed.closure.declaredCash).toBe(800);
    await expect(commerceRouter.createCaller(context()).sales.checkout({ shopId, operationId: crypto.randomUUID(), discountAmount: 0, payment: { cash: 1000, mobileMoney: 0 }, items: [{ productId, quantity: 1 }] })).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(commerceRouter.createCaller(context()).expenses.create({ shopId, category: "Transport", amount: 100, operationId: crypto.randomUUID() })).rejects.toMatchObject({ code: "CONFLICT" });
    const receivable = await sql`SELECT id FROM receivables WHERE shop_id = ${shopId}`;
    await expect(commerceRouter.createCaller(context()).receivables.repay({ shopId, receivableId: String(receivable[0]?.id), amount: 100, operationId: crypto.randomUUID(), paymentMethod: "cash" })).rejects.toMatchObject({ code: "CONFLICT" });
    const [persistedClosure] = await sql`SELECT declared_cash FROM cash_closures WHERE shop_id = ${shopId}`;
    const [persistedReceivable] = await sql`SELECT balance FROM receivables WHERE shop_id = ${shopId}`;
    expect(Number(persistedClosure?.declared_cash)).toBe(800);
    expect(Number(persistedReceivable?.balance)).toBe(1000);
    const stablePreview = await closingRouter.createCaller(context()).preview({ shopId, businessDate });
    expect(stablePreview.expected_cash).toBe(initialReport.expectedCash);
    expect({ expectedCash: stablePreview.closure?.expectedCash, declaredCash: stablePreview.closure?.declaredCash, difference: stablePreview.closure?.difference, snapshot: stablePreview.closure?.snapshot }).toEqual(initialReport);
  }, 60_000);
});
