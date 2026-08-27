import { describe, expect, it } from "vitest";
import { defaultCountryPreference, detectCountryPreference, formatPhoneNumber, getCountryPreference, isCompletePhoneNumber, normalizePhoneNumber } from "./countryPreferences";

describe("préférences de pays d’inscription", () => {
  it("associe chaque pays proposé à une devise actuellement prise en charge", () => {
    expect(getCountryPreference("NGA")).toMatchObject({ shortCode: "NG", dialCode: "+234", currency: "NGN" });
    expect(getCountryPreference("SEN")).toMatchObject({ shortCode: "SN", dialCode: "+221", currency: "XOF" });
    expect(getCountryPreference("CMR")).toMatchObject({ shortCode: "CM", dialCode: "+237", currency: "XAF" });
  });

  it("propose un pays depuis la langue ou le fuseau horaire sans deviner une valeur inconnue", () => {
    expect(detectCountryPreference("fr-CM", "Africa/Lagos")).toMatchObject({ preference: { country: "CMR", currency: "XAF" }, source: "locale" });
    expect(detectCountryPreference("fr", "Africa/Lagos")).toMatchObject({ preference: { country: "NGA", currency: "NGN" }, source: "timezone" });
    expect(detectCountryPreference("en-US", "America/New_York")).toBeNull();
    expect(getCountryPreference("UNKNOWN")).toBe(defaultCountryPreference);
  });

  it("ajoute l’indicatif du pays, limite le numéro et conserve une valeur internationale exploitable", () => {
    expect(formatPhoneNumber("699789999", "CMR")).toBe("+237 699 789 999");
    expect(formatPhoneNumber("+234 803 123 4567", "NGA")).toBe("+234 803 123 456 7");
    expect(normalizePhoneNumber("+237 699 789 999", "CMR")).toBe("+237699789999");
    expect(isCompletePhoneNumber("+237 699 789 999", "CMR")).toBe(true);
    expect(isCompletePhoneNumber("+237 69", "CMR")).toBe(false);
  });
});
