import React, { useEffect, useState } from "react";
import { RefreshCw, TriangleAlert, Wifi, WifiOff } from "lucide-react";
import { conflictCount, drainOutbox, pendingCount } from "@/lib/offline";
import { cn } from "@/lib/utils";

export default function SyncStatus() {
  const [state, setState] = useState({ online: typeof navigator === "undefined" ? true : navigator.onLine, pending: 0, conflicts: 0, syncing: false });
  const refresh = async () => {
    const [pending, conflicts] = await Promise.all([pendingCount(), conflictCount()]);
    setState((current) => ({ ...current, online: navigator.onLine, pending, conflicts }));
  };
  useEffect(() => { refresh(); window.addEventListener("online", refresh); window.addEventListener("offline", refresh); window.addEventListener("easystor-sync-status", refresh); return () => { window.removeEventListener("online", refresh); window.removeEventListener("offline", refresh); window.removeEventListener("easystor-sync-status", refresh); }; }, []);
  const trigger = async () => { setState((current) => ({ ...current, syncing: true })); await drainOutbox(); await refresh(); setState((current) => ({ ...current, syncing: false })); };
  const detail = state.conflicts
    ? `${state.conflicts} conflit${state.conflicts > 1 ? "s" : ""}`
    : state.pending
      ? `${state.pending} en attente`
      : state.syncing
        ? "Synchronisation"
        : null;
  const networkLabel = state.online ? "Online" : "Hors ligne";
  const NetworkIcon = state.online ? Wifi : WifiOff;
  return (
    <button
      aria-label={detail ? `${networkLabel} — ${detail}` : networkLabel}
      disabled={!state.online || state.syncing}
      onClick={trigger}
      className={cn(
        "flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-bold transition-[background-color,border-color,color,box-shadow] duration-150 ease-out motion-reduce:transition-none",
        !state.online
          ? "border-[#f1b6a9] bg-[#fce8e3] text-[#a33d2c]"
          : "border-[#a7c58d] bg-[#e9f5dc] text-[#2f6e42] hover:border-[#79a968] hover:bg-[#dff0cf]"
      )}
    >
      <NetworkIcon className="h-4 w-4 shrink-0" strokeWidth={2.2} aria-hidden="true" />
      <span>{networkLabel}</span>
      {detail && (
        <span className="ml-0.5 inline-flex items-center gap-1 border-l border-current/25 pl-1.5 font-semibold opacity-85">
          {state.conflicts ? <TriangleAlert className="h-3 w-3" aria-hidden="true" /> : null}
          {state.pending || state.syncing ? <RefreshCw className={cn("h-3 w-3", state.syncing && "animate-spin")} aria-hidden="true" /> : null}
          {detail}
        </span>
      )}
    </button>
  );
}
