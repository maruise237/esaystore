import { TRPCError } from "@trpc/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getSql } from "../db";
import { commerceRouter } from "./commerce";
import { insightsRouter } from "./insights";
import { profileRouter } from "./profile";

const sql = getSql();
let userId = "";
let shopId = "";
let productId = "";
let customerId = "";

function caller() {
  return commerceRouter.createCaller({
    user: {
      id: userId,
      email: `test-${userId}@example.invalid`,
      name: "Integration Test",
      passwordHash: "not-used",
      role: "user",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as never,
    res: {} as never,
  });
}

function insightsCaller() {
  return insightsRouter.createCaller({
    user: {
      id: userId,
      email: `test-${userId}@example.invalid`,
      name: "Integration Test",
      passwordHash: "not-used",
      role: "user",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as never,
    res: {} as never,
  });
}

function profileCaller() {
  return profileRouter.createCaller({
    user: {
      id: userId,
      email: `test-${userId}@example.invalid`,
      name: "Integration Test",
      passwordHash: "not-used",
      role: "user",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as never,
    res: {} as never,
  });
}

beforeEach(async () => {
  userId = crypto.randomUUID();
  shopId = crypto.randomUUID();
  productId = crypto.randomUUID();
  customerId = crypto.randomUUID();
  await sql`INSERT INTO users (id, email, name, password_hash) VALUES (${userId}, ${`test-${userId}@example.invalid`}, 'Integration Test', 'not-used')`;
  await sql`INSERT INTO shops (id, name, slug, currency, country, created_by) VALUES (${shopId}, 'Boutique test', ${`test-${shopId.slice(0, 8)}`}, 'XAF', 'CMR', ${userId})`;
  await sql`INSERT INTO shop_members (shop_id, user_id, role) VALUES (${shopId}, ${userId}, 'owner')`;
  await sql`INSERT INTO products (id, shop_id, name, sale_price, purchase_price, stock_quantity, alert_threshold) VALUES (${productId}, ${shopId}, 'Produit test', 1000, 500, 5, 1)`;
  await sql`INSERT INTO customers (id, shop_id, name) VALUES (${customerId}, ${shopId}, 'Client test')`;
});

afterEach(async () => {
  await sql`DELETE FROM repayments WHERE shop_id = ${shopId}`;
  await sql`DELETE FROM receivables WHERE shop_id = ${shopId}`;
  await sql`DELETE FROM expenses WHERE shop_id = ${shopId}`;
  await sql`DELETE FROM stock_movements WHERE shop_id = ${shopId}`;
  await sql`DELETE FROM sales WHERE shop_id = ${shopId}`;
  await sql`DELETE FROM product_variants WHERE shop_id = ${shopId}`;
  await sql`DELETE FROM exchange_rates WHERE shop_id = ${shopId}`;
  await sql`DELETE FROM shop_currencies WHERE shop_id = ${shopId}`;
  await sql`DELETE FROM customers WHERE shop_id = ${shopId}`;
  await sql`DELETE FROM products WHERE shop_id = ${shopId}`;
  await sql`DELETE FROM shop_members WHERE shop_id = ${shopId}`;
  await sql`DELETE FROM shops WHERE id = ${shopId}`;
  await sql`DELETE FROM users WHERE id = ${userId}`;
});

describe("commerce transaction with Neon", () => {
  it("met à jour les coordonnées de boutique et synchronise la devise du pays avant toute activité", async () => {
    await profileCaller().update({
      shopId,
      phone: "+221771234567",
      country: "SEN",
      name: "Nouvelle boutique",
      address: "Marché central, Dakar",
      contactPhone: "+221771112233",
      receiptNote: "Merci de votre fidélité.",
    });
    const user = await sql`SELECT phone FROM users WHERE id = ${userId}`;
    const shop =
      await sql`SELECT name, country, currency, address, contact_phone, receipt_note FROM shops WHERE id = ${shopId}`;
    const currencies =
      await sql`SELECT currency, is_active FROM shop_currencies WHERE shop_id = ${shopId}`;
    expect(user[0]?.phone).toBe("+221771234567");
    expect(shop[0]).toMatchObject({
      name: "Nouvelle boutique",
      country: "SEN",
      currency: "XOF",
      address: "Marché central, Dakar",
      contact_phone: "+221771112233",
      receipt_note: "Merci de votre fidélité.",
    });
    expect(currencies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ currency: "XOF", is_active: true }),
      ])
    );
  });

  it("refuse de changer la devise de référence après la première vente", async () => {
    await caller().sales.checkout({
      shopId,
      operationId: crypto.randomUUID(),
      discountAmount: 0,
      payment: { cash: 1_000, mobileMoney: 0 },
      items: [{ productId, quantity: 1 }],
    });
    await expect(
      profileCaller().update({ shopId, country: "NGA" })
    ).rejects.toMatchObject<Partial<TRPCError>>({ code: "CONFLICT" });
    const shop =
      await sql`SELECT country, currency FROM shops WHERE id = ${shopId}`;
    expect(shop[0]).toMatchObject({ country: "CMR", currency: "XAF" });
  });

  it("decrements stock and writes a receivable for a credit sale", async () => {
    const result = await caller().sales.checkout({
      shopId,
      customerId,
      operationId: crypto.randomUUID(),
      discountAmount: 0,
      payment: { cash: 300, mobileMoney: 0 },
      items: [{ productId, quantity: 1 }],
    });
    expect(result.creditAmount).toBe(700);
    const product =
      await sql`SELECT stock_quantity FROM products WHERE id = ${productId}`;
    const receivable =
      await sql`SELECT balance FROM receivables WHERE shop_id = ${shopId}`;
    expect(Number(product[0]?.stock_quantity)).toBe(4);
    expect(Number(receivable[0]?.balance)).toBe(700);
  });

  it("stores the due date selected for a credit sale", async () => {
    const dueDate = new Date("2026-09-30T23:59:59.000Z");
    await caller().sales.checkout({
      shopId,
      customerId,
      operationId: crypto.randomUUID(),
      discountAmount: 0,
      payment: { cash: 0, mobileMoney: 0 },
      dueDate,
      items: [{ productId, quantity: 1 }],
    });
    const receivable =
      await sql`SELECT due_date FROM receivables WHERE shop_id = ${shopId}`;
    expect(new Date(String(receivable[0]?.due_date)).toISOString()).toBe(
      dueDate.toISOString()
    );
  });

  it("reports low-stock products and overdue receivables to the dashboard", async () => {
    await sql`UPDATE products SET stock_quantity = 1 WHERE id = ${productId}`;
    await caller().sales.checkout({
      shopId,
      customerId,
      operationId: crypto.randomUUID(),
      discountAmount: 0,
      payment: { cash: 0, mobileMoney: 0 },
      dueDate: new Date(Date.now() - 86_400_000),
      items: [{ productId, quantity: 1 }],
    });
    const dashboard = await insightsCaller().dashboard({ shopId });
    expect(dashboard.lowStockItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: productId,
          name: "Produit test",
          stockQuantity: 0,
        }),
      ])
    );
    expect(dashboard.overdueReceivables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ customerName: "Client test", balance: 1000 }),
      ])
    );
  });

  it("records a partial repayment and retains the remaining balance", async () => {
    await caller().sales.checkout({
      shopId,
      customerId,
      operationId: crypto.randomUUID(),
      discountAmount: 0,
      payment: { cash: 0, mobileMoney: 0 },
      items: [{ productId, quantity: 1 }],
    });
    const receivable =
      await sql`SELECT id FROM receivables WHERE shop_id = ${shopId}`;
    await caller().receivables.repay({
      shopId,
      receivableId: String(receivable[0]?.id),
      amount: 250,
      operationId: crypto.randomUUID(),
      paymentMethod: "cash",
    });
    const balance =
      await sql`SELECT balance FROM receivables WHERE id = ${String(receivable[0]?.id)}`;
    expect(Number(balance[0]?.balance)).toBe(750);
  });

  it("rejects an over-stock sale without decrementing stock", async () => {
    await expect(
      caller().sales.checkout({
        shopId,
        customerId,
        operationId: crypto.randomUUID(),
        discountAmount: 0,
        payment: { cash: 1_000, mobileMoney: 0 },
        items: [{ productId, quantity: 6 }],
      })
    ).rejects.toMatchObject<Partial<TRPCError>>({ code: "CONFLICT" });
    const product =
      await sql`SELECT stock_quantity FROM products WHERE id = ${productId}`;
    expect(Number(product[0]?.stock_quantity)).toBe(5);
  });

  it("decrements the selected variant without touching parent stock", async () => {
    const variantId = crypto.randomUUID();
    await sql`INSERT INTO product_variants (id, shop_id, product_id, name, attributes, sale_price, purchase_price, stock_quantity, alert_threshold) VALUES (${variantId}, ${shopId}, ${productId}, 'Bleu · M', '{"Couleur":"Bleu","Taille":"M"}'::jsonb, 1200, 600, 3, 1)`;
    await caller().sales.checkout({
      shopId,
      operationId: crypto.randomUUID(),
      discountAmount: 0,
      payment: { cash: 1200, mobileMoney: 0 },
      items: [{ productId, variantId, quantity: 1 }],
    });
    const variant =
      await sql`SELECT stock_quantity FROM product_variants WHERE id = ${variantId}`;
    const product =
      await sql`SELECT stock_quantity FROM products WHERE id = ${productId}`;
    const item =
      await sql`SELECT product_variant_id FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE shop_id = ${shopId})`;
    expect(Number(variant[0]?.stock_quantity)).toBe(2);
    expect(Number(product[0]?.stock_quantity)).toBe(5);
    expect(String(item[0]?.product_variant_id)).toBe(variantId);
  });

  it("uses the configured conversion rate and keeps both transaction and base values", async () => {
    await sql`INSERT INTO shop_currencies (shop_id, currency, is_active) VALUES (${shopId}, 'XOF', true)`;
    await sql`INSERT INTO exchange_rates (shop_id, currency, rate_to_base, created_by) VALUES (${shopId}, 'XOF', 2, ${userId})`;
    await caller().sales.checkout({
      shopId,
      operationId: crypto.randomUUID(),
      transactionCurrency: "XOF",
      discountAmount: 0,
      payment: { cash: 500, mobileMoney: 0 },
      items: [{ productId, quantity: 1 }],
    });
    const sale =
      await sql`SELECT total, transaction_currency, exchange_rate, transaction_total, transaction_amount_paid, payment_breakdown, transaction_payment_breakdown FROM sales WHERE shop_id = ${shopId}`;
    expect(Number(sale[0]?.total)).toBe(1000);
    expect(sale[0]?.transaction_currency).toBe("XOF");
    expect(Number(sale[0]?.exchange_rate)).toBe(2);
    expect(Number(sale[0]?.transaction_total)).toBe(500);
    expect(Number(sale[0]?.transaction_amount_paid)).toBe(500);
    expect(sale[0]?.payment_breakdown).toMatchObject({
      cash: 1000,
      mobileMoney: 0,
      rateToBase: 2,
    });
    expect(sale[0]?.transaction_payment_breakdown).toMatchObject({
      cash: 500,
      mobileMoney: 0,
    });
  });

  it("aggregates daily and weekly performance with expenses without crossing shop boundaries", async () => {
    const firstDay = new Date("2026-08-10T10:00:00.000Z");
    const secondDay = new Date("2026-08-11T10:00:00.000Z");
    await caller().sales.checkout({
      shopId,
      operationId: crypto.randomUUID(),
      soldAt: firstDay,
      discountAmount: 0,
      payment: { cash: 1_000, mobileMoney: 0 },
      items: [{ productId, quantity: 1 }],
    });
    await caller().sales.checkout({
      shopId,
      operationId: crypto.randomUUID(),
      soldAt: secondDay,
      discountAmount: 0,
      payment: { cash: 1_000, mobileMoney: 0 },
      items: [{ productId, quantity: 1 }],
    });
    await sql`INSERT INTO expenses (shop_id, created_by, operation_id, category, amount, spent_at) VALUES (${shopId}, ${userId}, ${crypto.randomUUID()}, 'Transport', 300, ${secondDay})`;
    const from = new Date("2026-08-10T00:00:00.000Z");
    const to = new Date("2026-08-11T23:59:59.999Z");
    const daily = await insightsCaller().report({
      shopId,
      from,
      to,
      granularity: "day",
    });
    expect(daily.turnover).toBe(2_000);
    expect(daily.grossMargin).toBe(1_000);
    expect(daily.expenses).toBe(300);
    expect(daily.operatingResult).toBe(700);
    expect(daily.saleCount).toBe(2);
    expect(daily.timeline).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ turnover: 1_000, expenses: 0, saleCount: 1 }),
        expect.objectContaining({
          turnover: 1_000,
          expenses: 300,
          saleCount: 1,
        }),
      ])
    );
    const weekly = await insightsCaller().report({
      shopId,
      from,
      to: new Date("2026-08-16T23:59:59.999Z"),
      granularity: "week",
    });
    expect(weekly.timeline).toHaveLength(1);
    expect(weekly.timeline[0]).toMatchObject({
      turnover: 2_000,
      expenses: 300,
      saleCount: 2,
    });
  });
}, 60_000);
