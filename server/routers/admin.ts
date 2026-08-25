import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
  adminAuditLogs,
  sales,
  shopMembers,
  shops,
  users,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";

const listInput = z.object({
  query: z.string().trim().max(120).default(""),
  status: z.enum(["all", "active", "suspended"]).default("all"),
  limit: z.number().int().min(1).max(100).default(40),
});

async function writeAuditLog(
  actorId: string,
  action: string,
  targetType: string,
  targetId: string | null,
  metadata: Record<string, unknown> = {}
) {
  await getDb().insert(adminAuditLogs).values({
    actorId,
    action,
    targetType,
    targetId,
    metadata,
  });
}

async function getActiveAdminCount() {
  const [result] = await getDb()
    .select({ value: sql<number>`count(*)` })
    .from(users)
    .where(and(eq(users.role, "admin"), eq(users.isActive, true)));
  return Number(result?.value ?? 0);
}

export const adminRouter = router({
  bootstrapStatus: protectedProcedure.query(async () => {
    const [result] = await getDb()
      .select({ value: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "admin"));
    return { available: Number(result?.value ?? 0) === 0 };
  }),

  /**
   * Le premier compte connecté peut réclamer l’administration une seule fois,
   * tant qu’aucun administrateur n’existe. Les accès ultérieurs sont toujours
   * contrôlés par adminProcedure côté serveur.
   */
  claimInitialAccess: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role === "admin") return { role: "admin" as const };

    const [existingAdmin] = await getDb()
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "admin"))
      .limit(1);

    if (existingAdmin) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "L’administration SaaS est déjà configurée.",
      });
    }

    const claimed = await getDb()
      .update(users)
      .set({ role: "admin", updatedAt: new Date() })
      .where(
        and(
          eq(users.id, ctx.user.id),
          sql`NOT EXISTS (SELECT 1 FROM "users" AS "existing_admin" WHERE "existing_admin"."role" = 'admin')`
        )
      )
      .returning({ id: users.id });
    if (!claimed[0]) {
      throw new TRPCError({
        code: "CONFLICT",
        message:
          "L’administration SaaS vient d’être configurée par un autre compte.",
      });
    }
    await writeAuditLog(
      ctx.user.id,
      "initial_admin_claimed",
      "user",
      ctx.user.id
    );

    return { role: "admin" as const };
  }),

  overview: adminProcedure.query(async () => {
    const db = getDb();
    const [[userStats], [shopStats], [salesStats], [auditStats]] =
      await Promise.all([
        db
          .select({
            total: sql<number>`count(*)`,
            active: sql<number>`count(*) filter (where ${users.isActive})`,
            administrators: sql<number>`count(*) filter (where ${users.role} = 'admin')`,
          })
          .from(users),
        db
          .select({
            total: sql<number>`count(*)`,
            active: sql<number>`count(*) filter (where ${shops.isActive})`,
            suspended: sql<number>`count(*) filter (where not ${shops.isActive})`,
          })
          .from(shops),
        db
          .select({
            total: sql<number>`count(*)`,
            today: sql<number>`count(*) filter (where ${sales.soldAt} >= current_date)`,
            turnover: sql<number>`coalesce(sum(${sales.total}), 0)`,
          })
          .from(sales),
        db
          .select({
            value: sql<number>`count(*) filter (where ${adminAuditLogs.createdAt} >= current_date)`,
          })
          .from(adminAuditLogs),
      ]);

    return {
      users: {
        total: Number(userStats?.total ?? 0),
        active: Number(userStats?.active ?? 0),
        administrators: Number(userStats?.administrators ?? 0),
      },
      shops: {
        total: Number(shopStats?.total ?? 0),
        active: Number(shopStats?.active ?? 0),
        suspended: Number(shopStats?.suspended ?? 0),
      },
      sales: {
        total: Number(salesStats?.total ?? 0),
        today: Number(salesStats?.today ?? 0),
        turnover: Number(salesStats?.turnover ?? 0),
      },
      activityToday: Number(auditStats?.value ?? 0),
    };
  }),

  shops: adminProcedure.input(listInput).query(async ({ input }) => {
    const search = input.query ? `%${input.query}%` : undefined;
    const statusCondition =
      input.status === "active"
        ? eq(shops.isActive, true)
        : input.status === "suspended"
          ? eq(shops.isActive, false)
          : undefined;
    const searchCondition = search
      ? or(ilike(shops.name, search), ilike(shops.slug, search))
      : undefined;

    return getDb()
      .select({
        id: shops.id,
        name: shops.name,
        slug: shops.slug,
        currency: shops.currency,
        country: shops.country,
        isActive: shops.isActive,
        suspensionReason: shops.suspensionReason,
        suspendedAt: shops.suspendedAt,
        createdAt: shops.createdAt,
        ownerId: users.id,
        ownerName: users.name,
        ownerEmail: users.email,
      })
      .from(shops)
      .innerJoin(users, eq(shops.createdBy, users.id))
      .where(and(statusCondition, searchCondition))
      .orderBy(desc(shops.createdAt))
      .limit(input.limit);
  }),

  users: adminProcedure.input(listInput).query(async ({ input }) => {
    const search = input.query ? `%${input.query}%` : undefined;
    const statusCondition =
      input.status === "active"
        ? eq(users.isActive, true)
        : input.status === "suspended"
          ? eq(users.isActive, false)
          : undefined;
    const searchCondition = search
      ? or(ilike(users.name, search), ilike(users.email, search))
      : undefined;
    const rows = await getDb()
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        lastSignedIn: users.lastSignedIn,
      })
      .from(users)
      .where(and(statusCondition, searchCondition))
      .orderBy(desc(users.createdAt))
      .limit(input.limit);
    const memberships = await getDb()
      .select({ userId: shopMembers.userId, value: count() })
      .from(shopMembers)
      .groupBy(shopMembers.userId);
    const shopCountByUser = new Map(
      memberships.map(item => [item.userId, Number(item.value)])
    );
    return rows.map(user => ({
      ...user,
      shopCount: shopCountByUser.get(user.id) ?? 0,
    }));
  }),

  activity: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(40) }))
    .query(async ({ input }) =>
      getDb()
        .select({
          id: adminAuditLogs.id,
          action: adminAuditLogs.action,
          targetType: adminAuditLogs.targetType,
          targetId: adminAuditLogs.targetId,
          metadata: adminAuditLogs.metadata,
          createdAt: adminAuditLogs.createdAt,
          actorName: users.name,
          actorEmail: users.email,
        })
        .from(adminAuditLogs)
        .innerJoin(users, eq(adminAuditLogs.actorId, users.id))
        .orderBy(desc(adminAuditLogs.createdAt))
        .limit(input.limit)
    ),

  setShopActive: adminProcedure
    .input(
      z.object({
        shopId: z.string().uuid(),
        isActive: z.boolean(),
        reason: z.string().trim().min(3).max(240).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.isActive && !input.reason) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Un motif est requis pour suspendre une boutique.",
        });
      }
      const [target] = await getDb()
        .select({ id: shops.id, name: shops.name, isActive: shops.isActive })
        .from(shops)
        .where(eq(shops.id, input.shopId))
        .limit(1);
      if (!target) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Boutique introuvable.",
        });
      }

      const now = new Date();
      await getDb()
        .update(shops)
        .set({
          isActive: input.isActive,
          suspendedAt: input.isActive ? null : now,
          suspensionReason: input.isActive ? null : input.reason,
          suspendedBy: input.isActive ? null : ctx.user.id,
          updatedAt: now,
        })
        .where(eq(shops.id, input.shopId));
      await writeAuditLog(
        ctx.user.id,
        input.isActive ? "shop_reactivated" : "shop_suspended",
        "shop",
        target.id,
        { name: target.name, reason: input.reason ?? null }
      );
      return { id: target.id, isActive: input.isActive };
    }),

  setUserActive: adminProcedure
    .input(z.object({ userId: z.string().uuid(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Vous ne pouvez pas désactiver votre propre compte administrateur.",
        });
      }
      const [target] = await getDb()
        .select({ id: users.id, role: users.role, isActive: users.isActive })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);
      if (!target) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Compte introuvable.",
        });
      }
      if (
        !input.isActive &&
        target.role === "admin" &&
        target.isActive &&
        (await getActiveAdminCount()) <= 1
      ) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Au moins un administrateur actif doit rester disponible.",
        });
      }
      await getDb()
        .update(users)
        .set({ isActive: input.isActive, updatedAt: new Date() })
        .where(eq(users.id, input.userId));
      await writeAuditLog(
        ctx.user.id,
        input.isActive ? "user_reactivated" : "user_suspended",
        "user",
        target.id
      );
      return { id: target.id, isActive: input.isActive };
    }),

  setUserRole: adminProcedure
    .input(
      z.object({ userId: z.string().uuid(), role: z.enum(["admin", "user"]) })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Un administrateur ne peut pas modifier son propre rôle.",
        });
      }
      const [target] = await getDb()
        .select({ id: users.id, role: users.role, isActive: users.isActive })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);
      if (!target) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Compte introuvable.",
        });
      }
      if (
        target.role === "admin" &&
        input.role === "user" &&
        target.isActive &&
        (await getActiveAdminCount()) <= 1
      ) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Au moins un administrateur actif doit rester disponible.",
        });
      }
      await getDb()
        .update(users)
        .set({ role: input.role, updatedAt: new Date() })
        .where(eq(users.id, input.userId));
      await writeAuditLog(
        ctx.user.id,
        input.role === "admin"
          ? "user_promoted_to_admin"
          : "user_demoted_to_user",
        "user",
        target.id
      );
      return { id: target.id, role: input.role };
    }),
});
