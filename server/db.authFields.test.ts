import { describe, expect, it } from "vitest";
import { authenticatedUserFields, shopFieldsWithoutLogo } from "./db";

describe("projection utilisateur d’authentification", () => {
  it("ne dépend pas du téléphone facultatif pour connecter un compte existant", () => {
    expect(authenticatedUserFields).toHaveProperty("id");
    expect(authenticatedUserFields).toHaveProperty("passwordHash");
    expect(authenticatedUserFields).not.toHaveProperty("phone");
  });

  it("ne dépend pas du logo facultatif pour charger les boutiques après connexion", () => {
    expect(shopFieldsWithoutLogo).toHaveProperty("id");
    expect(shopFieldsWithoutLogo).toHaveProperty("country");
    expect(shopFieldsWithoutLogo).not.toHaveProperty("logoUrl");
  });
});
