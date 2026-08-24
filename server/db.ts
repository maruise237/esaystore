import { neon } from "@neondatabase/serverless";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../drizzle/schema";
import { type InsertUser, shopMembers, shops, users } from "../drizzle/schema";

type AppDb = ReturnType<typeof createDb>;

let cachedDb: AppDb | null = null;
let cachedSql: ReturnType<typeof neon> | null = null;

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

export async function rawRows<T extends Record<string, unknown>>(query: string, params: unknown[] = []) {
  const response = await getSql().query(query, params) as unknown;
  if (Array.isArray(response)) return response as T[];
  return ((response as { rows?: T[] }).rows ?? []);
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for OAuth upsert");
  await getDb().insert(users).values(user).onConflictDoUpdate({
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
  const rows = await getDb().select().from(users).where(eq(users.openId, openId)).limit(1);
  return rows[0];
}

export async function getUserById(id: string) {
  const rows = await getDb().select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0];
}

export async function getUserByEmail(email: string) {
  const [user] = await getDb().select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return user;
}

export async function listUserShops(userId: string) {
  return getDb()
    .select({ shop: shops, role: shopMembers.role })
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
