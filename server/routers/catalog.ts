import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, ilike } from "drizzle-orm";
import { z } from "zod";
import { customers, products, productVariants, stockMovements } from "../../drizzle/schema";
import { getDb, rawRows } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { assertShopAccess } from "./helpers";
import { storagePut } from "../storage";

const productInput = z.object({
  shopId: z.string().uuid(),
  name: z.string().trim().min(1).max(240),
  reference: z.string().trim().max(120).optional(),
  barcode: z.string().trim().max(120).optional(),
  category: z.string().trim().max(120).default("Sans catégorie"),
  unit: z.string().trim().max(24).default("unité"),
  purchasePrice: z.coerce.number().min(0).default(0),
  salePrice: z.coerce.number().min(0),
  wholesalePrice: z.coerce.number().min(0).optional(),
  stockQuantity: z.coerce.number().min(0).default(0),
  alertThreshold: z.coerce.number().min(0).default(5),
});

const variantInput = z.object({
  shopId: z.string().uuid(),
  productId: z.string().uuid(),
  name: z.string().trim().min(1).max(180),
  attributes: z.record(z.string().trim().min(1).max(40), z.string().trim().min(1).max(80)).default({}),
  reference: z.string().trim().max(120).optional(),
  barcode: z.string().trim().max(120).optional(),
  purchasePrice: z.coerce.number().min(0).default(0),
  salePrice: z.coerce.number().min(0),
  stockQuantity: z.coerce.number().min(0).default(0),
  alertThreshold: z.coerce.number().min(0).default(5),
});

function decodeImage(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,([a-zA-Z0-9+/=]+)$/);
  if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "Choisissez une image PNG, JPEG ou WebP valide." });
  const bytes = Buffer.from(match[2]!, "base64");
  if (bytes.length === 0 || bytes.length > 2 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "L’image doit peser au maximum 2 Mo." });
  const extension = match[1] === "image/jpeg" ? "jpg" : match[1]!.slice("image/".length);
  return { bytes, contentType: match[1]!, extension };
}

export const catalogRouter = router({
  products: router({
    list: protectedProcedure.input(z.object({ shopId: z.string().uuid(), search: z.string().trim().max(120).optional() })).query(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId);
      const where = input.search
        ? and(eq(products.shopId, input.shopId), ilike(products.name, `%${input.search}%`))
        : eq(products.shopId, input.shopId);
      return getDb().select().from(products).where(where).orderBy(asc(products.name));
    }),

    create: protectedProcedure.input(productInput).mutation(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
      const [product] = await getDb().insert(products).values({
        ...input,
        reference: input.reference || null,
        barcode: input.barcode || null,
        wholesalePrice: input.wholesalePrice ?? null,
      }).returning();

      if (product.stockQuantity > 0) {
        await getDb().insert(stockMovements).values({
          shopId: input.shopId,
          productId: product.id,
          createdBy: ctx.user.id,
          type: "opening",
          quantityDelta: product.stockQuantity,
          stockAfter: product.stockQuantity,
          reason: "Stock initial",
        });
      }
      return product;
    }),

    update: protectedProcedure.input(productInput.extend({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
      const [product] = await getDb().update(products).set({
        name: input.name,
        reference: input.reference || null,
        barcode: input.barcode || null,
        category: input.category,
        unit: input.unit,
        purchasePrice: input.purchasePrice,
        salePrice: input.salePrice,
        wholesalePrice: input.wholesalePrice ?? null,
        alertThreshold: input.alertThreshold,
        updatedAt: new Date(),
      }).where(and(eq(products.id, input.id), eq(products.shopId, input.shopId))).returning();
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Produit introuvable." });
      return product;
    }),

    adjust: protectedProcedure.input(z.object({ shopId: z.string().uuid(), productId: z.string().uuid(), delta: z.coerce.number().refine(value => value !== 0), kind: z.enum(["restock", "adjustment"]).default("adjustment"), reason: z.string().trim().min(2).max(240) })).mutation(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
      const rows = await rawRows<{ stock_after: number }>(
        `WITH changed AS (
           UPDATE products SET stock_quantity = stock_quantity + $1, updated_at = now()
           WHERE id = $2 AND shop_id = $3 AND stock_quantity + $1 >= 0
           RETURNING id, stock_quantity
         )
         INSERT INTO stock_movements (shop_id, product_id, created_by, type, quantity_delta, stock_after, reason)
         SELECT $3, id, $4, $6::stock_movement_type, $1, stock_quantity, $5 FROM changed
         RETURNING stock_after`,
        [input.delta, input.productId, input.shopId, ctx.user.id, input.reason, input.kind],
      );
      if (!rows[0]) throw new TRPCError({ code: "BAD_REQUEST", message: "Ajustement impossible : stock insuffisant ou produit introuvable." });
      return rows[0];
    }),

    movements: protectedProcedure.input(z.object({ shopId: z.string().uuid(), productId: z.string().uuid().optional() })).query(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId);
      const where = input.productId
        ? and(eq(stockMovements.shopId, input.shopId), eq(stockMovements.productId, input.productId))
        : eq(stockMovements.shopId, input.shopId);
      return getDb().select().from(stockMovements).where(where).orderBy(desc(stockMovements.createdAt)).limit(100);
    }),
    uploadPhoto: protectedProcedure.input(z.object({ shopId: z.string().uuid(), targetId: z.string().uuid(), target: z.enum(["product", "variant"]), dataUrl: z.string().max(3_000_000) })).mutation(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
      const db = getDb();
      const target = input.target === "product"
        ? (await db.select({ id: products.id }).from(products).where(and(eq(products.id, input.targetId), eq(products.shopId, input.shopId))).limit(1))[0]
        : (await db.select({ id: productVariants.id }).from(productVariants).where(and(eq(productVariants.id, input.targetId), eq(productVariants.shopId, input.shopId))).limit(1))[0];
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "Élément du catalogue introuvable." });
      const image = decodeImage(input.dataUrl);
      const stored = await storagePut(`shops/${input.shopId}/catalog/${input.target}/${input.targetId}.${image.extension}`, image.bytes, image.contentType);
      if (input.target === "product") await db.update(products).set({ photoUrl: stored.url, updatedAt: new Date() }).where(eq(products.id, input.targetId));
      else await db.update(productVariants).set({ photoUrl: stored.url, updatedAt: new Date() }).where(eq(productVariants.id, input.targetId));
      return stored;
    }),
  }),

  variants: router({
    list: protectedProcedure.input(z.object({ shopId: z.string().uuid(), productId: z.string().uuid().optional() })).query(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId);
      const where = input.productId ? and(eq(productVariants.shopId, input.shopId), eq(productVariants.productId, input.productId)) : eq(productVariants.shopId, input.shopId);
      return getDb().select().from(productVariants).where(where).orderBy(asc(productVariants.name));
    }),
    create: protectedProcedure.input(variantInput).mutation(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
      const db = getDb();
      const [parent] = await db.select({ id: products.id }).from(products).where(and(eq(products.id, input.productId), eq(products.shopId, input.shopId))).limit(1);
      if (!parent) throw new TRPCError({ code: "NOT_FOUND", message: "Produit parent introuvable." });
      const [variant] = await db.insert(productVariants).values({ ...input, reference: input.reference || null, barcode: input.barcode || null }).returning();
      if (variant.stockQuantity > 0) await db.insert(stockMovements).values({ shopId: input.shopId, productId: input.productId, productVariantId: variant.id, createdBy: ctx.user.id, type: "opening", quantityDelta: variant.stockQuantity, stockAfter: variant.stockQuantity, reason: "Stock initial de variante" });
      return variant;
    }),
    adjust: protectedProcedure.input(z.object({ shopId: z.string().uuid(), variantId: z.string().uuid(), delta: z.coerce.number().refine(value => value !== 0), kind: z.enum(["restock", "adjustment"]).default("adjustment"), reason: z.string().trim().min(2).max(240) })).mutation(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
      const rows = await rawRows<{ stock_after: number }>(
        `WITH changed AS (
           UPDATE product_variants SET stock_quantity = stock_quantity + $1, updated_at = now()
           WHERE id = $2 AND shop_id = $3 AND stock_quantity + $1 >= 0
           RETURNING id, product_id, stock_quantity
         )
         INSERT INTO stock_movements (shop_id, product_id, product_variant_id, created_by, type, quantity_delta, stock_after, reason)
         SELECT $3, product_id, id, $4, $6::stock_movement_type, $1, stock_quantity, $5 FROM changed
         RETURNING stock_after`,
        [input.delta, input.variantId, input.shopId, ctx.user.id, input.reason, input.kind],
      );
      if (!rows[0]) throw new TRPCError({ code: "BAD_REQUEST", message: "Ajustement impossible : stock insuffisant ou variante introuvable." });
      return rows[0];
    }),
  }),

  customers: router({
    list: protectedProcedure.input(z.object({ shopId: z.string().uuid() })).query(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId);
      return getDb().select().from(customers).where(eq(customers.shopId, input.shopId)).orderBy(asc(customers.name));
    }),
    create: protectedProcedure.input(z.object({ shopId: z.string().uuid(), name: z.string().trim().min(2).max(180), phone: z.string().trim().max(48).optional(), note: z.string().trim().max(1000).optional() })).mutation(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId);
      const [customer] = await getDb().insert(customers).values({ ...input, phone: input.phone || null, note: input.note || null }).returning();
      return customer;
    }),
  }),
});
