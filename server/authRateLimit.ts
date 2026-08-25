import { createHash } from "node:crypto";
import type { Request } from "express";
import { rawRows } from "./db";

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

type AttemptRow = { blocked_until: Date | null };

function sourceIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return raw?.split(",", 1)[0]?.trim() || req.ip || "unknown";
}

export function authRateLimitKey(req: Request, scope: "login" | "register", identifier: string) {
  return createHash("sha256")
    .update(`${scope}\u0000${sourceIp(req)}\u0000${identifier.trim().toLowerCase()}`)
    .digest("hex");
}

export async function consumeAuthAttempt(req: Request, scope: "login" | "register", identifier: string) {
  const key = authRateLimitKey(req, scope, identifier);
  const rows = await rawRows<AttemptRow>(
    `INSERT INTO auth_rate_limits (key, attempt_count, window_started_at, blocked_until, updated_at)
     VALUES ($1, 1, now(), NULL, now())
     ON CONFLICT (key) DO UPDATE SET
       attempt_count = CASE
         WHEN auth_rate_limits.blocked_until IS NOT NULL AND auth_rate_limits.blocked_until > now() THEN auth_rate_limits.attempt_count
         WHEN auth_rate_limits.window_started_at <= now() - interval '15 minutes' THEN 1
         ELSE auth_rate_limits.attempt_count + 1
       END,
       window_started_at = CASE
         WHEN auth_rate_limits.window_started_at <= now() - interval '15 minutes' THEN now()
         ELSE auth_rate_limits.window_started_at
       END,
       blocked_until = CASE
         WHEN auth_rate_limits.blocked_until IS NOT NULL AND auth_rate_limits.blocked_until > now() THEN auth_rate_limits.blocked_until
         WHEN auth_rate_limits.window_started_at <= now() - interval '15 minutes' THEN NULL
         WHEN auth_rate_limits.attempt_count + 1 >= $2 THEN now() + interval '15 minutes'
         ELSE NULL
       END,
       updated_at = now()
     RETURNING blocked_until`,
    [key, MAX_ATTEMPTS]
  );
  return Boolean(rows[0]?.blocked_until && new Date(rows[0].blocked_until).valueOf() > Date.now());
}

export async function clearAuthAttempts(req: Request, scope: "login" | "register", identifier: string) {
  await rawRows("DELETE FROM auth_rate_limits WHERE key = $1", [authRateLimitKey(req, scope, identifier)]);
}

export const AUTH_RATE_LIMIT_MESSAGE = `Trop de tentatives. Réessayez dans ${WINDOW_MINUTES} minutes.`;
