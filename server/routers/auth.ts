import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { shopMembers, shops, users } from "../../drizzle/schema";
import { clearSessionCookie, hashPassword, verifyPassword, writeSessionCookie } from "../auth";
import { getDb, getUserByEmail, getUserById, getSql, listUserShops } from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { makeShopSlug } from "./helpers";

const registerInput = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(320),
  password: z.string().min(10).max(160),
  shopName: z.string().trim().min(2).max(180),
  currency: z.enum(["XAF", "XOF", "NGN"]).default("XAF"),
  country: z.string().trim().length(3).default("CMR"),
});

export const authRouter = router({
  me: publicProcedure.query(({ ctx }) => ctx.user),

  register: publicProcedure.input(registerInput).mutation(async ({ ctx, input }) => {
    const email = input.email.toLowerCase();
    if (await getUserByEmail(email)) {
      throw new TRPCError({ code: "CONFLICT", message: "Un compte existe déjà avec cet e-mail." });
    }

    const userId = crypto.randomUUID();
    const shopId = crypto.randomUUID();
    const passwordHash = await hashPassword(input.password);
    const shopSlug = makeShopSlug(input.shopName);
    const sql = getSql();

    await sql.transaction([
      sql`INSERT INTO users (id, name, email, password_hash, login_method) VALUES (${userId}, ${input.name}, ${email}, ${passwordHash}, 'password')`,
      sql`INSERT INTO shops (id, name, slug, currency, country, created_by) VALUES (${shopId}, ${input.shopName}, ${shopSlug}, ${input.currency}, ${input.country.toUpperCase()}, ${userId})`,
      sql`INSERT INTO shop_members (shop_id, user_id, role) VALUES (${shopId}, ${userId}, 'owner')`,
    ]);

    await writeSessionCookie(ctx.req, ctx.res, userId);
    const user = await getUserById(userId);
    const shop = (await getDb().select().from(shops).where(eq(shops.id, shopId)).limit(1))[0];
    return { user, shop, role: "owner" as const };
  }),

  login: publicProcedure.input(z.object({ email: z.string().email(), password: z.string().min(1) })).mutation(async ({ ctx, input }) => {
    const user = await getUserByEmail(input.email.toLowerCase());
    if (!user?.passwordHash || !user.isActive || !(await verifyPassword(input.password, user.passwordHash))) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Identifiants invalides." });
    }

    await getDb().update(users).set({ lastSignedIn: new Date(), updatedAt: new Date() }).where(eq(users.id, user.id));
    await writeSessionCookie(ctx.req, ctx.res, user.id);
    return { user: await getUserById(user.id), shops: await listUserShops(user.id) };
  }),

  logout: publicProcedure.mutation(({ ctx }) => {
    clearSessionCookie(ctx.req, ctx.res);
    return { success: true } as const;
  }),
});
