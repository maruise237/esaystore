import { TRPCError } from "@trpc/server";
import type { shopRoleEnum } from "../../drizzle/schema";
import { getMembership } from "../db";

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
