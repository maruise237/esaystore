import { afterEach, describe, expect, it } from "vitest";
import type { Request } from "express";
import { authRateLimitKey, clearAuthAttempts, consumeAuthAttempt } from "./authRateLimit";
import { getSql } from "./db";

const sql = getSql();
const request = { headers: { "x-forwarded-for": "198.51.100.42" }, ip: "198.51.100.42" } as unknown as Request;
const identifier = `security-${crypto.randomUUID()}@example.invalid`;

afterEach(async () => {
  await sql`DELETE FROM auth_rate_limits WHERE key = ${authRateLimitKey(request, "login", identifier)}`;
});

describe("limitation d’authentification avec Neon", () => {
  it("bloque après plusieurs tentatives et efface le compteur après une réussite", async () => {
    for (let index = 0; index < 4; index += 1) expect(await consumeAuthAttempt(request, "login", identifier)).toBe(false);
    expect(await consumeAuthAttempt(request, "login", identifier)).toBe(true);
    await clearAuthAttempts(request, "login", identifier);
    expect(await consumeAuthAttempt(request, "login", identifier)).toBe(false);
  });
});
