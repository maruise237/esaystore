import { neon } from "@neondatabase/serverless";
import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../drizzle/schema";
import { type InsertUser, shopMembers, shops, users } from "../drizzle/schema";

export const authenticatedUserFields = {
  id: users.id,
  openId: users.openId,
  email: users.email,
  name: users.name,
  passwordHash: users.passwordHash,
  loginMethod: users.loginMethod,
  role: users.role,
  isActive: users.isActive,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
  lastSignedIn: users.lastSignedIn,
};

export const shopFieldsWithoutLogo = {
  id: shops.id,
  name: shops.name,
  slug: shops.slug,
  currency: shops.currency,
  country: shops.country,
  isActive: shops.isActive,
  suspendedAt: shops.suspendedAt,
  suspensionReason: shops.suspensionReason,
  suspendedBy: shops.suspendedBy,
  createdBy: shops.createdBy,
  createdAt: shops.createdAt,
  updatedAt: shops.updatedAt,
};

type CompatibleShop = typeof shops.$inferSelect;

async function compatibleShopFields() {
  const [hasLogo, hasAddress, hasContactPhone, hasReceiptNote] =
    await Promise.all([
      hasOptionalColumn("shops", "logo_url"),
      hasOptionalColumn("shops", "address"),
      hasOptionalColumn("shops", "contact_phone"),
      hasOptionalColumn("shops", "receipt_note"),
    ]);
  return {
    ...shopFieldsWithoutLogo,
    logoUrl: hasLogo ? shops.logoUrl : sql<string | null>`NULL`,
    address: hasAddress ? shops.address : sql<string | null>`NULL`,
    contactPhone: hasContactPhone
      ? shops.contactPhone
      : sql<string | null>`NULL`,
    receiptNote: hasReceiptNote ? shops.receiptNote : sql<string | null>`NULL`,
  };
}

export type AuthenticatedUser = {
  id: string;
  openId: string | null;
  email: string | null;
  name: string | null;
  passwordHash: string | null;
  loginMethod: string;
  role: "user" | "admin";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

type AppDb = ReturnType<typeof createDb>;

let cachedDb: AppDb | null = null;
let cachedSql: ReturnType<typeof neon> | null = null;
const optionalColumnAvailability = new Map<string, Promise<boolean>>();

function connectionString() {
  const value = process.env.NEON_DATABASE_URL;
  if (!value) throw new Error("NEON_DATABASE_URL is not configured");
  return value;
}

function createDb() {
  return drizzle({ client: neon(connectionString()), schema });
}

export function getDb() {
  if (!cachedDb) cachedDb = createDb();
  return cachedDb;
}

export function getSql() {
  if (!cachedSql) cachedSql = neon(connectionString());
  return cachedSql;
}

export async function rawRows<T extends Record<string, unknown>>(
  query: string,
  params: unknown[] = []
) {
  const response = (await getSql().query(query, params)) as unknown;
  if (Array.isArray(response)) return response as T[];
  return (response as { rows?: T[] }).rows ?? [];
}

export function hasOptionalColumn(
  tableName: "shops" | "users",
  columnName:
    | "logo_url"
    | "address"
    | "contact_phone"
    | "receipt_note"
    | "phone"
) {
  const key = `${tableName}.${columnName}`;
  const cached = optionalColumnAvailability.get(key);
  if (cached) return cached;

  const availability = rawRows<{ present: boolean | "t" | "f" }>(
    "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2) AS present",
    [tableName, columnName]
  ).then(rows => rows[0]?.present === true || rows[0]?.present === "t");
  optionalColumnAvailability.set(key, availability);
  return availability;
}

export async function getShopById(
  shopId: string
): Promise<CompatibleShop | undefined> {
  const db = getDb();
  const fields = await compatibleShopFields();
  return (
    await db.select(fields).from(shops).where(eq(shops.id, shopId)).limit(1)
  )[0] as CompatibleShop | undefined;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for OAuth upsert");
  await getDb()
    .insert(users)
    .values(user)
    .onConflictDoUpdate({
      target: users.openId,
      set: {
        name: user.name,
        email: user.email,
        loginMethod: user.loginMethod,
        lastSignedIn: new Date(),
        updatedAt: new Date(),
      },
    });
}

export async function getUserByOpenId(openId: string) {
  const rows = await getDb()
    .select(authenticatedUserFields)
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return rows[0] ? { ...rows[0], phone: null } : undefined;
}

export async function getUserById(id: string) {
  const rows = await getDb()
    .select(authenticatedUserFields)
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return rows[0];
}

export async function getUserByEmail(email: string) {
  const [user] = await getDb()
    .select(authenticatedUserFields)
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return user;
}

export async function listUserShops(userId: string) {
  const db = getDb();
  const fields = await compatibleShopFields();
  return db
    .select({ shop: fields, role: shopMembers.role })
    .from(shopMembers)
    .innerJoin(shops, eq(shopMembers.shopId, shops.id))
    .where(eq(shopMembers.userId, userId));
}

export async function getMembership(userId: string, shopId: string) {
  const rows = await getDb()
    .select()
    .from(shopMembers)
    .where(and(eq(shopMembers.userId, userId), eq(shopMembers.shopId, shopId)))
    .limit(1);
  return rows[0];
}
