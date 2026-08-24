import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, ScanLine, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type NativeBarcode = { rawValue?: string };
type NativeBarcodeDetector = { detect: (source: HTMLVideoElement) => Promise<NativeBarcode[]> };
type NativeBarcodeDetectorConstructor = new (options?: { formats?: string[] }) => NativeBarcodeDetector;

function nativeDetector() {
  return (globalThis as typeof globalThis & { BarcodeDetector?: NativeBarcodeDetectorConstructor }).BarcodeDetector;
}

function cameraMessage(error: unknown) {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "L’accès à la caméra a été refusé. Autorisez-la dans les réglages du navigateur, puis réessayez.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "Aucune caméra compatible n’a été trouvée sur cet appareil.";
  if (name === "NotReadableError") return "La caméra est déjà utilisée par une autre application.";
  return "Le scanner n’a pas pu démarrer. Vous pouvez toujours saisir ou rechercher le code manuellement.";
}

export default function BarcodeScannerDialog({ open, onOpenChange, onDetected }: { open: boolean; onOpenChange: (open: boolean) => void; onDetected: (barcode: string) => boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<"starting" | "scanning" | "not-found" | "error">("starting");
  const [message, setMessage] = useState("");
  const [detectedCode, setDetectedCode] = useState("");

  useEffect(() => {
    if (!open) return;
    let stopped = false;
    let locked = false;
    let stream: MediaStream | undefined;
    let timer: number | undefined;
    setStatus("starting"); setMessage(""); setDetectedCode("");

    const start = async () => {
      const Detector = nativeDetector();
      if (!Detector) { setStatus("error"); setMessage("Le scan caméra n’est pas pris en charge par ce navigateur. Utilisez Chrome récent sur Android ou saisissez le code manuellement."); return; }
      if (!navigator.mediaDevices?.getUserMedia || !videoRef.current) { setStatus("error"); setMessage("Le navigateur de cet appareil ne permet pas l’accès à la caméra."); return; }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
        if (stopped || !videoRef.current) { stream.getTracks().forEach((track) => track.stop()); return; }
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const detector = new Detector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "codabar", "itf"] });
        setStatus("scanning");
        const scanFrame = async () => {
          if (stopped || !videoRef.current || locked) return;
          try {
            const found = await detector.detect(videoRef.current);
            const code = found[0]?.rawValue?.trim();
            if (code) {
              locked = true; setDetectedCode(code); stream?.getTracks().forEach((track) => track.stop());
              if (onDetected(code)) { onOpenChange(false); return; }
              setStatus("not-found"); setMessage("Ce code ne correspond à aucun produit actif de la boutique."); return;
            }
          } catch {
            // Une image partiellement décodée ne doit pas interrompre le flux de scan.
          }
          timer = window.setTimeout(scanFrame, 180);
        };
        scanFrame();
      } catch (error) {
        if (!stopped) { setStatus("error"); setMessage(cameraMessage(error)); }
      }
    };
    start();
    return () => { stopped = true; if (timer) window.clearTimeout(timer); stream?.getTracks().forEach((track) => track.stop()); };
  }, [open, onDetected, onOpenChange]);

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-lg border-0 bg-[#1e2924] p-5 text-[#f7f7ef] sm:p-6" showCloseButton={false}><DialogHeader><DialogTitle className="flex items-center gap-2 font-serif text-2xl"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#d1e980] text-[#24332a]"><ScanLine className="h-5 w-5" /></span>Scanner un produit</DialogTitle><DialogDescription className="text-[#c7d2c7]">Cadrez le code-barres avec la caméra arrière. La détection ajoute immédiatement l’article au panier.</DialogDescription></DialogHeader><div className="relative mt-2 overflow-hidden rounded-2xl border border-white/15 bg-black"><video ref={videoRef} autoPlay muted playsInline className="aspect-video w-full object-cover" /><div className="pointer-events-none absolute inset-[16%_9%] rounded-xl border-2 border-[#d1e980] shadow-[0_0_0_999px_rgba(0,0,0,0.22)]" />{status === "starting" && <div className="absolute inset-0 grid place-items-center bg-black/45"><div className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" />Activation de la caméra…</div></div>}</div>{status === "scanning" && <p className="mt-3 text-center text-xs text-[#c7d2c7]">Pointez la caméra vers un EAN, UPC ou Code 128.</p>}{(status === "not-found" || status === "error") && <div className="mt-4 rounded-xl bg-[#fff4d9] p-3 text-sm text-[#735416]"><div className="flex gap-2"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /><div><p>{message}</p>{detectedCode && <p className="mt-1 font-mono text-xs">Code détecté : {detectedCode}</p>}</div></div></div>}<div className="mt-4 flex justify-end gap-3"><Button variant="outline" onClick={() => onOpenChange(false)} className="border-white/25 text-white hover:bg-white/10 hover:text-white">Fermer</Button>{(status === "not-found" || status === "error") && <Button onClick={() => { onOpenChange(false); setTimeout(() => onOpenChange(true), 100); }} className="bg-[#d1e980] text-[#24332a] hover:bg-[#e0eeaa]"><Camera className="mr-2 h-4 w-4" />Réessayer</Button>}</div></DialogContent></Dialog>;
}
