import { describe, expect, it } from "vitest";
import { createCsv, escapeCsvCell } from "./csv";

describe("CSV exports", () => {
  it("protects separators, quotation marks, and line breaks", () => {
    expect(escapeCsvCell('Client; "fidèle"\nsoir')).toBe('"Client; ""fidèle""\nsoir"');
  });

  it("creates a UTF-8 BOM CSV with French spreadsheet separators", () => {
    expect(createCsv(["Référence", "Montant"], [["V-001", 1250]])).toBe("\uFEFFRéférence;Montant\r\nV-001;1250\r\n");
  });
});
