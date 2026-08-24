import { describe, expect, it } from "vitest";
import { closingDifference, formatBusinessDate } from "./closing";

describe("fermeture de caisse", () => {
  it("calculates positive and negative cash differences", () => {
    expect(closingDifference(12500, 12500)).toBe(0);
    expect(closingDifference(12500, 12000)).toBe(-500);
    expect(closingDifference(12500, 12800)).toBe(300);
  });

  it("formats a UTC business date consistently", () => {
    expect(formatBusinessDate(new Date("2026-08-24T12:00:00.000Z"))).toBe("2026-08-24");
  });
});
