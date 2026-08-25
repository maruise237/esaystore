import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isStandaloneMode } from "@/lib/pwa";
import { shouldShowPwaUpdate } from "@/lib/pwaUpdate";

export default function PwaUpdatePrompt() {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;

    const media = window.matchMedia("(display-mode: standalone)");
    const standalone = isStandaloneMode(
      media.matches,
      (navigator as Navigator & { standalone?: boolean }).standalone
    );
    let hadExistingController = Boolean(navigator.serviceWorker.controller);

    const onControllerChange = () => {
      if (shouldShowPwaUpdate({ standalone, hadExistingController })) {
        setUpdateReady(true);
      }
      hadExistingController = true;
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    navigator.serviceWorker
      .register("/sw.js")
      .then(registration => registration.update())
      .catch(() => {
        // L’application reste utilisable même si le navigateur refuse le service worker.
      });

    return () =>
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange
      );
  }, []);

  if (!updateReady) return null;

  return (
    <aside
      className="fixed inset-x-3 bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] z-50 mx-auto max-w-md rounded-2xl border border-[#bace7e] bg-[#f8faef] p-4 text-[#24332a] shadow-[0_16px_45px_rgba(30,41,36,0.22)] sm:bottom-4 sm:left-auto sm:right-4 sm:mx-0"
      role="status"
      aria-live="polite"
    >
      <div className="flex gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#d1e980]">
          <RefreshCw className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="font-semibold">Mise à jour prête</p>
          <p className="mt-1 text-xs leading-relaxed text-[#536153]">
            Actualisez maintenant pour utiliser la dernière version d’EASYSTOR.
          </p>
        </div>
      </div>
      <Button
        onClick={() => window.location.reload()}
        className="mt-3 w-full bg-[#405a3e] hover:bg-[#304a31]"
      >
        <RefreshCw className="mr-2 h-4 w-4" /> Actualiser l’application
      </Button>
    </aside>
  );
}
