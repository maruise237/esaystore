import { useState } from "react";
import { Download, Printer, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { buildReceiptHtml, createReceiptPdf, shareReceiptPdf, type SaleReceipt } from "@/lib/receipt";

const format = (value: number, currency: string) => new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(value || 0);

export default function SaleReceiptDialog({ receipt, onOpenChange }: { receipt: SaleReceipt | null; onOpenChange: (open: boolean) => void }) {
  const [sharing, setSharing] = useState(false);
  const print = () => {
    if (!receipt) return;
    const printWindow = window.open("", "easystor-receipt", "width=480,height=720");
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(buildReceiptHtml(receipt));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };
  const share = async () => { if (!receipt) return; setSharing(true); try { await shareReceiptPdf(receipt); } catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) console.error("Partage du reçu impossible", error); } finally { setSharing(false); } };
  const download = () => { if (!receipt) return; const url = URL.createObjectURL(createReceiptPdf(receipt)); const link = document.createElement("a"); link.href = url; link.download = `recu-${receipt.saleNumber}.pdf`; link.click(); URL.revokeObjectURL(url); };
  return <Dialog open={Boolean(receipt)} onOpenChange={onOpenChange}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Vente enregistrée</DialogTitle><DialogDescription>Partagez le PDF dans WhatsApp, e-mail ou toute application proposée par votre appareil, ou imprimez-le.</DialogDescription></DialogHeader>{receipt && <div className="rounded-2xl bg-[#f7f6f1] p-4 text-sm"><div className="border-b border-[#e4e1d7] pb-3"><p className="font-serif text-lg">{receipt.shopName}</p><p className="mt-1 text-xs text-[#72766e]">{receipt.saleNumber} · {receipt.soldAt.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</p>{receipt.customerName && <p className="mt-1 text-xs text-[#72766e]">Client : {receipt.customerName}</p>}</div><div className="space-y-2 py-3">{receipt.lines.map((line) => <div key={`${line.name}-${line.unitPrice}`} className="flex justify-between gap-3"><span className="min-w-0 truncate">{line.name} × {line.quantity}</span><span className="shrink-0">{format(line.unitPrice * line.quantity, receipt.currency)}</span></div>)}</div><div className="border-t border-[#e4e1d7] pt-3"><div className="flex justify-between font-semibold"><span>Total</span><span>{format(receipt.total, receipt.currency)}</span></div>{receipt.pendingSync && <p className="mt-2 text-xs text-[#886922]">Ce reçu est provisoire jusqu’à la synchronisation de la vente hors ligne.</p>}</div></div>}<div className="grid gap-2 sm:grid-cols-2"><Button className="bg-[#415b3c]" onClick={share} disabled={sharing}>{sharing ? "Préparation…" : <><Share2 className="mr-2 h-4 w-4" />Partager le PDF</>}</Button><Button variant="outline" onClick={download}><Download className="mr-2 h-4 w-4" />Télécharger</Button></div><Button className="w-full" variant="outline" onClick={print}><Printer className="mr-2 h-4 w-4" />Imprimer</Button></DialogContent></Dialog>;
}
