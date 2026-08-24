import { COOKIE_NAME } from "@shared/const";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { shopMembers, shops, users } from "../drizzle/schema";
import { getDb, getSql, getUserByEmail, listUserShops } from "./db";
import { protectedProcedure, router } from "./_core/trpc";
import { authRouter } from "./routers/auth";
import { catalogRouter } from "./routers/catalog";
import { commerceRouter } from "./routers/commerce";
import { assertShopAccess, makeShopSlug } from "./routers/helpers";
import { insightsRouter } from "./routers/insights";

export const appRouter = router({
  auth: authRouter,
  catalog: catalogRouter,
  commerce: commerceRouter,
  insights: insightsRouter,
  shops: router({
    list: protectedProcedure.query(({ ctx }) => listUserShops(ctx.user.id)),
    create: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(180), currency: z.enum(["XAF", "XOF", "NGN"]).default("XAF"), country: z.string().trim().length(3).default("CMR") })).mutation(async ({ ctx, input }) => {
      const shopId = crypto.randomUUID();
      const sql = getSql();
      await sql.transaction([
        sql`INSERT INTO shops (id, name, slug, currency, country, created_by) VALUES (${shopId}, ${input.name}, ${makeShopSlug(input.name)}, ${input.currency}, ${input.country.toUpperCase()}, ${ctx.user.id})`,
        sql`INSERT INTO shop_members (shop_id, user_id, role) VALUES (${shopId}, ${ctx.user.id}, 'owner')`,
      ]);
      return (await getDb().select().from(shops).where(eq(shops.id, shopId)).limit(1))[0];
    }),
    memberRole: protectedProcedure.input(z.object({ shopId: z.string().uuid() })).query(({ ctx, input }) => assertShopAccess(ctx.user.id, input.shopId)),
    members: protectedProcedure.input(z.object({ shopId: z.string().uuid() })).query(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
      return getDb().select({ id: users.id, name: users.name, email: users.email, role: shopMembers.role }).from(shopMembers).innerJoin(users, eq(shopMembers.userId, users.id)).where(eq(shopMembers.shopId, input.shopId));
    }),
    addMember: protectedProcedure.input(z.object({ shopId: z.string().uuid(), email: z.string().email(), role: z.enum(["manager", "seller"]) })).mutation(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId, ["owner"]);
      const member = await getUserByEmail(input.email);
      if (!member) throw new Error("Ce collaborateur doit créer son compte EASYSTOR avant d’être ajouté.");
      await getDb().insert(shopMembers).values({ shopId: input.shopId, userId: member.id, role: input.role }).onConflictDoUpdate({ target: [shopMembers.shopId, shopMembers.userId], set: { role: input.role } });
      return { id: member.id, email: member.email, role: input.role };
    }),
  }),
});

export type AppRouter = typeof appRouter;
