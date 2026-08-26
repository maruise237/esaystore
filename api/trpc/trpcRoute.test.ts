import { afterEach, describe, expect, it, vi } from "vitest";

describe("fonction tRPC Vercel", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("se charge en production sans secret de session locale avant une connexion Neon Auth", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("JWT_SECRET", "");

    await expect(import("./[trpc]")).resolves.toMatchObject({ default: expect.any(Function) });
  });
});
