import { afterEach, describe, expect, it } from "vitest";

const originalEnvironment = { nodeEnv: process.env.NODE_ENV, secret: process.env.JWT_SECRET };

afterEach(() => {
  process.env.NODE_ENV = originalEnvironment.nodeEnv;
  if (originalEnvironment.secret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalEnvironment.secret;
});

describe("secret de session", () => {
  it("refuses a missing JWT secret in production", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.JWT_SECRET;
    const { createSessionToken } = await import("./auth");
    await expect(createSessionToken("user-id")).rejects.toThrow("JWT_SECRET is required in production");
  });

  it("accepts a configured JWT secret in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = "too-short";
    const { createSessionToken } = await import("./auth");
    await expect(createSessionToken("user-id")).resolves.toEqual(expect.any(String));
  });
});
