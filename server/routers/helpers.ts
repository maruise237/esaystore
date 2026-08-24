import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { cashClosures, type shopRoleEnum } from "../../drizzle/schema";
import { getDb, getMembership } from "../db";

type ShopRole = (typeof shopRoleEnum.enumValues)[number];

export async function assertShopAccess(userId: string, shopId: string, allowedRoles?: ShopRole[]) {
  const membership = await getMembership(userId, shopId);
  if (!membership) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Vous n’avez pas accès à cette boutique." });
  }
  if (allowedRoles && !allowedRoles.includes(membership.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Votre rôle ne permet pas cette action." });
  }
  return membership;
}

export async function assertBusinessDayOpen(shopId: string, operationDate: Date) {
  const businessDate = operationDate.toISOString().slice(0, 10);
  const [closure] = await getDb().select({ id: cashClosures.id }).from(cashClosures).where(and(eq(cashClosures.shopId, shopId), eq(cashClosures.businessDate, businessDate))).limit(1);
  if (closure) throw new TRPCError({ code: "CONFLICT", message: `La caisse du ${businessDate} est déjà clôturée. Enregistrez l’opération sur une nouvelle journée.` });
}

export function makeShopSlug(name: string) {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 140) || "boutique";
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}
