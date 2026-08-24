import { useCallback, useEffect, useState } from "react";
import { Barcode, ClipboardPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listUnknownBarcodes, offlineDb, type UnknownBarcode } from "@/lib/offline";

export default function UnknownBarcodeQueue({ shopId, onPrepareProduct }: { shopId: string; onPrepareProduct: (barcode: string) => void }) {
  const [entries, setEntries] = useState<UnknownBarcode[]>([]);
  const refresh = useCallback(() => { listUnknownBarcodes(shopId).then(setEntries); }, [shopId]);
  useEffect(() => { refresh(); window.addEventListener("easystor-unknown-barcodes", refresh); return () => window.removeEventListener("easystor-unknown-barcodes", refresh); }, [refresh]);
  if (!entries.length) return null;
  return <Card className="mt-6 border-0 bg-[#fff7e8] shadow-[0_12px_30px_rgba(43,47,38,0.05)]"><CardContent className="p-5 sm:p-6"><div className="flex items-start gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#fde1a1] text-[#6f4d18]"><Barcode className="h-5 w-5" /></div><div><p className="font-serif text-xl">Codes à compléter</p><p className="mt-1 text-xs text-[#83735a]">Ces codes n’ont pas encore de produit associé. Préremplissez le catalogue lorsque vous êtes prêt.</p></div></div><div className="mt-5 space-y-2">{entries.map((entry) => <div key={entry.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#f0dfbd] bg-white/70 px-3 py-3"><div><p className="font-mono text-sm font-semibold text-[#4d3b1c]">{entry.barcode}</p><p className="mt-1 text-xs text-[#88785f]">{entry.occurrences} détection{entry.occurrences > 1 ? "s" : ""} · dernière : {entry.lastSeenAt.toLocaleDateString("fr-FR")}</p></div><div className="flex gap-2"><Button size="sm" onClick={() => onPrepareProduct(entry.barcode)} className="bg-[#8c6430] hover:bg-[#714c20]"><ClipboardPlus className="mr-1.5 h-3.5 w-3.5" />Créer</Button><Button size="icon" variant="outline" aria-label={`Supprimer le code ${entry.barcode}`} onClick={async () => { await offlineDb.unknownBarcodes.delete(entry.id!); refresh(); }}><Trash2 className="h-4 w-4" /></Button></div></div>)}</div></CardContent></Card>;
}
