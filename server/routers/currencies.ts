import { TRPCError } from "@trpc/server";
import { and, desc, eq, lte } from "drizzle-orm";
import { z } from "zod";
import { exchangeRates, shopCurrencies, shops } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { assertShopAccess } from "./helpers";

export const supportedCurrencies = ["XAF", "XOF", "NGN", "GHS", "CDF", "KES", "USD", "EUR"] as const;
const currencyCode = z.string().trim().toUpperCase().refine((value): value is (typeof supportedCurrencies)[number] => supportedCurrencies.includes(value as (typeof supportedCurrencies)[number]), "Devise non prise en charge.");
const shopInput = z.object({ shopId: z.string().uuid() });

async function getBaseCurrency(shopId: string) {
  const [shop] = await getDb().select({ currency: shops.currency }).from(shops).where(eq(shops.id, shopId)).limit(1);
  if (!shop) throw new TRPCError({ code: "NOT_FOUND", message: "Boutique introuvable." });
  return shop.currency;
}

export const currenciesRouter = router({
  settings: protectedProcedure.input(shopInput).query(async ({ ctx, input }) => {
    await assertShopAccess(ctx.user.id, input.shopId);
    const baseCurrency = await getBaseCurrency(input.shopId);
    const currencies = await getDb().select().from(shopCurrencies).where(eq(shopCurrencies.shopId, input.shopId));
    return { baseCurrency, supportedCurrencies, currencies: [{ id: "base", shopId: input.shopId, currency: baseCurrency, label: "Devise de référence", isActive: true, createdAt: new Date(), updatedAt: new Date() }, ...currencies.filter((entry) => entry.currency !== baseCurrency)] };
  }),
  rates: protectedProcedure.input(shopInput.extend({ currency: currencyCode.optional() })).query(async ({ ctx, input }) => {
    await assertShopAccess(ctx.user.id, input.shopId);
    const conditions = [eq(exchangeRates.shopId, input.shopId)];
    if (input.currency) conditions.push(eq(exchangeRates.currency, input.currency));
    return getDb().select().from(exchangeRates).where(and(...conditions)).orderBy(desc(exchangeRates.effectiveAt)).limit(100);
  }),
  setCurrency: protectedProcedure.input(shopInput.extend({ currency: currencyCode, label: z.string().trim().max(80).optional(), isActive: z.boolean().default(true) })).mutation(async ({ ctx, input }) => {
    await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
    const baseCurrency = await getBaseCurrency(input.shopId);
    if (input.currency === baseCurrency && !input.isActive) throw new TRPCError({ code: "BAD_REQUEST", message: "La devise de référence doit rester active." });
    const [currency] = await getDb().insert(shopCurrencies).values({ shopId: input.shopId, currency: input.currency, label: input.label || null, isActive: input.isActive }).onConflictDoUpdate({ target: [shopCurrencies.shopId, shopCurrencies.currency], set: { label: input.label || null, isActive: input.isActive, updatedAt: new Date() } }).returning();
    return currency;
  }),
  setRate: protectedProcedure.input(shopInput.extend({ currency: currencyCode, rateToBase: z.coerce.number().positive().max(1_000_000_000), effectiveAt: z.coerce.date().optional(), note: z.string().trim().max(240).optional() })).mutation(async ({ ctx, input }) => {
    await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
    const db = getDb(); const baseCurrency = await getBaseCurrency(input.shopId);
    if (input.currency !== baseCurrency) {
      const [currency] = await db.select({ id: shopCurrencies.id, isActive: shopCurrencies.isActive }).from(shopCurrencies).where(and(eq(shopCurrencies.shopId, input.shopId), eq(shopCurrencies.currency, input.currency))).limit(1);
      if (!currency?.isActive) throw new TRPCError({ code: "BAD_REQUEST", message: "Activez cette devise avant de définir son taux." });
    }
    const [rate] = await db.insert(exchangeRates).values({ shopId: input.shopId, currency: input.currency, rateToBase: input.currency === baseCurrency ? 1 : input.rateToBase, effectiveAt: input.effectiveAt ?? new Date(), note: input.note || null, createdBy: ctx.user.id }).returning();
    return rate;
  }),
  quote: protectedProcedure.input(shopInput.extend({ currency: currencyCode, at: z.coerce.date().optional() })).query(async ({ ctx, input }) => {
    await assertShopAccess(ctx.user.id, input.shopId);
    const baseCurrency = await getBaseCurrency(input.shopId);
    if (input.currency === baseCurrency) return { baseCurrency, currency: input.currency, rateToBase: 1, effectiveAt: input.at ?? new Date() };
    const [currency] = await getDb().select({ isActive: shopCurrencies.isActive }).from(shopCurrencies).where(and(eq(shopCurrencies.shopId, input.shopId), eq(shopCurrencies.currency, input.currency))).limit(1);
    if (!currency?.isActive) throw new TRPCError({ code: "BAD_REQUEST", message: "Cette devise n’est pas activée pour la boutique." });
    const [rate] = await getDb().select().from(exchangeRates).where(and(eq(exchangeRates.shopId, input.shopId), eq(exchangeRates.currency, input.currency), lte(exchangeRates.effectiveAt, input.at ?? new Date()))).orderBy(desc(exchangeRates.effectiveAt)).limit(1);
    if (!rate) throw new TRPCError({ code: "BAD_REQUEST", message: "Définissez un taux de conversion avant d’encaisser dans cette devise." });
    return { baseCurrency, currency: input.currency, rateToBase: rate.rateToBase, effectiveAt: rate.effectiveAt, rateId: rate.id };
  }),
});
