import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildReceiptHtml,
  createReceiptPdf,
  isReceiptPaid,
  receiptPdfFileName,
} from "./receipt";

describe("reçu de vente", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("renders branded receipt details while escaping customer-controlled text", () => {
    const html = buildReceiptHtml({
      shopName: "Boutique <verte>",
      logoUrl:
        "/manus-storage/shops/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee/branding/logo_a1b2c3d4.png",
      shopAddress: "Marché &lt; central",
      shopContactPhone: "+237 699 12 34 56",
      shopReceiptNote: "Merci & à bientôt.",
      saleNumber: "V-001",
      currency: "XAF",
      soldAt: new Date("2026-08-24T10:00:00Z"),
      customerName: "Awa & fils",
      lines: [{ name: "Savon <naturel>", quantity: 2, unitPrice: 500 }],
      subtotal: 1000,
      discount: 100,
      total: 900,
      cash: 900,
      mobileMoney: 0,
      credit: 0,
    });
    expect(html).toContain("Boutique &lt;verte&gt;");
    expect(html).toContain("Savon &lt;naturel&gt; × 2");
    expect(html).toContain("Awa &amp; fils");
    expect(html).toContain("Reçu V-001");
    expect(html).toContain("REÇU DE VENTE");
    expect(html).toContain("brand-logo");
    expect(html).toContain("Marché &amp;lt; central");
    expect(html).toContain("+237 699 12 34 56");
    expect(html).toContain("Merci &amp; à bientôt.");
    expect(html).toContain('class="paid-stamp">PAYÉ</span>');
  });

  it("n’appose le cachet Payé que sur une vente sans solde à crédit", () => {
    const paid = {
      shopName: "Boutique",
      saleNumber: "V-PAID",
      currency: "XAF",
      soldAt: new Date("2026-08-24T10:00:00Z"),
      lines: [],
      subtotal: 500,
      discount: 0,
      total: 500,
      cash: 500,
      mobileMoney: 0,
      credit: 0,
    };
    const onCredit = {
      ...paid,
      saleNumber: "V-CREDIT",
      cash: 300,
      credit: 200,
    };
    expect(isReceiptPaid(paid)).toBe(true);
    expect(buildReceiptHtml(paid)).toContain('class="paid-stamp">PAYÉ</span>');
    expect(isReceiptPaid(onCredit)).toBe(false);
    expect(buildReceiptHtml(onCredit)).not.toContain(
      'class="paid-stamp">PAYÉ</span>'
    );
  });

  it("does not inject an arbitrary remote image as a shop logo", () => {
    const html = buildReceiptHtml({
      shopName: "Boutique",
      logoUrl: "https://invalid.example/logo.svg",
      saleNumber: "V-002",
      currency: "XAF",
      soldAt: new Date("2026-08-24T10:00:00Z"),
      lines: [],
      subtotal: 0,
      discount: 0,
      total: 0,
      cash: 0,
      mobileMoney: 0,
      credit: 0,
    });
    expect(html).not.toContain('<img class="brand-logo"');
    expect(html).not.toContain("invalid.example");
  });
});

it("creates a filesystem-safe PDF filename", () => {
  expect(
    receiptPdfFileName({
      shopName: "Boutique",
      saleNumber: "V/ 001",
      currency: "XAF",
      soldAt: new Date(),
      lines: [],
      subtotal: 0,
      discount: 0,
      total: 0,
      cash: 0,
      mobileMoney: 0,
      credit: 0,
    })
  ).toBe("recu-easystor-V--001.pdf");
});

it("generates a non-empty PDF document for sharing", async () => {
  const pdf = await createReceiptPdf({
    shopName: "Boutique",
    saleNumber: "V-001",
    currency: "XAF",
    soldAt: new Date("2026-08-24T10:00:00Z"),
    lines: [{ name: "Produit", quantity: 1, unitPrice: 500 }],
    subtotal: 500,
    discount: 0,
    total: 500,
    cash: 500,
    mobileMoney: 0,
    credit: 0,
  });
  expect(pdf.type).toBe("application/pdf");
  expect(pdf.size).toBeGreaterThan(500);
});

it("embeds a safely stored shop logo in the generated PDF when it is available", async () => {
  const pngBytes = Uint8Array.from(
    atob(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLk8QAAAABJRU5ErkJggg=="
    ),
    character => character.charCodeAt(0)
  );
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(pngBytes, {
      status: 200,
      headers: { "content-type": "image/png" },
    })
  );
  vi.stubGlobal("fetch", fetchMock);

  const pdf = await createReceiptPdf({
    shopName: "Boutique",
    logoUrl:
      "/manus-storage/shops/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee/branding/logo_a1b2c3d4.png",
    saleNumber: "V-003",
    currency: "XAF",
    soldAt: new Date("2026-08-24T10:00:00Z"),
    lines: [{ name: "Produit", quantity: 1, unitPrice: 500 }],
    subtotal: 500,
    discount: 0,
    total: 500,
    cash: 500,
    mobileMoney: 0,
    credit: 0,
  });

  expect(fetchMock).toHaveBeenCalledWith(
    "/manus-storage/shops/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee/branding/logo_a1b2c3d4.png"
  );
  expect(pdf.type).toBe("application/pdf");
  expect(pdf.size).toBeGreaterThan(500);
});
