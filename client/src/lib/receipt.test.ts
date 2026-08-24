import { describe, expect, it } from "vitest";
import { buildReceiptHtml, createReceiptPdf, receiptPdfFileName } from "./receipt";

describe("reçu de vente", () => {
  it("renders receipt details while escaping customer-controlled text", () => {
    const html = buildReceiptHtml({ shopName: "Boutique <verte>", saleNumber: "V-001", currency: "XAF", soldAt: new Date("2026-08-24T10:00:00Z"), customerName: "Awa & fils", lines: [{ name: "Savon <naturel>", quantity: 2, unitPrice: 500 }], subtotal: 1000, discount: 100, total: 900, cash: 900, mobileMoney: 0, credit: 0 });
    expect(html).toContain("Boutique &lt;verte&gt;");
    expect(html).toContain("Savon &lt;naturel&gt; × 2");
    expect(html).toContain("Awa &amp; fils");
    expect(html).toContain("Reçu V-001");
  });
});

it("creates a filesystem-safe PDF filename", () => {
  expect(receiptPdfFileName({ shopName: "Boutique", saleNumber: "V/ 001", currency: "XAF", soldAt: new Date(), lines: [], subtotal: 0, discount: 0, total: 0, cash: 0, mobileMoney: 0, credit: 0 })).toBe("recu-easystor-V--001.pdf");
});

it("generates a non-empty PDF document for sharing", () => {
  const pdf = createReceiptPdf({ shopName: "Boutique", saleNumber: "V-001", currency: "XAF", soldAt: new Date("2026-08-24T10:00:00Z"), lines: [{ name: "Produit", quantity: 1, unitPrice: 500 }], subtotal: 500, discount: 0, total: 500, cash: 500, mobileMoney: 0, credit: 0 });
  expect(pdf.type).toBe("application/pdf");
  expect(pdf.size).toBeGreaterThan(500);
});
