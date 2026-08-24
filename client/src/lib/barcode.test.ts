import { describe, expect, it } from "vitest";
import { findProductByBarcode, normalizeBarcode } from "./barcode";

describe("barcode lookup", () => {
  it("normalizes spaces and hyphens from a scanned code", () => {
    expect(normalizeBarcode(" 590-1234 12345 7 ")).toBe("5901234123457");
  });

  it("matches active products and ignores inactive catalog entries", () => {
    const products = [{ id: "a", barcode: "5901234123457", isActive: true }, { id: "b", barcode: "5901234123457", isActive: false }];
    expect(findProductByBarcode(products, "590-1234 12345 7")?.id).toBe("a");
    expect(findProductByBarcode([{ id: "b", barcode: "123", isActive: false }], "123")).toBeUndefined();
  });
});
