import { describe, expect, it } from "vitest";

describe("configuration du propriétaire de plateforme", () => {
  it("définit une adresse e-mail propriétaire exploitable côté serveur", () => {
    const email = process.env.PLATFORM_OWNER_EMAIL?.trim().toLowerCase();
    expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });
});
