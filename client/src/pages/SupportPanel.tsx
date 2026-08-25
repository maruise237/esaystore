import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CircleHelp,
  Loader2,
  MessageCircle,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

const categoryLabels = {
  account: "Compte et accès",
  technical: "Problème technique",
  data: "Données, stock ou ventes",
  payment: "Paiement",
  feature: "Suggestion d’amélioration",
  other: "Autre demande",
} as const;

const statusLabels = {
  open: "Nouvelle demande",
  in_progress: "En cours de traitement",
  waiting_user: "Votre réponse est attendue",
  resolved: "Résolue",
  closed: "Clôturée",
} as const;
const priorityLabels = {
  low: "Basse",
  medium: "Moyenne",
  high: "Haute",
} as const;

type TicketStatus = keyof typeof statusLabels;
type TicketPriority = keyof typeof priorityLabels;

const dateTime = (value: Date | string) =>
  new Date(value).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

export default function SupportPanel({
  shops,
}: {
  shops: Array<{ id: string; name: string }>;
}) {
  const utils = trpc.useUtils();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [category, setCategory] =
    useState<keyof typeof categoryLabels>("technical");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [shopId, setShopId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const tickets = trpc.support.mine.useQuery({ status: "all" });
  const selectedTicket = trpc.support.detail.useQuery(
    { ticketId: selectedTicketId ?? "00000000-0000-4000-8000-000000000000" },
    { enabled: Boolean(selectedTicketId) }
  );
  const createTicket = trpc.support.create.useMutation({
    onSuccess: ticket => {
      setSubject("");
      setMessage("");
      setShopId("");
      setNotice(
        `Votre demande ${ticket.ticketNumber} a été envoyée au support.`
      );
      setSelectedTicketId(ticket.id);
      utils.support.mine.invalidate();
    },
  });
  const sendReply = trpc.support.reply.useMutation({
    onSuccess: () => {
      setReply("");
      setNotice("Votre réponse a été ajoutée à la demande.");
      utils.support.detail.invalidate();
      utils.support.mine.invalidate();
    },
  });
  const closeTicket = trpc.support.close.useMutation({
    onSuccess: () => {
      setNotice("La demande a été clôturée.");
      utils.support.detail.invalidate();
      utils.support.mine.invalidate();
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

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    createTicket.mutate({
      category,
      priority,
      shopId: shopId || undefined,
      subject,
      message,
    });
  };

  const isClosed = selectedTicket.data?.ticket.status === "closed";
  const busy =
    createTicket.isPending || sendReply.isPending || closeTicket.isPending;

  return (
    <section
      className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
      aria-label="Assistance EASYSTOR"
    >
      <div className="space-y-5">
        <Card className="border-0 bg-[#1e2924] text-[#f7f5ee] shadow-[0_16px_34px_rgba(30,41,36,0.16)]">
          <CardContent className="p-5 sm:p-6">
            <CircleHelp className="h-7 w-7 text-[#d1e980]" />
            <h2 className="mt-4 font-serif text-2xl">
              Comment pouvons-nous vous aider ?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#cdd6cc]">
              Expliquez votre besoin. Vous retrouverez ici toutes les réponses
              du support, même si vous changez d’appareil.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-[0_10px_28px_rgba(43,47,38,0.05)]">
          <CardContent className="p-5 sm:p-6">
            <h2 className="font-serif text-2xl">Nouvelle demande</h2>
            <form className="mt-5 grid gap-4" onSubmit={submit}>
              <div className="grid gap-2">
                <Label htmlFor="support-category">Motif</Label>
                <select
                  id="support-category"
                  value={category}
                  onChange={event =>
                    setCategory(
                      event.target.value as keyof typeof categoryLabels
                    )
                  }
                  className="h-11 rounded-md border border-input bg-white px-3 text-base sm:text-sm"
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="support-shop">
                  Boutique concernée{" "}
                  <span className="font-normal text-[#5f665d]">
                    (facultatif)
                  </span>
                </Label>
                <select
                  id="support-shop"
                  value={shopId}
                  onChange={event => setShopId(event.target.value)}
                  className="h-11 rounded-md border border-input bg-white px-3 text-base sm:text-sm"
                >
                  <option value="">Aucune boutique précise</option>
                  {shops.map(shop => (
                    <option key={shop.id} value={shop.id}>
                      {shop.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="support-priority">Priorité</Label>
                <select
                  id="support-priority"
                  value={priority}
                  onChange={event =>
                    setPriority(event.target.value as TicketPriority)
                  }
                  className="h-11 rounded-md border border-input bg-white px-3 text-base sm:text-sm"
                >
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[#5f665d]">
                  Choisissez « Haute » seulement si votre activité est bloquée.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="support-subject">Sujet</Label>
                <Input
                  id="support-subject"
                  value={subject}
                  onChange={event => setSubject(event.target.value)}
                  minLength={3}
                  maxLength={180}
                  required
                  placeholder="Ex. Je ne retrouve pas une vente"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="support-message">Décrivez le besoin</Label>
                <Textarea
                  id="support-message"
                  value={message}
                  onChange={event => setMessage(event.target.value)}
                  minLength={5}
                  maxLength={5000}
                  required
                  placeholder="Décrivez ce qui s’est passé, ce que vous attendiez et le moment où le problème apparaît."
                  rows={5}
                />
              </div>
              {createTicket.error && (
                <p role="alert" className="text-sm text-red-700">
                  {createTicket.error.message}
                </p>
              )}
              <Button
                type="submit"
                className="bg-[#405a3e]"
                disabled={createTicket.isPending}
              >
                {createTicket.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Send className="mr-2 h-4 w-4" />
                Envoyer au support
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 bg-white shadow-[0_10px_28px_rgba(43,47,38,0.05)]">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-2xl">Mes demandes</h2>
              <p className="mt-1 text-sm text-[#4d5f4b]">
                Suivez leur traitement et répondez au support.
              </p>
            </div>
            <MessageCircle className="h-6 w-6 text-[#405a3e]" />
          </div>
          {notice && (
            <p
              role="status"
              className="mt-4 rounded-xl bg-[#e7f3b5] px-3 py-2 text-sm text-[#334a30]"
            >
              {notice}
            </p>
          )}
          {tickets.error && (
            <p role="alert" className="mt-4 text-sm text-red-700">
              {tickets.error.message}
            </p>
          )}
          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(180px,0.8fr)_minmax(0,1.2fr)]">
            <div
              className="max-h-[530px] space-y-2 overflow-y-auto pr-1"
              aria-label="Liste de vos demandes"
            >
              {tickets.isLoading ? (
                <p className="p-5 text-center text-sm text-[#5f665d]">
                  Chargement…
                </p>
              ) : (
                tickets.data?.map(ticket => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={cn(
                      "w-full rounded-xl border p-3 text-left transition-colors",
                      selectedTicketId === ticket.id
                        ? "border-[#93af70] bg-[#edf5d8]"
                        : "border-[#e4e1d7] hover:bg-[#f7f8f3]"
                    )}
                  >
                    <div className="flex gap-2">
                      <p className="min-w-0 flex-1 truncate font-semibold">
                        {ticket.subject}
                      </p>
                      <TicketPriorityBadge priority={ticket.priority} />
                      <TicketStatusBadge status={ticket.status} />
                    </div>
                    <p className="mt-1 text-xs text-[#5f665d]">
                      {ticket.ticketNumber} · {dateTime(ticket.lastMessageAt)}
                    </p>
                  </button>
                ))
              )}
              {!tickets.isLoading && tickets.data?.length === 0 && (
                <p className="rounded-xl border border-dashed border-[#d8ddd1] p-5 text-center text-sm text-[#5f665d]">
                  Aucune demande pour le moment.
                </p>
              )}
            </div>
            <div className="min-h-[300px] rounded-2xl border border-[#e4e1d7] bg-[#fbfbf8] p-4">
              {selectedTicket.isLoading && (
                <p className="py-16 text-center text-sm text-[#5f665d]">
                  Chargement de la conversation…
                </p>
              )}
              {selectedTicket.error && (
                <p role="alert" className="text-sm text-red-700">
                  {selectedTicket.error.message}
                </p>
              )}
              {selectedTicket.data && (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#e4e1d7] pb-3">
                    <div>
                      <p className="font-semibold">
                        {selectedSummary?.subject ||
                          selectedTicket.data.ticket.ticketNumber}
                      </p>
                      <p className="mt-1 text-xs text-[#5f665d]">
                        {selectedTicket.data.ticket.ticketNumber}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <TicketPriorityBadge
                        priority={selectedTicket.data.ticket.priority}
                      />
                      <TicketStatusBadge
                        status={selectedTicket.data.ticket.status}
                      />
                    </div>
                  </div>
                  <div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
                    {selectedTicket.data.messages.map(item => (
                      <article
                        key={item.id}
                        className={cn(
                          "rounded-2xl p-3 text-sm",
                          item.authorType === "user"
                            ? "ml-5 bg-[#e7f3b5] text-[#334a30]"
                            : "mr-5 bg-white ring-1 ring-[#e4e1d7]"
                        )}
                      >
                        <p className="text-xs font-bold uppercase tracking-wide opacity-75">
                          {item.authorType === "user"
                            ? "Vous"
                            : "Support EASYSTOR"}{" "}
                          · {dateTime(item.createdAt)}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                          {item.body}
                        </p>
                      </article>
                    ))}
                  </div>
                  {isClosed ? (
                    <p className="mt-4 rounded-xl bg-[#eff2e8] p-3 text-sm text-[#4d5f4b]">
                      Cette demande est clôturée. Créez une nouvelle demande si
                      vous avez encore besoin d’aide.
                    </p>
                  ) : (
                    <form
                      className="mt-4 grid gap-2"
                      onSubmit={event => {
                        event.preventDefault();
                        sendReply.mutate({
                          ticketId: selectedTicket.data.ticket.id,
                          body: reply,
                        });
                      }}
                    >
                      <Label htmlFor="support-reply">Répondre au support</Label>
                      <Textarea
                        id="support-reply"
                        value={reply}
                        onChange={event => setReply(event.target.value)}
                        minLength={2}
                        maxLength={5000}
                        required
                        rows={3}
                        placeholder="Ajoutez une précision ou répondez à la question du support."
                      />
                      {sendReply.error && (
                        <p role="alert" className="text-sm text-red-700">
                          {sendReply.error.message}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="submit"
                          className="bg-[#405a3e]"
                          disabled={busy || reply.trim().length < 2}
                        >
                          {sendReply.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Envoyer la réponse
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            closeTicket.mutate({
                              ticketId: selectedTicket.data.ticket.id,
                            })
                          }
                          disabled={busy}
                        >
                          {closeTicket.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Clôturer
                        </Button>
                      </div>
                    </form>
                  )}
                </>
              )}
              {!selectedTicketId && !tickets.isLoading && (
                <p className="py-16 text-center text-sm text-[#5f665d]">
                  Sélectionnez une demande pour lire la conversation.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function TicketStatusBadge({ status }: { status: TicketStatus }) {
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

function TicketPriorityBadge({ priority }: { priority: TicketPriority }) {
  const tone =
    priority === "high"
      ? "bg-[#fff0ed] text-[#9c4d3b]"
      : priority === "medium"
        ? "bg-[#fff0df] text-[#704916]"
        : "bg-[#edf4f0] text-[#285446]";
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-1 text-[10px] font-bold",
        tone
      )}
    >
      {priorityLabels[priority]}
    </span>
  );
}
