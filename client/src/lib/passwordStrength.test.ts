import { describe, expect, it } from "vitest";
import { getPasswordStrength } from "./passwordStrength";

describe("force du mot de passe", () => {
  it("distingue les mots de passe courts, corrects et robustes", () => {
    expect(getPasswordStrength("")).toMatchObject({ score: 0, label: "Très faible" });
    expect(getPasswordStrength("motdepasse")).toMatchObject({ score: 1, label: "Très faible" });
    expect(getPasswordStrength("Motdepasse2026!")).toMatchObject({ score: 4, label: "Solide" });
    expect(getPasswordStrength("Motdepasse-tres-solide-2026!")).toMatchObject({ score: 4, label: "Très solide" });
  });
});
