import { jsPDF } from "jspdf";

export type ReceiptLine = { name: string; quantity: number; unitPrice: number };
export type SaleReceipt = {
  shopName: string;
  logoUrl?: string | null;
  shopAddress?: string | null;
  shopContactPhone?: string | null;
  saleNumber: string;
  currency: string;
  soldAt: Date;
  customerName?: string;
  lines: ReceiptLine[];
  subtotal: number;
  discount: number;
  total: number;
  cash: number;
  mobileMoney: number;
  credit: number;
  isPaid?: boolean;
  pendingSync?: boolean;
};

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    character =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character
  );

const money = (value: number, currency: string) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);

const shopLogoUrl =
  /^\/manus-storage\/shops\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/branding\/logo_[0-9a-f]{8}\.(?:png|jpe?g|webp)$/i;

function isShopLogoUrl(value: string | null | undefined): value is string {
  return typeof value === "string" && shopLogoUrl.test(value);
}

export function isReceiptPaid(receipt: SaleReceipt) {
  return receipt.isPaid ?? receipt.credit <= 0;
}

async function fetchLogoDataUrl(url: string) {
  try {
    const source = await fetch(url);
    const contentType =
      source.headers.get("content-type")?.split(";", 1)[0] ?? "";
    if (
      !source.ok ||
      !["image/png", "image/jpeg", "image/webp"].includes(contentType)
    ) {
      return null;
    }
    const bytes = new Uint8Array(await source.arrayBuffer());
    if (bytes.length === 0 || bytes.length > 2 * 1024 * 1024) return null;
    let binary = "";
    bytes.forEach(byte => {
      binary += String.fromCharCode(byte);
    });
    return `data:${contentType};base64,${btoa(binary)}`;
  } catch {
    return null;
  }
}

export function receiptPdfFileName(receipt: SaleReceipt) {
  return `recu-easystor-${receipt.saleNumber.replace(/[^a-zA-Z0-9-_]/g, "-")}.pdf`;
}

export async function createReceiptPdf(receipt: SaleReceipt) {
  const pdf = new jsPDF({ unit: "mm", format: "a6" });
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const margin = 10;
  let y = 15;
  const ensureSpace = (space: number) => {
    if (y + space > height - 12) {
      pdf.addPage();
      y = 15;
    }
  };
  const addLine = (left: string, right = "", bold = false) => {
    ensureSpace(bold ? 6 : 5);
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(bold ? 10 : 8);
    pdf.text(left, margin, y);
    if (right) pdf.text(right, width - margin, y, { align: "right" });
    y += bold ? 6 : 5;
  };

  pdf.setFillColor(38, 53, 45);
  pdf.rect(0, 0, width, 35, "F");
  const logo = isShopLogoUrl(receipt.logoUrl)
    ? await fetchLogoDataUrl(receipt.logoUrl)
    : null;
  if (logo) {
    try {
      pdf.addImage(logo, margin, 10, 14, 14);
    } catch {
      /* Le logo est facultatif : le reçu reste générable. */
    }
  }
  const titleX = logo ? margin + 18 : margin;
  pdf.setTextColor(245, 247, 232);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text(receipt.shopName, titleX, 17);
  pdf.setTextColor(216, 239, 115);
  pdf.setFontSize(7);
  pdf.text("REÇU DE VENTE", titleX, 23);
  pdf.setTextColor(245, 247, 232);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.text(receipt.saleNumber, titleX, 29);
  if (isReceiptPaid(receipt)) {
    pdf.setDrawColor(216, 239, 115);
    pdf.setFillColor(38, 53, 45);
    pdf.roundedRect(width - margin - 27, 20, 27, 8, 2, 2, "FD");
    pdf.setTextColor(216, 239, 115);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.text("PAYÉ", width - margin - 13.5, 25.2, { align: "center" });
  }

  y = 43;
  pdf.setTextColor(82, 96, 88);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text(
    receipt.soldAt.toLocaleString("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    margin,
    y
  );
  y += 5;
  const contactLines = [receipt.shopAddress, receipt.shopContactPhone]
    .filter((value): value is string => Boolean(value?.trim()))
    .flatMap(
      value => pdf.splitTextToSize(value, width - margin * 2) as string[]
    );
  if (contactLines.length) {
    ensureSpace(contactLines.length * 4 + 3);
    pdf.text(contactLines, margin, y);
    y += contactLines.length * 4 + 2;
  }
  if (receipt.customerName) {
    pdf.text(`Client : ${receipt.customerName}`, margin, y);
    y += 5;
  }
  if (receipt.pendingSync) {
    pdf.setTextColor(132, 90, 22);
    pdf.text("Reçu provisoire : vente hors ligne", margin, y);
    pdf.setTextColor(31, 41, 36);
    y += 5;
  }
  pdf.setDrawColor(210, 214, 206);
  pdf.line(margin, y, width - margin, y);
  y += 5;
  receipt.lines.forEach(line => {
    ensureSpace(10);
    const label = `${line.name} × ${line.quantity}`;
    const labelLines = pdf.splitTextToSize(
      label,
      width - margin * 2 - 36
    ) as string[];
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text(labelLines, margin, y);
    pdf.text(
      money(line.unitPrice * line.quantity, receipt.currency),
      width - margin,
      y,
      {
        align: "right",
      }
    );
    y += Math.max(5, labelLines.length * 4);
  });
  ensureSpace(28);
  pdf.line(margin, y, width - margin, y);
  y += 6;
  addLine("Sous-total", money(receipt.subtotal, receipt.currency));
  if (receipt.discount > 0) {
    addLine("Remise", `- ${money(receipt.discount, receipt.currency)}`);
  }
  addLine("TOTAL", money(receipt.total, receipt.currency), true);
  if (receipt.cash > 0)
    addLine("Espèces", money(receipt.cash, receipt.currency));
  if (receipt.mobileMoney > 0) {
    addLine("Mobile money", money(receipt.mobileMoney, receipt.currency));
  }
  if (receipt.credit > 0)
    addLine("À crédit", money(receipt.credit, receipt.currency));
  y += 4;
  pdf.setFontSize(8);
  pdf.setTextColor(92, 102, 93);
  pdf.text("Merci pour votre achat.", width / 2, y, { align: "center" });
  return new Blob([pdf.output("arraybuffer")], { type: "application/pdf" });
}

export async function shareReceiptPdf(receipt: SaleReceipt) {
  const file = new File(
    [await createReceiptPdf(receipt)],
    receiptPdfFileName(receipt),
    { type: "application/pdf" }
  );
  const shareData = {
    title: `Reçu ${receipt.saleNumber}`,
    text: `Reçu de ${receipt.shopName}`,
    files: [file],
  };
  if (
    navigator.share &&
    (!navigator.canShare || navigator.canShare(shareData))
  ) {
    try {
      await navigator.share(shareData);
      return "shared" as const;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }
    }
  }
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(url);
  return "downloaded" as const;
}

export function buildReceiptHtml(receipt: SaleReceipt) {
  const lines = receipt.lines
    .map(
      line =>
        `<tr><td>${escapeHtml(line.name)} × ${line.quantity}</td><td>${money(line.unitPrice * line.quantity, receipt.currency)}</td></tr>`
    )
    .join("");
  const logo = isShopLogoUrl(receipt.logoUrl)
    ? `<img class="brand-logo" src="${escapeHtml(receipt.logoUrl)}" alt="">`
    : "";
  const contact = [receipt.shopAddress, receipt.shopContactPhone]
    .filter((value): value is string => Boolean(value?.trim()))
    .map(value => `<div>${escapeHtml(value)}</div>`)
    .join("");
  const paidStamp = isReceiptPaid(receipt)
    ? '<span class="paid-stamp">PAYÉ</span>'
    : "";

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Reçu ${escapeHtml(receipt.saleNumber)}</title><style>body{font-family:Arial,sans-serif;margin:0;color:#1f2924}main{max-width:360px;margin:0 auto;padding:24px}.brand{display:flex;align-items:center;justify-content:space-between;gap:12px;background:#26352d;color:#f5f7e8;padding:20px;border-radius:12px}.brand-identity{display:flex;min-width:0;align-items:center;gap:12px}.brand-logo{width:42px;height:42px;flex:0 0 auto;object-fit:contain;background:#fff;border-radius:8px;padding:3px}.brand h1{font-size:20px;margin:0}.brand small{display:block;margin-top:5px;color:#d8ef73;font-size:10px;font-weight:700;letter-spacing:.11em}.paid-stamp{flex:0 0 auto;border:1px solid #d8ef73;border-radius:999px;padding:4px 7px;color:#d8ef73;font-size:10px;font-weight:700;letter-spacing:.08em}p{font-size:12px;margin:6px 0;color:#526058}.number{font-size:12px;font-weight:700;margin-top:14px;color:#3d5839}.contact{margin-top:10px;border-left:1px solid #9aac95;padding-left:10px;font-size:11px;line-height:1.55;color:#526058}.notice{background:#fff4cf;color:#6b5615;padding:8px;border-radius:6px;font-size:11px}table{width:100%;border-collapse:collapse;margin:18px 0;font-size:12px}td{padding:8px 0;border-bottom:1px solid #e6e8e3}td:last-child{text-align:right;font-weight:600}.summary{font-size:12px}.summary div{display:flex;justify-content:space-between;padding:4px 0}.total{font-size:16px!important;font-weight:700;border-top:1px solid #1f2924;margin-top:6px;padding-top:8px!important;color:#1f2924}.footer{text-align:center;margin-top:24px;font-size:11px;color:#67706b}@media print{body{print-color-adjust:exact}main{padding:0}.brand{border-radius:0}}</style></head><body><main><header class="brand"><div class="brand-identity">${logo}<div><h1>${escapeHtml(receipt.shopName)}</h1><small>REÇU DE VENTE</small></div></div>${paidStamp}</header><p class="number">${escapeHtml(receipt.saleNumber)}</p><p>${receipt.soldAt.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}${receipt.customerName ? ` · ${escapeHtml(receipt.customerName)}` : ""}</p>${contact ? `<div class="contact">${contact}</div>` : ""}${receipt.pendingSync ? '<p class="notice">Vente enregistrée hors ligne — numéro définitif après synchronisation.</p>' : ""}<table><tbody>${lines}</tbody></table><div class="summary"><div><span>Sous-total</span><span>${money(receipt.subtotal, receipt.currency)}</span></div>${receipt.discount > 0 ? `<div><span>Remise</span><span>− ${money(receipt.discount, receipt.currency)}</span></div>` : ""}<div class="total"><span>Total</span><span>${money(receipt.total, receipt.currency)}</span></div>${receipt.cash > 0 ? `<div><span>Espèces</span><span>${money(receipt.cash, receipt.currency)}</span></div>` : ""}${receipt.mobileMoney > 0 ? `<div><span>Mobile money</span><span>${money(receipt.mobileMoney, receipt.currency)}</span></div>` : ""}${receipt.credit > 0 ? `<div><span>À crédit</span><span>${money(receipt.credit, receipt.currency)}</span></div>` : ""}</div><p class="footer">Merci pour votre achat.</p></main></body></html>`;
}
