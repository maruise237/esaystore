import { describe, expect, it } from "vitest";
import { isVerifiedNeonIdentity } from "./neonAuth";

describe("liaison Neon Auth", () => {
  it("n’accepte qu’une identité avec sujet, e-mail et e-mail vérifié", () => {
    expect(
      isVerifiedNeonIdentity({
        sub: "ed3f92b0-30af-4b94-a59f-e2f6a7a01e20",
        email: "commerce@example.test",
        emailVerified: true,
      })
    ).toBe(true);
    expect(isVerifiedNeonIdentity({ sub: "id", email: "commerce@example.test" })).toBe(false);
    expect(isVerifiedNeonIdentity({ sub: "id", emailVerified: true })).toBe(false);
  });
});
