import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, ilike } from "drizzle-orm";
import { z } from "zod";
import { customers, products, stockMovements } from "../../drizzle/schema";
import { getDb, rawRows } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { assertShopAccess } from "./helpers";

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
