import { describe, expect, it } from "vitest";
import { defaultCountryPreference, detectCountryPreference, getCountryPreference } from "./countryPreferences";

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
});
