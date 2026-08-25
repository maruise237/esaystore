import { describe, expect, it } from "vitest";
import {
  canCreateEssentialProduct,
  isOptionalCatalogDetail,
} from "./catalogFlow";

describe("parcours catalogue simplifié", () => {
  it("requires only a name, a positive sale price and a non-negative stock", () => {
    expect(
      canCreateEssentialProduct({
        name: "Savon",
        salePrice: "500",
        stockQuantity: "0",
      })
    ).toBe(true);
    expect(
      canCreateEssentialProduct({
        name: "",
        salePrice: "500",
        stockQuantity: "0",
      })
    ).toBe(false);
    expect(
      canCreateEssentialProduct({
        name: "Savon",
        salePrice: "0",
        stockQuantity: "0",
      })
    ).toBe(false);
    expect(
      canCreateEssentialProduct({
        name: "Savon",
        salePrice: "500",
        stockQuantity: "-1",
      })
    ).toBe(false);
  });

  it("keeps barcode, category and photo details optional", () => {
    expect(isOptionalCatalogDetail("")).toBe(false);
    expect(isOptionalCatalogDetail("   ")).toBe(false);
    expect(isOptionalCatalogDetail("123456789")).toBe(true);
  });
});
