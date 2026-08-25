import type { Request } from "express";
import { describe, expect, it } from "vitest";
import { authRateLimitKey } from "../authRateLimit";
import { isSecureRequest } from "./cookies";
import { trustedProxySetting } from "./proxyTrust";

function request({ ip, protocol = "http", secure = false, forwarded }: { ip: string; protocol?: string; secure?: boolean; forwarded?: string }) {
  return {
    ip,
    protocol,
    secure,
    headers: forwarded ? { "x-forwarded-for": forwarded, "x-forwarded-proto": "https" } : {},
    socket: { remoteAddress: ip },
  } as unknown as Request;
}

describe("confiance proxy", () => {
  it("n’accepte les en-têtes proxy qu’en production derrière un seul proxy géré", () => {
    expect(trustedProxySetting("production")).toBe(1);
    expect(trustedProxySetting("development")).toBe(false);
  });

  it("ne rend pas un cookie sécurisé sur la seule foi de x-forwarded-proto", () => {
    expect(isSecureRequest(request({ ip: "198.51.100.10", forwarded: "203.0.113.5" }))).toBe(false);
    expect(isSecureRequest(request({ ip: "198.51.100.10", protocol: "https", secure: true }))).toBe(true);
  });

  it("ignore x-forwarded-for forgé lors du calcul de la clé anti-bruteforce", () => {
    const base = request({ ip: "198.51.100.10" });
    const forged = request({ ip: "198.51.100.10", forwarded: "203.0.113.5" });
    expect(authRateLimitKey(base, "login", "personne@example.test")).toBe(authRateLimitKey(forged, "login", "personne@example.test"));
  });
});
