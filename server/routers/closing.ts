import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { cashClosures } from "../../drizzle/schema";
import { getDb, rawRows } from "../db";
import { closingDifference, formatBusinessDate } from "../lib/closing";
import { protectedProcedure, router } from "../_core/trpc";
import { assertShopAccess } from "./helpers";

const businessDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
type ClosingSummary = { sale_count: number; turnover: number; cash_sales: number; mobile_sales: number; credit_sales: number; cash_repayments: number; mobile_repayments: number; expenses: number; expected_cash: number };

async function summaryFor(shopId: string, date: string) {
  const rows = await rawRows<ClosingSummary>(
    `WITH sale_totals AS (
       SELECT count(*)::int AS sale_count, COALESCE(sum(total), 0) AS turnover,
              COALESCE(sum((payment_breakdown->>'cash')::numeric), 0) AS cash_sales,
              COALESCE(sum((payment_breakdown->>'mobileMoney')::numeric), 0) AS mobile_sales,
              COALESCE(sum(credit_amount), 0) AS credit_sales
       FROM sales WHERE shop_id = $1 AND status = 'completed' AND sold_at::date = $2::date
     ), repayment_totals AS (
       SELECT COALESCE(sum(amount) FILTER (WHERE payment_method = 'cash'), 0) AS cash_repayments,
              COALESCE(sum(amount) FILTER (WHERE payment_method = 'mobile_money'), 0) AS mobile_repayments
       FROM repayments WHERE shop_id = $1 AND paid_at::date = $2::date
     ), expense_totals AS (
       SELECT COALESCE(sum(amount), 0) AS expenses FROM expenses WHERE shop_id = $1 AND spent_at::date = $2::date
     )
     SELECT sale_count, turnover, cash_sales, mobile_sales, credit_sales, cash_repayments, mobile_repayments, expenses,
            cash_sales + cash_repayments - expenses AS expected_cash
     FROM sale_totals CROSS JOIN repayment_totals CROSS JOIN expense_totals`,
    [shopId, date],
  );
  const result = rows[0] ?? { sale_count: 0, turnover: 0, cash_sales: 0, mobile_sales: 0, credit_sales: 0, cash_repayments: 0, mobile_repayments: 0, expenses: 0, expected_cash: 0 };
  return Object.fromEntries(Object.entries(result).map(([key, value]) => [key, Number(value ?? 0)])) as Record<keyof ClosingSummary, number>;
}

export const closingRouter = router({
  preview: protectedProcedure.input(z.object({ shopId: z.string().uuid(), businessDate: businessDate.default(() => formatBusinessDate(new Date())) })).query(async ({ ctx, input }) => {
    await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
    const summary = await summaryFor(input.shopId, input.businessDate);
    const [existing] = await getDb().select().from(cashClosures).where(and(eq(cashClosures.shopId, input.shopId), eq(cashClosures.businessDate, input.businessDate))).limit(1);
    return { businessDate: input.businessDate, ...summary, closure: existing ?? null };
  }),
  list: protectedProcedure.input(z.object({ shopId: z.string().uuid() })).query(async ({ ctx, input }) => {
    await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
    return getDb().select().from(cashClosures).where(eq(cashClosures.shopId, input.shopId)).orderBy(desc(cashClosures.businessDate)).limit(31);
  }),
  close: protectedProcedure.input(z.object({ shopId: z.string().uuid(), businessDate, declaredCash: z.coerce.number().min(0) })).mutation(async ({ ctx, input }) => {
    await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
    const summary = await summaryFor(input.shopId, input.businessDate);
    const difference = closingDifference(summary.expected_cash, input.declaredCash);
    const rows = await rawRows<{ id: string }>(
      `INSERT INTO cash_closures (shop_id, business_date, expected_cash, declared_cash, difference, snapshot, closed_by)
       VALUES ($1, $2::date, $3, $4, $5, $6::jsonb, $7)
       ON CONFLICT (shop_id, business_date) DO NOTHING RETURNING id`,
      [input.shopId, input.businessDate, summary.expected_cash, input.declaredCash, difference, JSON.stringify(summary), ctx.user.id],
    );
    const [closure] = await getDb().select().from(cashClosures).where(and(eq(cashClosures.shopId, input.shopId), eq(cashClosures.businessDate, input.businessDate))).limit(1);
    if (!closure) throw new Error("La fermeture de caisse n’a pas pu être enregistrée.");
    return { closure, summary, replayed: rows.length === 0 };
  }),
});
