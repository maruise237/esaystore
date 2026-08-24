import { useEffect, useState } from "react";
import { Download, Share, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useMobile";
import { isIosDevice, isStandaloneMode, shouldShowPwaInstallPrompt } from "@/lib/pwa";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISSED_KEY = "easystor-pwa-install-dismissed";

export default function PwaInstallPrompt() {
  const isMobile = useIsMobile();
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    setInstalled(isStandaloneMode(window.matchMedia?.("(display-mode: standalone)").matches ?? false, (navigator as Navigator & { standalone?: boolean }).standalone) || localStorage.getItem("easystor-pwa-installed") === "true");
    setDismissed(localStorage.getItem(DISMISSED_KEY) === "true");
    const onBeforeInstall = (event: Event) => { event.preventDefault(); setInstallEvent(event as BeforeInstallPromptEvent); };
    const onInstalled = () => { localStorage.setItem("easystor-pwa-installed", "true"); setInstalled(true); setInstallEvent(null); };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onBeforeInstall); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  const dismiss = () => { localStorage.setItem(DISMISSED_KEY, "true"); setDismissed(true); };
  const install = async () => {
    if (!installEvent) return;
    setInstalling(true);
    await installEvent.prompt();
    const result = await installEvent.userChoice;
    if (result.outcome === "accepted") setInstalled(true);
    else dismiss();
    setInstallEvent(null); setInstalling(false);
  };

  const ios = isIosDevice(navigator.userAgent, navigator.platform, navigator.maxTouchPoints);
  if (installed && isMobile) return <p className="fixed bottom-24 right-3 z-40 rounded-full border border-[#d7dfbe] bg-[#f8faef] px-3 py-1.5 text-xs font-semibold text-[#405a3e] shadow-sm lg:hidden" role="status">Mode application actif</p>;
  if (!shouldShowPwaInstallPrompt({ isMobile, installed, dismissed, hasInstallEvent: Boolean(installEvent), ios })) return null;
  return <aside className="fixed inset-x-3 bottom-24 z-40 mx-auto max-w-md rounded-2xl border border-[#d7dfbe] bg-[#f8faef] p-4 shadow-[0_16px_45px_rgba(30,41,36,0.22)] lg:hidden" role="status"><button onClick={dismiss} className="absolute right-3 top-3 rounded-md p-1 text-[#6a746a] hover:bg-[#e7edd8]" aria-label="Masquer l’invitation"><X className="h-4 w-4" /></button><div className="flex gap-3 pr-6"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#d1e980] text-[#24332a]"><Smartphone className="h-5 w-5" /></div><div><p className="font-semibold text-[#24332a]">Installez EASYSTOR</p><p className="mt-1 text-xs leading-relaxed text-[#5d695d]">{ios ? "Ajoutez l’application à votre écran d’accueil pour l’ouvrir comme une application, sans barre d’adresse." : "Ouvrez la caisse comme une application, sans barre d’adresse, même avec une connexion instable."}</p></div></div>{ios ? <div className="mt-3 rounded-xl bg-white px-3 py-2 text-xs text-[#536153]"><Share className="mr-1 inline h-3.5 w-3.5" /> Touchez <strong>Partager</strong>, puis <strong>Sur l’écran d’accueil</strong>.</div> : <Button onClick={install} disabled={installing} className="mt-3 w-full bg-[#405a3e] hover:bg-[#304a31]"><Download className="mr-2 h-4 w-4" />{installing ? "Ouverture…" : "Installer l’application"}</Button>}</aside>;
}
