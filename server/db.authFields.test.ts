import { describe, expect, it } from "vitest";
import { authenticatedUserFields } from "./db";

describe("projection utilisateur d’authentification", () => {
  it("ne dépend pas du téléphone facultatif pour connecter un compte existant", () => {
    expect(authenticatedUserFields).toHaveProperty("id");
    expect(authenticatedUserFields).toHaveProperty("passwordHash");
    expect(authenticatedUserFields).not.toHaveProperty("phone");
  });
});
