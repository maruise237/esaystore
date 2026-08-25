import { useEffect, useState } from "react";
import { AlertTriangle, Cloud, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  drainOutbox,
  offlineDb,
  removeOutboxItem,
  retryOutboxItem,
} from "@/lib/offline";

export default function SyncPanel() {
  const [pending, setPending] = useState<
    Array<{
      id?: number;
      operationId: string;
      kind: string;
      attempts: number;
      lastError?: string;
      createdAt: Date;
    }>
  >([]);
  const [conflicts, setConflicts] = useState<
    Array<{
      id?: number;
      operationId: string;
      kind: string;
      message: string;
      createdAt: Date;
    }>
  >([]);
  const [syncing, setSyncing] = useState(false);
  const refresh = async () => {
    setPending(await offlineDb.outbox.toArray());
    setConflicts(await offlineDb.conflicts.toArray());
  };
  useEffect(() => {
    refresh();
    window.addEventListener("easystor-sync-status", refresh);
    return () => window.removeEventListener("easystor-sync-status", refresh);
  }, []);
  const sync = async () => {
    setSyncing(true);
    await drainOutbox();
    await refresh();
    setSyncing(false);
  };
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="border-0 bg-[#e9f0e3]">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-[#4e6b48]" />
              <p className="font-serif text-xl">Opérations à synchroniser</p>
            </div>
            <Button
              className="w-full sm:w-auto"
              size="sm"
              aria-label={syncing ? "Synchronisation en cours" : "Synchroniser"}
              onClick={sync}
              disabled={syncing || !navigator.onLine}
            >
              {syncing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                "Synchroniser"
              )}
            </Button>
          </div>
          <p className="mt-2 text-sm text-[#6f786e]">
            {navigator.onLine
              ? "La connexion est disponible."
              : "Hors ligne : les opérations restent en sécurité sur cet appareil."}
          </p>
          <div className="mt-5 space-y-3">
            {pending.map(item => (
              <article key={item.id} className="rounded-xl bg-white/75 p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold capitalize">
                      {item.kind}
                    </p>
                    <p className="mt-1 text-xs text-[#77776c]">
                      Tentatives : {item.attempts} ·{" "}
                      {new Date(item.createdAt).toLocaleString("fr-FR")}
                    </p>
                    {item.lastError && (
                      <p
                        role="alert"
                        className="mt-1 break-words text-xs text-red-600"
                      >
                        {item.lastError}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-[1fr_auto] gap-1 sm:flex">
                    <Button
                      className="w-full sm:w-auto"
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        await retryOutboxItem(item.id!);
                        await sync();
                      }}
                    >
                      Réessayer
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Abandonner cette opération"
                      onClick={async () => {
                        await removeOutboxItem(item.id!);
                        await refresh();
                      }}
                      title="Abandonner"
                    >
                      <Trash2 className="h-4 w-4 text-[#a55b4b]" />
                    </Button>
                  </div>
                </div>
              </article>
            ))}
            {pending.length === 0 && (
              <p className="py-8 text-center text-sm text-[#6f786e]">
                Aucune opération en attente.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      <Card className="border-0 bg-white shadow-[0_12px_30px_rgba(43,47,38,0.05)]">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[#a97120]" />
            <div>
              <p className="font-serif text-xl">Conflits à résoudre</p>
              <p className="mt-1 text-xs text-[#85877f]">
                Une vente reste enregistrée localement ; son envoi doit être
                revu.
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {conflicts.map(item => (
              <article
                key={item.id}
                className="rounded-xl border border-[#f0d49d] bg-[#fff8e8] p-4"
              >
                <p className="font-semibold capitalize">{item.kind}</p>
                <p className="mt-1 break-words text-sm text-[#7f652d]">
                  {item.message}
                </p>
                <div className="mt-3 grid gap-2 sm:flex">
                  <Button
                    className="w-full sm:w-auto"
                    size="sm"
                    onClick={async () => {
                      const outbox = await offlineDb.outbox
                        .where("operationId")
                        .equals(item.operationId)
                        .first();
                      if (outbox?.id) await retryOutboxItem(outbox.id);
                      await sync();
                    }}
                  >
                    Réessayer
                  </Button>
                  <Button
                    className="w-full sm:w-auto"
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await offlineDb.conflicts.delete(item.id!);
                      await refresh();
                    }}
                  >
                    Masquer
                  </Button>
                </div>
              </article>
            ))}
            {conflicts.length === 0 && (
              <p className="py-8 text-center text-sm text-[#85877f]">
                Aucun conflit détecté.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
