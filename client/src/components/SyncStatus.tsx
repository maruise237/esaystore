import { useEffect, useState } from "react";
import { Cloud, CloudOff, RefreshCw, TriangleAlert } from "lucide-react";
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
  const label = !state.online ? "Hors ligne" : state.conflicts ? `${state.conflicts} conflit${state.conflicts > 1 ? "s" : ""}` : state.pending ? `${state.pending} en attente` : "À jour";
  const Icon = !state.online ? CloudOff : state.conflicts ? TriangleAlert : state.pending ? RefreshCw : Cloud;
  return <button onClick={trigger} disabled={!state.online || state.syncing} className={cn("flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition", !state.online ? "bg-[#f8ddd6] text-[#9b4e3f]" : state.conflicts ? "bg-[#fdeac6] text-[#895a18]" : state.pending ? "bg-[#e7f3b5] text-[#365435]" : "bg-white/10 text-[#cdd6cc]")}><Icon className={cn("h-3.5 w-3.5", state.syncing && "animate-spin")} />{label}</button>;
}
