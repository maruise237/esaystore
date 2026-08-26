import type { Request } from "express";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { eq } from "drizzle-orm";
import { neonAuthIdentities, users } from "../drizzle/schema";
import { getDb, getUserByEmail, getUserById } from "./db";

type NeonAuthClaims = JWTPayload & {
  email?: string;
  name?: string;
  emailVerified?: boolean;
};

function neonAuthBaseUrl() {
  const value = process.env.NEON_AUTH_BASE_URL?.trim();
  if (!value) throw new Error("NEON_AUTH_BASE_URL is required");
  return value.replace(/\/$/, "");
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function neonJwks() {
  if (!jwks) jwks = createRemoteJWKSet(new URL(`${neonAuthBaseUrl()}/.well-known/jwks.json`));
  return jwks;
}

function bearerToken(req: Request) {
  const header = req.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : null;
}

export function isVerifiedNeonIdentity(claims: NeonAuthClaims) {
  return Boolean(claims.sub && claims.email?.trim() && claims.emailVerified === true);
}

export async function getNeonAuthenticatedUser(req: Request) {
  const token = bearerToken(req);
  if (!token) return null;

  try {
    const baseUrl = neonAuthBaseUrl();
    const origin = new URL(baseUrl).origin;
    const { payload } = await jwtVerify(token, neonJwks(), {
      issuer: origin,
      audience: origin,
    });
    return resolveNeonIdentity(payload as NeonAuthClaims);
  } catch {
    return null;
  }
}

async function resolveNeonIdentity(claims: NeonAuthClaims) {
  const externalUserId = claims.sub;
  const email = claims.email?.trim().toLowerCase();
  if (!isVerifiedNeonIdentity(claims) || !externalUserId || !email) return null;

  const db = getDb();
  const [identity] = await db
    .select()
    .from(neonAuthIdentities)
    .where(eq(neonAuthIdentities.externalUserId, externalUserId))
    .limit(1);

  if (identity) {
    await db
      .update(neonAuthIdentities)
      .set({ lastSeenAt: new Date() })
      .where(eq(neonAuthIdentities.externalUserId, externalUserId));
    const user = await getUserById(identity.userId);
    return user?.isActive ? user : null;
  }

  let user = await getUserByEmail(email);
  if (!user) {
    const id = crypto.randomUUID();
    await db.insert(users).values({
      id,
      name: claims.name?.trim().slice(0, 160) || email.split("@")[0],
      email,
      loginMethod: "neon_auth",
    }).onConflictDoNothing({ target: users.email });
    user = await getUserByEmail(email);
  }

  if (!user?.isActive) return null;
  await db
    .insert(neonAuthIdentities)
    .values({ externalUserId, userId: user.id, email })
    .onConflictDoNothing({ target: neonAuthIdentities.externalUserId });
  await db
    .update(users)
    .set({ lastSignedIn: new Date(), updatedAt: new Date() })
    .where(eq(users.id, user.id));
  return user;
}
