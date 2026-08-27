import { useState } from "react";
import { Download, Printer, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  buildReceiptHtml,
  createReceiptPdf,
  shareReceiptPdf,
  type SaleReceipt,
} from "@/lib/receipt";

const format = (value: number, currency: string) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);

export default function SaleReceiptDialog({
  receipt,
  onOpenChange,
}: {
  receipt: SaleReceipt | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const print = () => {
    if (!receipt) return;
    const printWindow = window.open(
      "",
      "easystor-receipt",
      "width=480,height=720"
    );
    if (!printWindow) return;
    printWindow.addEventListener(
      "load",
      () => {
        printWindow.focus();
        printWindow.print();
      },
      { once: true }
    );
    printWindow.document.open();
    printWindow.document.write(buildReceiptHtml(receipt));
    printWindow.document.close();
  };
  const share = async () => {
    if (!receipt) return;
    setSharing(true);
    try {
      await shareReceiptPdf(receipt);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        console.error("Partage du reçu impossible", error);
    } finally {
      setSharing(false);
    }
  };
  const download = async () => {
    if (!receipt) return;
    setDownloading(true);
    try {
      const url = URL.createObjectURL(await createReceiptPdf(receipt));
      const link = document.createElement("a");
      link.href = url;
      link.download = `recu-${receipt.saleNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };
  return (
    <Dialog open={Boolean(receipt)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Vente enregistrée</DialogTitle>
          <DialogDescription>
            Partagez le PDF dans WhatsApp, e-mail ou toute application proposée
            par votre appareil, ou imprimez-le.
          </DialogDescription>
        </DialogHeader>
        {receipt && (
          <div className="overflow-hidden rounded-2xl border border-[#dfe4d7] bg-[#f7f6f1] text-sm shadow-[0_12px_26px_rgba(37,50,42,0.08)]">
            <div className="flex items-center gap-3 bg-[#26352d] p-4 text-[#f5f7e8]">
              {receipt.logoUrl ? (
                <img
                  src={receipt.logoUrl}
                  alt="Logo de la boutique"
                  className="h-10 w-10 rounded-lg bg-white object-contain p-1"
                />
              ) : (
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#d8ef73] text-xs font-bold text-[#26352d]">
                  E
                </span>
              )}
              <div>
                <p className="font-serif text-lg leading-none">
                  {receipt.shopName}
                </p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#d8ef73]">
                  Reçu de vente
                </p>
              </div>
            </div>
            <div className="p-4">
              <div className="border-b border-[#e4e1d7] pb-3">
                <p className="text-xs font-semibold text-[#3d5839]">
                  {receipt.saleNumber}
                </p>
                <p className="mt-1 text-xs text-[#72766e]">
                  {receipt.soldAt.toLocaleString("fr-FR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                {receipt.customerName && (
                  <p className="mt-1 text-xs text-[#72766e]">
                    Client : {receipt.customerName}
                  </p>
                )}
              </div>
              <div className="space-y-2 py-3">
                {receipt.lines.map(line => (
                  <div
                    key={`${line.name}-${line.unitPrice}`}
                    className="flex justify-between gap-3"
                  >
                    <span className="min-w-0 truncate">
                      {line.name} × {line.quantity}
                    </span>
                    <span className="shrink-0 font-medium">
                      {format(line.unitPrice * line.quantity, receipt.currency)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#e4e1d7] pt-3">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{format(receipt.total, receipt.currency)}</span>
                </div>
                {receipt.pendingSync && (
                  <p className="mt-2 text-xs text-[#886922]">
                    Ce reçu est provisoire jusqu’à la synchronisation de la
                    vente hors ligne.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            className="bg-[#415b3c]"
            onClick={share}
            disabled={sharing || downloading}
          >
            {sharing ? (
              "Préparation…"
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                Partager le PDF
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => void download()}
            disabled={sharing || downloading}
          >
            {downloading ? (
              "Préparation…"
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Télécharger
              </>
            )}
          </Button>
        </div>
        <Button className="w-full" variant="outline" onClick={print}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimer
        </Button>
      </DialogContent>
    </Dialog>
  );
}
