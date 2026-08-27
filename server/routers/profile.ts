import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
  expenses,
  sales,
  shopCurrencies,
  shops,
  users,
} from "../../drizzle/schema";
import { getDb, getShopById, getSql, hasOptionalColumn } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { assertShopAccess } from "./helpers";
import {
  configurableCountries,
  currencyForCountry,
} from "../lib/shopConfiguration";
import { storagePut } from "../storage";

const profileInput = z.object({ shopId: z.string().uuid() });
const countryCode = z.enum(configurableCountries);
const phone = z
  .string()
  .regex(/^\+[1-9]\d{5,14}$/)
  .nullable();
const logoDataUrl = z.string().max(3_000_000).nullable();

function decodeLogo(dataUrl: string) {
  const match = dataUrl.match(
    /^data:(image\/(?:png|jpeg|webp));base64,([a-zA-Z0-9+/=]+)$/
  );
  if (!match)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Choisissez un logo PNG, JPEG ou WebP valide.",
    });
  const bytes = Buffer.from(match[2]!, "base64");
  if (bytes.length === 0 || bytes.length > 2 * 1024 * 1024)
    throw new TRPCError({
      code: "PAYLOAD_TOO_LARGE",
      message: "Le logo doit peser au maximum 2 Mo.",
    });
  return {
    bytes,
    contentType: match[1]!,
    extension:
      match[1] === "image/jpeg" ? "jpg" : match[1]!.slice("image/".length),
  };
}

export const profileRouter = router({
  settings: protectedProcedure
    .input(profileInput)
    .query(async ({ ctx, input }) => {
      const membership = await assertShopAccess(ctx.user.id, input.shopId);
      const db = getDb();
      const hasPhone = await hasOptionalColumn("users", "phone");
      const [user] = hasPhone
        ? await db
            .select({
              name: users.name,
              email: users.email,
              phone: users.phone,
            })
            .from(users)
            .where(eq(users.id, ctx.user.id))
            .limit(1)
        : await db
            .select({
              name: users.name,
              email: users.email,
              phone: sql<string | null>`NULL`,
            })
            .from(users)
            .where(eq(users.id, ctx.user.id))
            .limit(1);
      const shop = await getShopById(input.shopId);
      if (!user || !shop)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Profil introuvable.",
        });
      return { user, shop, canEditShopSettings: membership.role === "owner" };
    }),
  update: protectedProcedure
    .input(
      profileInput.extend({
        phone: phone.optional(),
        country: countryCode.optional(),
        name: z
          .string()
          .trim()
          .min(2, "Le nom de la boutique doit contenir au moins 2 caractères.")
          .max(120)
          .optional(),
        logoDataUrl: logoDataUrl.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await assertShopAccess(ctx.user.id, input.shopId);
      const db = getDb();
      const [shop, hasPhone, hasLogo] = await Promise.all([
        getShopById(input.shopId),
        hasOptionalColumn("users", "phone"),
        hasOptionalColumn("shops", "logo_url"),
      ]);
      if (!shop)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Boutique introuvable.",
        });
      if (
        (input.country || input.name || input.logoDataUrl !== undefined) &&
        membership.role !== "owner"
      )
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Seul le propriétaire peut modifier le nom, le logo, le pays et la devise de référence.",
        });

      const nextCurrency = input.country
        ? currencyForCountry(input.country)
        : shop.currency;
      if (input.country && nextCurrency !== shop.currency) {
        const [sale] = await db
          .select({ id: sales.id })
          .from(sales)
          .where(eq(sales.shopId, input.shopId))
          .limit(1);
        const [expense] = await db
          .select({ id: expenses.id })
          .from(expenses)
          .where(eq(expenses.shopId, input.shopId))
          .limit(1);
        if (sale || expense)
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "La devise de référence ne peut plus être modifiée après une vente ou une dépense. Ajoutez plutôt une devise dans « Devises & taux ».",
          });
      }

      const sql = getSql();
      const statements = [];
      let nextLogoUrl = shop.logoUrl;
      if (input.logoDataUrl !== undefined) {
        if (!hasLogo)
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "Le logo sera disponible dès que la migration de votre boutique aura été appliquée.",
          });
        if (input.logoDataUrl === null) {
          nextLogoUrl = null;
        } else {
          const logo = decodeLogo(input.logoDataUrl);
          const stored = await storagePut(
            `shops/${input.shopId}/branding/logo.${logo.extension}`,
            logo.bytes,
            logo.contentType
          );
          nextLogoUrl = stored.url;
        }
        statements.push(
          sql`UPDATE shops SET logo_url = ${nextLogoUrl}, updated_at = NOW() WHERE id = ${input.shopId}`
        );
      }
      if (input.phone !== undefined) {
        if (!hasPhone)
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "Le téléphone sera disponible dès que la migration de votre boutique aura été appliquée.",
          });
        statements.push(
          sql`UPDATE users SET phone = ${input.phone}, updated_at = NOW() WHERE id = ${ctx.user.id}`
        );
      }
      if (input.name)
        statements.push(
          sql`UPDATE shops SET name = ${input.name}, updated_at = NOW() WHERE id = ${input.shopId}`
        );
      if (input.country) {
        statements.push(
          sql`UPDATE shops SET country = ${input.country}, currency = ${nextCurrency}, updated_at = NOW() WHERE id = ${input.shopId}`
        );
        statements.push(
          sql`INSERT INTO shop_currencies (shop_id, currency, label, is_active) VALUES (${input.shopId}, ${nextCurrency}, 'Devise de référence', true) ON CONFLICT (shop_id, currency) DO UPDATE SET is_active = true, label = 'Devise de référence', updated_at = NOW()`
        );
        if (shop.currency !== nextCurrency)
          statements.push(
            sql`UPDATE shop_currencies SET is_active = true, label = 'Devise de transaction', updated_at = NOW() WHERE shop_id = ${input.shopId} AND currency = ${shop.currency}`
          );
      }
      if (statements.length) await sql.transaction(statements);
      return {
        name: input.name ?? shop.name,
        logoUrl: nextLogoUrl,
        phone: input.phone,
        country: input.country ?? shop.country,
        currency: nextCurrency,
      };
    }),
});
