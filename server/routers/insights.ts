import { z } from "zod";
import { getSql } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { assertShopAccess } from "./helpers";

const numberValue = (value: unknown) => Number(value ?? 0);
const percentChange = (current: number, previous: number) => previous === 0 ? null : ((current - previous) / Math.abs(previous)) * 100;
const reportInput = z.object({
  shopId: z.string().uuid(),
  from: z.coerce.date(),
  to: z.coerce.date(),
  granularity: z.enum(["day", "week"]).default("day"),
}).superRefine((value, ctx) => {
  const span = value.to.valueOf() - value.from.valueOf();
  if (span < 0) ctx.addIssue({ code: "custom", message: "La date de début doit précéder la date de fin." });
  if (span > 366 * 24 * 60 * 60 * 1000) ctx.addIssue({ code: "custom", message: "La période de rapport ne peut pas dépasser 366 jours." });
});

export const insightsRouter = router({
  dashboard: protectedProcedure.input(z.object({ shopId: z.string().uuid() })).query(async ({ ctx, input }) => {
    await assertShopAccess(ctx.user.id, input.shopId);
    const sql = getSql();
    const [totals, lowStock, debts, trend, lowStockItems, overdueReceivables] = await sql.transaction([
      sql`SELECT COALESCE(SUM(total) FILTER (WHERE sold_at::date = CURRENT_DATE), 0) AS sales_today,
                 COALESCE(SUM(total) FILTER (WHERE sold_at::date = CURRENT_DATE - INTERVAL '1 day'), 0) AS sales_yesterday,
                 COALESCE(SUM((payment_breakdown->>'cash')::numeric) FILTER (WHERE sold_at::date = CURRENT_DATE), 0) AS cash_today,
                 COALESCE(SUM((payment_breakdown->>'mobileMoney')::numeric) FILTER (WHERE sold_at::date = CURRENT_DATE), 0) AS mobile_today
          FROM sales WHERE shop_id = ${input.shopId} AND status = 'completed'`,
      sql`SELECT count(*)::int AS count FROM products WHERE shop_id = ${input.shopId} AND is_active = true AND stock_quantity <= alert_threshold`,
      sql`SELECT COALESCE(SUM(balance), 0) AS outstanding FROM receivables WHERE shop_id = ${input.shopId} AND is_settled = false`,
      sql`SELECT to_char(day, 'Dy') AS label, COALESCE(SUM(s.total), 0) AS value
          FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day') AS day
          LEFT JOIN sales s ON s.shop_id = ${input.shopId} AND s.status = 'completed' AND s.sold_at::date = day::date
          GROUP BY day ORDER BY day`,
      sql`SELECT id, name, stock_quantity, alert_threshold FROM products
          WHERE shop_id = ${input.shopId} AND is_active = true AND stock_quantity <= alert_threshold
          ORDER BY stock_quantity ASC, name ASC LIMIT 5`,
      sql`SELECT r.id, c.name AS customer_name, r.balance, r.due_date FROM receivables r
          JOIN customers c ON c.id = r.customer_id
          WHERE r.shop_id = ${input.shopId} AND r.is_settled = false AND r.due_date IS NOT NULL AND r.due_date < now()
          ORDER BY r.due_date ASC LIMIT 5`,
    ]) as unknown as Record<string, unknown>[][];
    return {
      salesToday: numberValue(totals[0]?.sales_today),
      salesYesterday: numberValue(totals[0]?.sales_yesterday),
      cashToday: numberValue(totals[0]?.cash_today),
      mobileToday: numberValue(totals[0]?.mobile_today),
      lowStockCount: numberValue(lowStock[0]?.count),
      outstandingReceivables: numberValue(debts[0]?.outstanding),
      trend: trend.map((row: Record<string, unknown>) => ({ label: String(row.label), value: numberValue(row.value) })),
      lowStockItems: lowStockItems.map((row: Record<string, unknown>) => ({ id: String(row.id), name: String(row.name), stockQuantity: numberValue(row.stock_quantity), alertThreshold: numberValue(row.alert_threshold) })),
      overdueReceivables: overdueReceivables.map((row: Record<string, unknown>) => ({ id: String(row.id), customerName: String(row.customer_name), balance: numberValue(row.balance), dueDate: new Date(String(row.due_date)) })),
    };
  }),

  report: protectedProcedure.input(reportInput).query(async ({ ctx, input }) => {
    await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
    const sql = getSql();
    const periodDuration = input.to.valueOf() - input.from.valueOf() + 1;
    const previousFrom = new Date(input.from.valueOf() - periodDuration);
    const previousTo = new Date(input.from.valueOf() - 1);
    const timelineQuery = input.granularity === "week"
      ? sql`WITH periods AS (
          SELECT date_trunc('week', bucket)::date AS start_at
          FROM generate_series(date_trunc('week', ${input.from}::timestamptz), date_trunc('week', ${input.to}::timestamptz), interval '1 week') AS bucket
        )
        SELECT to_char(start_at, 'DD Mon') AS label, start_at,
               COALESCE(s.turnover, 0) AS turnover, COALESCE(s.sale_count, 0)::int AS sale_count,
               COALESCE(e.expenses, 0) AS expenses
        FROM periods
        LEFT JOIN LATERAL (
          SELECT SUM(total) AS turnover, COUNT(*) AS sale_count FROM sales
          WHERE shop_id = ${input.shopId} AND status = 'completed' AND sold_at >= periods.start_at AND sold_at < periods.start_at + interval '1 week'
        ) s ON true
        LEFT JOIN LATERAL (
          SELECT SUM(amount) AS expenses FROM expenses
          WHERE shop_id = ${input.shopId} AND spent_at >= periods.start_at AND spent_at < periods.start_at + interval '1 week'
        ) e ON true
        ORDER BY start_at`
      : sql`WITH periods AS (
          SELECT bucket::date AS start_at FROM generate_series(${input.from}::date, ${input.to}::date, interval '1 day') AS bucket
        )
        SELECT to_char(start_at, 'DD Mon') AS label, start_at,
               COALESCE(s.turnover, 0) AS turnover, COALESCE(s.sale_count, 0)::int AS sale_count,
               COALESCE(e.expenses, 0) AS expenses
        FROM periods
        LEFT JOIN LATERAL (
          SELECT SUM(total) AS turnover, COUNT(*) AS sale_count FROM sales
          WHERE shop_id = ${input.shopId} AND status = 'completed' AND sold_at >= periods.start_at AND sold_at < periods.start_at + interval '1 day'
        ) s ON true
        LEFT JOIN LATERAL (
          SELECT SUM(amount) AS expenses FROM expenses
          WHERE shop_id = ${input.shopId} AND spent_at >= periods.start_at AND spent_at < periods.start_at + interval '1 day'
        ) e ON true
        ORDER BY start_at`;
    const [summary, expenseSummary, previousSummary, previousExpenseSummary, topProducts, expenseCategories, timeline] = await sql.transaction([
      sql`SELECT COALESCE(SUM(s.total), 0) AS turnover,
                 COALESCE(SUM(s.total - si.purchase_price * si.quantity), 0) AS gross_margin,
                 COUNT(DISTINCT s.id)::int AS sale_count,
                 COALESCE(AVG(s.total), 0) AS average_ticket,
                 COALESCE(SUM(s.credit_amount), 0) AS credit_amount
          FROM sales s LEFT JOIN sale_items si ON si.sale_id = s.id
          WHERE s.shop_id = ${input.shopId} AND s.status = 'completed' AND s.sold_at >= ${input.from} AND s.sold_at <= ${input.to}`,
      sql`SELECT COALESCE(SUM(amount), 0) AS expenses, COUNT(*)::int AS expense_count FROM expenses
          WHERE shop_id = ${input.shopId} AND spent_at >= ${input.from} AND spent_at <= ${input.to}`,
      sql`SELECT COALESCE(SUM(s.total), 0) AS turnover,
                 COALESCE(SUM(s.total - si.purchase_price * si.quantity), 0) AS gross_margin,
                 COUNT(DISTINCT s.id)::int AS sale_count
          FROM sales s LEFT JOIN sale_items si ON si.sale_id = s.id
          WHERE s.shop_id = ${input.shopId} AND s.status = 'completed' AND s.sold_at >= ${previousFrom} AND s.sold_at <= ${previousTo}`,
      sql`SELECT COALESCE(SUM(amount), 0) AS expenses FROM expenses
          WHERE shop_id = ${input.shopId} AND spent_at >= ${previousFrom} AND spent_at <= ${previousTo}`,
      sql`SELECT si.product_name AS name, SUM(si.quantity) AS quantity, SUM(si.line_total) AS revenue
          FROM sale_items si JOIN sales s ON s.id = si.sale_id
          WHERE s.shop_id = ${input.shopId} AND s.status = 'completed' AND s.sold_at >= ${input.from} AND s.sold_at <= ${input.to}
          GROUP BY si.product_name ORDER BY revenue DESC LIMIT 10`,
      sql`SELECT category, SUM(amount) AS amount FROM expenses
          WHERE shop_id = ${input.shopId} AND spent_at >= ${input.from} AND spent_at <= ${input.to}
          GROUP BY category ORDER BY amount DESC LIMIT 5`,
      timelineQuery,
    ]) as unknown as Record<string, unknown>[][];
    const turnover = numberValue(summary[0]?.turnover);
    const grossMargin = numberValue(summary[0]?.gross_margin);
    const expenses = numberValue(expenseSummary[0]?.expenses);
    const previousTurnover = numberValue(previousSummary[0]?.turnover);
    const previousGrossMargin = numberValue(previousSummary[0]?.gross_margin);
    const previousExpenses = numberValue(previousExpenseSummary[0]?.expenses);
    const operatingResult = grossMargin - expenses;
    const previousOperatingResult = previousGrossMargin - previousExpenses;
    return {
      turnover,
      grossMargin,
      saleCount: numberValue(summary[0]?.sale_count),
      averageTicket: numberValue(summary[0]?.average_ticket),
      expenses,
      expenseCount: numberValue(expenseSummary[0]?.expense_count),
      creditAmount: numberValue(summary[0]?.credit_amount),
      operatingResult,
      previous: {
        turnover: previousTurnover,
        grossMargin: previousGrossMargin,
        expenses: previousExpenses,
        operatingResult: previousOperatingResult,
      },
      changes: {
        turnover: percentChange(turnover, previousTurnover),
        grossMargin: percentChange(grossMargin, previousGrossMargin),
        expenses: percentChange(expenses, previousExpenses),
        operatingResult: percentChange(operatingResult, previousOperatingResult),
      },
      topProducts: topProducts.map((row: Record<string, unknown>) => ({ name: String(row.name), quantity: numberValue(row.quantity), revenue: numberValue(row.revenue) })),
      expenseCategories: expenseCategories.map((row: Record<string, unknown>) => ({ category: String(row.category), amount: numberValue(row.amount) })),
      timeline: timeline.map((row: Record<string, unknown>) => ({ label: String(row.label), startAt: new Date(String(row.start_at)), turnover: numberValue(row.turnover), expenses: numberValue(row.expenses), saleCount: numberValue(row.sale_count) })),
    };
  }),
});
