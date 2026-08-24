import { describe, expect, it } from "vitest";
import { resolveCatalogPhoto } from "./catalogVariants";

describe("photos de catalogue", () => {
  it("prioritizes a variant photo and otherwise uses the parent product photo", () => {
    expect(resolveCatalogPhoto("/manus-storage/product.webp", "/manus-storage/variant.webp")).toBe("/manus-storage/variant.webp");
    expect(resolveCatalogPhoto("/manus-storage/product.webp", null)).toBe("/manus-storage/product.webp");
    expect(resolveCatalogPhoto(null, null)).toBeNull();
  });
});
