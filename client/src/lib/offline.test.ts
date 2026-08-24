import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { listUnknownBarcodes, offlineDb, resolveUnknownBarcode, saveUnknownBarcode } from "./offline";

describe("unknown barcode queue", () => {
  beforeEach(async () => {
    await offlineDb.unknownBarcodes.clear();
  });

  afterEach(async () => {
    await offlineDb.unknownBarcodes.clear();
  });

  it("saves and deduplicates equivalent unknown barcode scans per shop", async () => {
    await saveUnknownBarcode("shop-a", " 590-1234 12345 7 ", "camera");
    await saveUnknownBarcode("shop-a", "5901234123457", "manual");
    await saveUnknownBarcode("shop-b", "5901234123457", "camera");

    const firstShop = await listUnknownBarcodes("shop-a");
    const secondShop = await listUnknownBarcodes("shop-b");

    expect(firstShop).toHaveLength(1);
    expect(firstShop[0]).toMatchObject({ barcode: "5901234123457", occurrences: 2, source: "manual" });
    expect(secondShop).toHaveLength(1);
  });

  it("removes a code after it is resolved in the catalogue", async () => {
    await saveUnknownBarcode("shop-a", "3560070979684", "camera");
    await resolveUnknownBarcode("shop-a", "3560 0709 79684");
    expect(await listUnknownBarcodes("shop-a")).toEqual([]);
  });
});
