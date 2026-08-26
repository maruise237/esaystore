import { createServer } from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("fonction tRPC Vercel", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("se charge en production sans secret de session locale avant une connexion Neon Auth", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("JWT_SECRET", "");

    await expect(import("../../server/vercel/trpcHandler")).resolves.toMatchObject({ default: expect.any(Function) });
  });

  it("répond en JSON à auth.me sans session", async () => {
    const { default: api } = await import("../../server/vercel/trpcHandler");
    const server = createServer(api);
    await new Promise<void>(resolve => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Port de test indisponible");

    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/api/trpc/auth.me?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D`);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/json");
    } finally {
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
  });
});
