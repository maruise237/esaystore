import { describe, expect, it } from "vitest";

describe("configuration Neon Auth", () => {
  it("publie un jeu de clés JWKS depuis l’URL Neon Auth configurée", async () => {
    const baseUrl = process.env.NEON_AUTH_BASE_URL;
    expect(baseUrl).toBeTruthy();

    const response = await fetch(`${baseUrl}/.well-known/jwks.json`, {
      signal: AbortSignal.timeout(10_000),
    });

    expect(response.ok).toBe(true);
    const payload = (await response.json()) as { keys?: unknown[] };
    expect(Array.isArray(payload.keys)).toBe(true);
    expect(payload.keys?.length).toBeGreaterThan(0);
  });
});
