import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import { parse } from "cookie";
import { getSessionCookieOptions } from "./_core/cookies";
import { getUserById } from "./db";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";

const sessionSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || "development-secret-change-me");

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function createSessionToken(userId: string) {
  return new SignJWT({ sub: userId, type: "easystor-session" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(sessionSecret());
}

export async function getAuthenticatedUser(req: Request) {
  const token = parse(req.headers.cookie ?? "")[COOKIE_NAME];
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, sessionSecret());
    if (!payload.sub || payload.type !== "easystor-session") return null;
    const user = await getUserById(payload.sub);
    return user?.isActive ? user : null;
  } catch {
    return null;
  }
}

export async function writeSessionCookie(req: Request, res: Response, userId: string) {
  const token = await createSessionToken(userId);
  res.cookie(COOKIE_NAME, token, {
    ...getSessionCookieOptions(req),
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookie(req: Request, res: Response) {
  res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(req), maxAge: -1 });
}

export const SESSION_DURATION_MS = ONE_YEAR_MS;
