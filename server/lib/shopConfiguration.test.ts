import { describe, expect, it } from "vitest";
import { currencyForCountry } from "./shopConfiguration";

describe("devise initiale par pays", () => {
  it("associe les pays configurables à la devise locale prise en charge", () => {
    expect(currencyForCountry("CMR")).toBe("XAF");
    expect(currencyForCountry("SEN")).toBe("XOF");
    expect(currencyForCountry("NGA")).toBe("NGN");
  });
});
