import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, lt, lte } from "drizzle-orm";
import { z } from "zod";
import { customers, exchangeRates, expenses, products, productVariants, receivables, repayments, sales, shopCurrencies, shops } from "../../drizzle/schema";
import { money, paymentMethodFor, sumPaid } from "../lib/commerce";
import { getDb, rawRows } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { assertBusinessDayOpen, assertShopAccess } from "./helpers";

const checkoutInput = z.object({
  shopId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  operationId: z.string().uuid(),
  discountAmount: z.coerce.number().min(0).default(0),
  payment: z.object({ cash: z.coerce.number().min(0).default(0), mobileMoney: z.coerce.number().min(0).default(0) }),
  transactionCurrency: z.string().trim().toUpperCase().min(3).max(8).default("XAF"),
  items: z.array(z.object({ productId: z.string().uuid(), variantId: z.string().uuid().optional(), quantity: z.coerce.number().positive() })).min(1).max(100),
  soldAt: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
});

export const commerceRouter = router({
  sales: router({
    list: protectedProcedure.input(z.object({ shopId: z.string().uuid(), from: z.coerce.date().optional(), to: z.coerce.date().optional() })).query(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId);
      const conditions = [eq(sales.shopId, input.shopId)];
      if (input.from) conditions.push((await import("drizzle-orm")).gte(sales.soldAt, input.from));
      if (input.to) conditions.push((await import("drizzle-orm")).lte(sales.soldAt, input.to));
      return getDb()
        .select({ sale: sales, customerName: customers.name })
        .from(sales)
        .leftJoin(customers, eq(sales.customerId, customers.id))
        .where(and(...conditions))
        .orderBy(desc(sales.soldAt))
        .limit(200);
    }),

    checkout: protectedProcedure.input(checkoutInput).mutation(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId);
      await assertBusinessDayOpen(input.shopId, input.soldAt ?? new Date());
      const db = getDb();
      const [shop] = await db.select({ currency: shops.currency }).from(shops).where(eq(shops.id, input.shopId)).limit(1);
      if (!shop) throw new TRPCError({ code: "NOT_FOUND", message: "Boutique introuvable." });
      const transactionCurrency = input.transactionCurrency;
      const soldAt = input.soldAt ?? new Date();
      let exchangeRate = 1;
      if (transactionCurrency !== shop.currency) {
        const [currency] = await db.select({ isActive: shopCurrencies.isActive }).from(shopCurrencies).where(and(eq(shopCurrencies.shopId, input.shopId), eq(shopCurrencies.currency, transactionCurrency))).limit(1);
        if (!currency?.isActive) throw new TRPCError({ code: "BAD_REQUEST", message: "Cette devise n’est pas active pour la boutique." });
        const [rate] = await db.select({ rateToBase: exchangeRates.rateToBase }).from(exchangeRates).where(and(eq(exchangeRates.shopId, input.shopId), eq(exchangeRates.currency, transactionCurrency), lte(exchangeRates.effectiveAt, soldAt))).orderBy(desc(exchangeRates.effectiveAt)).limit(1);
        if (!rate) throw new TRPCError({ code: "BAD_REQUEST", message: "Aucun taux valide n’est défini pour cette devise à la date de vente." });
        exchangeRate = rate.rateToBase;
      }
      const [existing] = await db.select({ id: sales.id, saleNumber: sales.saleNumber }).from(sales)
        .where(and(eq(sales.shopId, input.shopId), eq(sales.operationId, input.operationId))).limit(1);
      if (existing) return { ...existing, replayed: true };

      const productIds = Array.from(new Set(input.items.map(item => item.productId)));
      const activeProducts = await db.select().from(products).where(and(eq(products.shopId, input.shopId), inArray(products.id, productIds)));
      if (activeProducts.length !== productIds.length) throw new TRPCError({ code: "BAD_REQUEST", message: "Un produit du panier est introuvable." });

      const byId = new Map(activeProducts.map(product => [product.id, product]));
      const variantIds = Array.from(new Set(input.items.flatMap(item => item.variantId ? [item.variantId] : [])));
      const activeVariants = variantIds.length ? await db.select().from(productVariants).where(and(eq(productVariants.shopId, input.shopId), inArray(productVariants.id, variantIds))) : [];
      if (activeVariants.length !== variantIds.length) throw new TRPCError({ code: "BAD_REQUEST", message: "Une variante du panier est introuvable." });
      const variantById = new Map(activeVariants.map(variant => [variant.id, variant]));
      for (const item of input.items) if (item.variantId && variantById.get(item.variantId)?.productId !== item.productId) throw new TRPCError({ code: "BAD_REQUEST", message: "La variante ne correspond pas à son produit." });
      const subtotal = money(input.items.reduce((total, item) => total + (item.variantId ? variantById.get(item.variantId)?.salePrice ?? 0 : byId.get(item.productId)?.salePrice ?? 0) * item.quantity, 0));
      const transactionSubtotal = money(subtotal / exchangeRate);
      const transactionDiscount = money(input.discountAmount);
      const discountAmount = money(transactionDiscount * exchangeRate);
      if (discountAmount > subtotal) throw new TRPCError({ code: "BAD_REQUEST", message: "La remise dépasse le montant de la vente." });
      const total = money(subtotal - discountAmount);
      const transactionTotal = money(total / exchangeRate);
      const transactionAmountPaid = sumPaid(input.payment);
      const amountPaid = money(transactionAmountPaid * exchangeRate);
      if (amountPaid > total) throw new TRPCError({ code: "BAD_REQUEST", message: "Le montant encaissé dépasse le total de la vente." });
      const creditAmount = money(total - amountPaid);
      if (creditAmount > 0 && !input.customerId) throw new TRPCError({ code: "BAD_REQUEST", message: "Un client est requis pour une vente à crédit." });
      if (input.customerId) {
        const [customer] = await db.select({ id: customers.id }).from(customers).where(and(eq(customers.id, input.customerId), eq(customers.shopId, input.shopId))).limit(1);
        if (!customer) throw new TRPCError({ code: "BAD_REQUEST", message: "Le client ne correspond pas à cette boutique." });
      }

      const saleId = crypto.randomUUID();
      const saleNumber = `V-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${input.operationId.slice(0, 6).toUpperCase()}`;
      const rows = await rawRows<{ sale_id?: string; sufficient?: boolean }>(
        `WITH input_rows AS (
           SELECT * FROM jsonb_to_recordset($1::jsonb) AS row(product_id uuid, variant_id uuid, quantity numeric)
         ), input AS (
           SELECT product_id, variant_id, sum(quantity) AS quantity FROM input_rows GROUP BY product_id, variant_id
         ), locked_products AS (
           SELECT p.id AS product_id, NULL::uuid AS variant_id, p.name, p.sale_price, p.purchase_price, p.stock_quantity, i.quantity
           FROM products p JOIN input i ON i.product_id = p.id
           WHERE p.shop_id = $2 AND p.is_active = true AND i.variant_id IS NULL FOR UPDATE OF p
         ), locked_variants AS (
           SELECT p.id AS product_id, v.id AS variant_id, v.name, v.sale_price, v.purchase_price, v.stock_quantity, i.quantity
           FROM products p JOIN product_variants v ON v.product_id = p.id AND v.shop_id = p.shop_id
           JOIN input i ON i.product_id = p.id AND i.variant_id = v.id
           WHERE p.shop_id = $2 AND p.is_active = true AND v.is_active = true FOR UPDATE OF p, v
         ), locked AS (
           SELECT * FROM locked_products UNION ALL SELECT * FROM locked_variants
         ), guard AS (
           SELECT count(*) = (SELECT count(*) FROM input)
             AND coalesce(bool_and(stock_quantity >= quantity), false)
             AND coalesce(sum(sale_price * quantity), 0) >= $8 AS sufficient
           FROM locked
         ), new_sale AS (
           INSERT INTO sales (id, shop_id, customer_id, created_by, sale_number, operation_id, subtotal, discount_amount, total, amount_paid, credit_amount, payment_method, payment_breakdown, transaction_currency, exchange_rate, transaction_subtotal, transaction_discount_amount, transaction_total, transaction_amount_paid, transaction_payment_breakdown, sold_at)
           SELECT $3, $2, $4, $5, $6, $7, sum(l.sale_price * l.quantity), $8, sum(l.sale_price * l.quantity) - $8, $9, greatest(sum(l.sale_price * l.quantity) - $8 - $9, 0), $10::payment_method, $11::jsonb, $14, $15, $16, $17, $18, $19, $20::jsonb, $12
           FROM locked l CROSS JOIN guard g WHERE g.sufficient GROUP BY g.sufficient
           RETURNING id, credit_amount
         ), updated_products AS (
           UPDATE products p SET stock_quantity = p.stock_quantity - l.quantity, updated_at = now()
           FROM locked l, new_sale s WHERE p.id = l.product_id AND l.variant_id IS NULL RETURNING p.id AS product_id, NULL::uuid AS variant_id, p.stock_quantity
         ), updated_variants AS (
           UPDATE product_variants v SET stock_quantity = v.stock_quantity - l.quantity, updated_at = now()
           FROM locked l, new_sale s WHERE v.id = l.variant_id RETURNING v.product_id, v.id AS variant_id, v.stock_quantity
         ), updated_stock AS (
           SELECT * FROM updated_products UNION ALL SELECT * FROM updated_variants
         ), written_items AS (
           INSERT INTO sale_items (sale_id, product_id, product_variant_id, product_name, quantity, unit_price, purchase_price, line_total)
           SELECT s.id, l.product_id, l.variant_id, l.name, l.quantity, l.sale_price, l.purchase_price, l.sale_price * l.quantity FROM locked l CROSS JOIN new_sale s
         ), written_moves AS (
           INSERT INTO stock_movements (shop_id, product_id, product_variant_id, sale_id, created_by, type, quantity_delta, stock_after, reason)
           SELECT $2, l.product_id, l.variant_id, s.id, $5, 'sale', -l.quantity, u.stock_quantity, 'Vente POS'
           FROM locked l JOIN updated_stock u ON u.product_id = l.product_id AND u.variant_id IS NOT DISTINCT FROM l.variant_id CROSS JOIN new_sale s
         ), written_receivable AS (
           INSERT INTO receivables (shop_id, customer_id, sale_id, original_amount, balance, due_date)
           SELECT $2, $4, id, credit_amount, credit_amount, $13 FROM new_sale WHERE credit_amount > 0
         )
         SELECT (SELECT id FROM new_sale) AS sale_id, (SELECT sufficient FROM guard) AS sufficient`,
        [JSON.stringify(input.items.map(item => ({ product_id: item.productId, variant_id: item.variantId ?? null, quantity: item.quantity }))), input.shopId, saleId, input.customerId ?? null, ctx.user.id, saleNumber, input.operationId, discountAmount, amountPaid, paymentMethodFor(total, amountPaid, { cash: money(input.payment.cash * exchangeRate), mobileMoney: money(input.payment.mobileMoney * exchangeRate) }), JSON.stringify({ cash: money(input.payment.cash * exchangeRate), mobileMoney: money(input.payment.mobileMoney * exchangeRate), rateToBase: exchangeRate }), soldAt, input.dueDate ?? null, transactionCurrency, exchangeRate, transactionSubtotal, transactionDiscount, transactionTotal, transactionAmountPaid, JSON.stringify(input.payment)],
      );
      const outcome = rows[0];
      if (!outcome?.sale_id || !outcome.sufficient) throw new TRPCError({ code: "CONFLICT", message: "Stock insuffisant : la vente n’a pas été enregistrée." });
      return { id: outcome.sale_id, saleNumber, replayed: false, total, creditAmount };
    }),
  }),

  receivables: router({
    list: protectedProcedure.input(z.object({ shopId: z.string().uuid(), includeSettled: z.boolean().optional(), status: z.enum(["open", "settled", "all"]).optional(), overdueOnly: z.boolean().default(false) })).query(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId);
      const status = input.status ?? (input.includeSettled ? "all" : "open");
      const conditions = [eq(receivables.shopId, input.shopId)];
      if (status === "open") conditions.push(eq(receivables.isSettled, false));
      if (status === "settled") conditions.push(eq(receivables.isSettled, true));
      if (input.overdueOnly) conditions.push(and(eq(receivables.isSettled, false), lt(receivables.dueDate, new Date()))!);
      return getDb().select({ receivable: receivables, customerName: customers.name }).from(receivables).innerJoin(customers, eq(receivables.customerId, customers.id)).where(and(...conditions)).orderBy(desc(receivables.createdAt));
    }),
    repay: protectedProcedure.input(z.object({ shopId: z.string().uuid(), receivableId: z.string().uuid(), amount: z.coerce.number().positive(), operationId: z.string().uuid(), paymentMethod: z.enum(["cash", "mobile_money"]).default("cash") })).mutation(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId);
      await assertBusinessDayOpen(input.shopId, new Date());
      const rows = await rawRows<{ id: string; balance: number; is_settled: boolean }>(
        `WITH updated AS (
           UPDATE receivables SET balance = balance - $1, is_settled = balance - $1 <= 0, updated_at = now()
           WHERE id = $2 AND shop_id = $3 AND balance >= $1 RETURNING id, balance, is_settled
         ), written AS (
           INSERT INTO repayments (shop_id, receivable_id, created_by, operation_id, amount, payment_method)
           SELECT $3, id, $4, $5, $1, $6::payment_method FROM updated
         ) SELECT * FROM updated`,
        [input.amount, input.receivableId, input.shopId, ctx.user.id, input.operationId, input.paymentMethod],
      );
      if (!rows[0]) throw new TRPCError({ code: "BAD_REQUEST", message: "Remboursement impossible : montant ou créance invalide." });
      return rows[0];
    }),
  }),

  expenses: router({
    list: protectedProcedure.input(z.object({ shopId: z.string().uuid(), from: z.coerce.date().optional(), to: z.coerce.date().optional() })).query(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
      const conditions = [eq(expenses.shopId, input.shopId)];
      if (input.from) conditions.push((await import("drizzle-orm")).gte(expenses.spentAt, input.from));
      if (input.to) conditions.push((await import("drizzle-orm")).lte(expenses.spentAt, input.to));
      return getDb().select().from(expenses).where(and(...conditions)).orderBy(desc(expenses.spentAt)).limit(100);
    }),
    create: protectedProcedure.input(z.object({ shopId: z.string().uuid(), category: z.string().trim().min(2).max(120), amount: z.coerce.number().positive(), note: z.string().trim().max(1000).optional(), operationId: z.string().uuid() })).mutation(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
      await assertBusinessDayOpen(input.shopId, new Date());
      const [expense] = await getDb().insert(expenses).values({ ...input, createdBy: ctx.user.id, note: input.note || null }).returning();
      return expense;
    }),
  }),
});
