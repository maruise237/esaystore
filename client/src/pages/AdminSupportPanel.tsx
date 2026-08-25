import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  Loader2,
  MessageCircle,
  Search,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

const statusLabels = {
  open: "Nouvelle",
  in_progress: "En cours",
  waiting_user: "Attente utilisateur",
  resolved: "Résolue",
  closed: "Clôturée",
} as const;
type SupportStatus = keyof typeof statusLabels;

const categoryLabels = {
  account: "Compte",
  technical: "Technique",
  data: "Données",
  payment: "Paiement",
  feature: "Évolution",
  other: "Autre",
} as const;

const dateTime = (value: Date | string) =>
  new Date(value).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

export default function AdminSupportPanel() {
  const utils = trpc.useUtils();
  const [status, setStatus] = useState<SupportStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const summary = trpc.support.adminSummary.useQuery();
  const tickets = trpc.support.adminList.useQuery({ query, status, limit: 50 });
  const detail = trpc.support.adminDetail.useQuery(
    { ticketId: selectedTicketId ?? "00000000-0000-4000-8000-000000000000" },
    { enabled: Boolean(selectedTicketId) }
  );
  const refresh = () => {
    utils.support.adminSummary.invalidate();
    utils.support.adminList.invalidate();
    utils.support.adminDetail.invalidate();
  };
  const replyMutation = trpc.support.adminReply.useMutation({
    onSuccess: () => {
      setReply("");
      setNotice("La réponse a été envoyée au demandeur.");
      refresh();
    },
  });
  const setStatusMutation = trpc.support.adminSetStatus.useMutation({
    onSuccess: (_, values) => {
      setNotice(
        `La demande est maintenant « ${statusLabels[values.status]} ».`
      );
      refresh();
    },
  });
  const selectedSummary = useMemo(
    () => tickets.data?.find(ticket => ticket.id === selectedTicketId),
    [tickets.data, selectedTicketId]
  );
  useEffect(() => {
    if (!selectedTicketId && tickets.data?.[0])
      setSelectedTicketId(tickets.data[0].id);
  }, [selectedTicketId, tickets.data]);
  const busy = replyMutation.isPending || setStatusMutation.isPending;
  const selectedStatus = detail.data?.ticket.status;

  return (
    <section
      className="mt-6 grid gap-5 xl:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.15fr)]"
      aria-label="Traitement des demandes de support"
    >
      <div className="space-y-5">
        <Card className="border-0 bg-[#1e2924] text-[#f7f5ee]">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#d1e980] text-[#1e2924]">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-serif text-2xl">Support utilisateur</h2>
                <p className="text-sm text-[#cdd6cc]">
                  Traitez les demandes sans quitter EASYSTOR Control.
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Summary value={summary.data?.open} label="Nouvelles" />
              <Summary value={summary.data?.inProgress} label="En cours" />
              <Summary value={summary.data?.waitingUser} label="En attente" />
              <Summary value={summary.data?.resolved} label="Résolues" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-white shadow-[0_10px_28px_rgba(43,47,38,0.05)]">
          <CardContent className="p-5">
            <Label htmlFor="admin-support-search" className="sr-only">
              Rechercher une demande
            </Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#52634d]" />
              <Input
                id="admin-support-search"
                className="pl-10"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="N° dossier, sujet ou demandeur…"
              />
            </div>
            <Label className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#4d5f4b]">
              Statut
              <select
                value={status}
                onChange={event =>
                  setStatus(event.target.value as SupportStatus | "all")
                }
                className="h-11 rounded-md border border-input bg-white px-3 text-base sm:h-10 sm:text-sm"
              >
                <option value="all">Tous</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Label>
            <div className="mt-4 max-h-[510px] space-y-2 overflow-y-auto pr-1">
              {tickets.isLoading ? (
                <p className="p-6 text-center text-sm text-[#5f665d]">
                  Chargement des demandes…
                </p>
              ) : (
                tickets.data?.map(ticket => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={cn(
                      "w-full rounded-xl border p-3 text-left",
                      selectedTicketId === ticket.id
                        ? "border-[#93af70] bg-[#edf5d8]"
                        : "border-[#e4e1d7] hover:bg-[#f7f8f3]"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <p className="min-w-0 flex-1 truncate font-semibold">
                        {ticket.subject}
                      </p>
                      <StatusBadge status={ticket.status} />
                    </div>
                    <p className="mt-1 truncate text-xs text-[#5f665d]">
                      {ticket.ticketNumber} ·{" "}
                      {ticket.requesterName ||
                        ticket.requesterEmail ||
                        "Utilisateur"}
                    </p>
                    <p className="mt-1 text-xs text-[#52634d]">
                      {categoryLabels[ticket.category]} ·{" "}
                      {dateTime(ticket.lastMessageAt)}
                    </p>
                  </button>
                ))
              )}
              {!tickets.isLoading && tickets.data?.length === 0 && (
                <p className="rounded-xl border border-dashed border-[#d8ddd1] p-6 text-center text-sm text-[#5f665d]">
                  Aucune demande ne correspond à ce filtre.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="border-0 bg-white shadow-[0_10px_28px_rgba(43,47,38,0.05)]">
        <CardContent className="p-5 sm:p-6">
          {notice && (
            <p
              role="status"
              className="mb-4 rounded-xl bg-[#e7f3b5] px-3 py-2 text-sm text-[#334a30]"
            >
              {notice}
            </p>
          )}
          {(summary.error || tickets.error || detail.error) && (
            <p
              role="alert"
              className="mb-4 rounded-xl bg-[#fff0ed] px-3 py-2 text-sm text-red-800"
            >
              {summary.error?.message ||
                tickets.error?.message ||
                detail.error?.message}
            </p>
          )}
          {detail.isLoading && (
            <p className="py-24 text-center text-sm text-[#5f665d]">
              Chargement de la conversation…
            </p>
          )}
          {detail.data && (
            <>
              <div className="flex flex-col gap-3 border-b border-[#e4e1d7] pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-serif text-2xl">
                      {selectedSummary?.subject ||
                        detail.data.ticket.ticketNumber}
                    </h2>
                    <StatusBadge status={detail.data.ticket.status} />
                  </div>
                  <p className="mt-1 text-sm text-[#4d5f4b]">
                    {selectedSummary?.requesterName ||
                      selectedSummary?.requesterEmail ||
                      "Utilisateur"}{" "}
                    · {selectedSummary?.shopName || "Aucune boutique associée"}
                  </p>
                  <p className="mt-1 text-xs text-[#5f665d]">
                    {detail.data.ticket.ticketNumber}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={
                      busy ||
                      selectedStatus === "in_progress" ||
                      selectedStatus === "closed"
                    }
                    onClick={() =>
                      setStatusMutation.mutate({
                        ticketId: detail.data.ticket.id,
                        status: "in_progress",
                      })
                    }
                  >
                    Prendre en charge
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={
                      busy ||
                      selectedStatus === "resolved" ||
                      selectedStatus === "closed"
                    }
                    onClick={() =>
                      setStatusMutation.mutate({
                        ticketId: detail.data.ticket.id,
                        status: "resolved",
                      })
                    }
                  >
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                    Résoudre
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#bf7b69] text-[#9c4d3b]"
                    disabled={busy || selectedStatus === "closed"}
                    onClick={() =>
                      setStatusMutation.mutate({
                        ticketId: detail.data.ticket.id,
                        status: "closed",
                      })
                    }
                  >
                    Clôturer
                  </Button>
                </div>
              </div>
              <div className="mt-5 max-h-[430px] space-y-3 overflow-y-auto pr-1">
                {detail.data.messages.map(item => (
                  <article
                    key={item.id}
                    className={cn(
                      "rounded-2xl p-4 text-sm",
                      item.authorType === "admin"
                        ? "ml-6 bg-[#e7f3b5] text-[#334a30]"
                        : "mr-6 bg-[#fbfbf8] ring-1 ring-[#e4e1d7]"
                    )}
                  >
                    <p className="text-xs font-bold uppercase tracking-wide opacity-75">
                      {item.authorType === "admin"
                        ? "Vous · Support"
                        : item.authorName ||
                          item.authorEmail ||
                          "Utilisateur"}{" "}
                      · {dateTime(item.createdAt)}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                      {item.body}
                    </p>
                  </article>
                ))}
              </div>
              {selectedStatus === "closed" ? (
                <p className="mt-5 rounded-xl bg-[#eff2e8] p-3 text-sm text-[#4d5f4b]">
                  Cette demande est clôturée. Elle reste consultable dans le
                  dossier.
                </p>
              ) : (
                <form
                  className="mt-5 grid gap-2"
                  onSubmit={event => {
                    event.preventDefault();
                    replyMutation.mutate({
                      ticketId: detail.data.ticket.id,
                      body: reply,
                    });
                  }}
                >
                  <Label htmlFor="admin-support-reply">
                    Répondre au demandeur
                  </Label>
                  <Textarea
                    id="admin-support-reply"
                    value={reply}
                    onChange={event => setReply(event.target.value)}
                    minLength={2}
                    maxLength={5000}
                    required
                    rows={4}
                    placeholder="Apportez une réponse claire ou demandez une précision."
                  />
                  {replyMutation.error && (
                    <p role="alert" className="text-sm text-red-700">
                      {replyMutation.error.message}
                    </p>
                  )}
                  <Button
                    type="submit"
                    className="w-fit bg-[#405a3e]"
                    disabled={busy || reply.trim().length < 2}
                  >
                    {replyMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Send className="mr-2 h-4 w-4" />
                    Envoyer la réponse
                  </Button>
                </form>
              )}
            </>
          )}
          {!selectedTicketId && !tickets.isLoading && (
            <div className="grid min-h-[380px] place-items-center text-center">
              <div>
                <CircleAlert className="mx-auto h-8 w-8 text-[#52634d]" />
                <p className="mt-3 text-sm text-[#4d5f4b]">
                  Sélectionnez une demande pour la traiter.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function Summary({ value, label }: { value?: number; label: string }) {
  return (
    <div className="rounded-xl bg-white/[0.08] px-3 py-2">
      <p className="font-serif text-2xl text-[#d1e980]">{value ?? "–"}</p>
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#cdd6cc]">
        {label}
      </p>
    </div>
  );
}
function StatusBadge({ status }: { status: SupportStatus }) {
  const tone =
    status === "closed" || status === "resolved"
      ? "bg-[#e7f3b5] text-[#334a30]"
      : status === "waiting_user"
        ? "bg-[#fff0df] text-[#704916]"
        : "bg-[#edf4f0] text-[#285446]";
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-1 text-[10px] font-bold",
        tone
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
