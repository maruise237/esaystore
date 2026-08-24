import { useEffect, useState } from "react";
import { Download, Info, Share, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useMobile";
import { getPwaInstallSurface, isIosDevice, isStandaloneMode } from "@/lib/pwa";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function PwaInstallPrompt() {
  const isMobile = useIsMobile();
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const detectStandalone = () => setInstalled(isStandaloneMode(media.matches, (navigator as Navigator & { standalone?: boolean }).standalone));
    detectStandalone();
    const onBeforeInstall = (event: Event) => { event.preventDefault(); setInstallEvent(event as BeforeInstallPromptEvent); setDismissed(false); };
    const onInstalled = () => { setInstalled(true); setInstallEvent(null); };
    media.addEventListener?.("change", detectStandalone);
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => { media.removeEventListener?.("change", detectStandalone); window.removeEventListener("beforeinstallprompt", onBeforeInstall); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  const dismiss = () => setDismissed(true);
  const install = async () => {
    if (!installEvent) return;
    setInstalling(true);
    try {
      await installEvent.prompt();
      const result = await installEvent.userChoice;
      if (result.outcome === "accepted") setInstalled(true);
      else setDismissed(true);
    } finally {
      setInstallEvent(null);
      setInstalling(false);
    }
  };

  const ios = isIosDevice(navigator.userAgent, navigator.platform, navigator.maxTouchPoints);
  const surface = getPwaInstallSurface({ installed, dismissed, hasInstallEvent: Boolean(installEvent), ios, isMobile });
  if (surface === "none") return null;
  const description = surface === "ios" ? "Ajoutez l’application à votre écran d’accueil pour l’ouvrir sans barre d’adresse." : surface === "native" ? "Installez la véritable application EASYSTOR. Elle s’ouvrira dans sa propre fenêtre, sans barre d’adresse." : "Le navigateur ne propose pas encore l’invite native sur cette page. Utilisez uniquement l’option « Installer EASYSTOR » de son menu, jamais « Créer un raccourci ».";
  return <aside className="fixed inset-x-3 bottom-24 z-40 mx-auto max-w-md rounded-2xl border border-[#d7dfbe] bg-[#f8faef] p-4 shadow-[0_16px_45px_rgba(30,41,36,0.22)]" role="status"><button onClick={dismiss} className="absolute right-3 top-3 rounded-md p-1 text-[#6a746a] hover:bg-[#e7edd8]" aria-label="Masquer l’invitation"><X className="h-4 w-4" /></button><div className="flex gap-3 pr-6"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#d1e980] text-[#24332a]"><Smartphone className="h-5 w-5" /></div><div><p className="font-semibold text-[#24332a]">Installer EASYSTOR</p><p className="mt-1 text-xs leading-relaxed text-[#5d695d]">{description}</p></div></div>{surface === "ios" ? <div className="mt-3 rounded-xl bg-white px-3 py-2 text-xs text-[#536153]"><Share className="mr-1 inline h-3.5 w-3.5" /> Touchez <strong>Partager</strong>, puis <strong>Sur l’écran d’accueil</strong>.</div> : surface === "native" ? <Button onClick={install} disabled={installing} className="mt-3 w-full bg-[#405a3e] hover:bg-[#304a31]"><Download className="mr-2 h-4 w-4" />{installing ? "Ouverture…" : "Installer l’application"}</Button> : <div className="mt-3 flex items-start gap-2 rounded-xl bg-white px-3 py-2 text-xs text-[#536153]"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Ouvrez la version publiée en HTTPS dans Chrome ou Edge, puis cherchez <strong>Installer EASYSTOR</strong> dans le menu du navigateur.</div>}</aside>;
}
