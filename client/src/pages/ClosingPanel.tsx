import React, { useEffect, useState } from "react";
import { CircleCheck, Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";

const money = (value: number, currency: string) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);
const today = () => new Date().toISOString().slice(0, 10);

export default function ClosingPanel({
  shopId,
  currency,
}: {
  shopId: string;
  currency: string;
}) {
  const [businessDate, setBusinessDate] = useState(today);
  const [declaredCash, setDeclaredCash] = useState("");
  const utils = trpc.useUtils();
  const preview = trpc.closing.preview.useQuery({ shopId, businessDate });
  const history = trpc.closing.list.useQuery({ shopId });
  const close = trpc.closing.close.useMutation({
    onSuccess: () => {
      utils.closing.preview.invalidate({ shopId, businessDate });
      utils.closing.list.invalidate({ shopId });
    },
  });
  useEffect(() => {
    if (preview.data && !preview.data.closure)
      setDeclaredCash(String(preview.data.expected_cash));
  }, [preview.data, businessDate]);
  if (preview.isLoading)
    return (
      <div className="grid min-h-[280px] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#405a3e]" />
      </div>
    );
  const data = preview.data;
  const declared = Number(declaredCash) || 0;
  const difference = declared - (data?.expected_cash ?? 0);
  const closed = Boolean(data?.closure);
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="border-0 bg-white shadow-[0_12px_30px_rgba(43,47,38,0.05)]">
        <CardContent className="p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e7f3b5] text-[#405a3e]">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-serif text-2xl">Résumé de caisse</p>
                  <p className="text-xs text-[#7d8077]">
                    Les transactions enregistrées pour la journée sélectionnée.
                  </p>
                </div>
              </div>
            </div>
            <label className="grid gap-1 text-xs font-semibold text-[#66705f]">
              Date de clôture
              <Input
                type="date"
                value={businessDate}
                max={today()}
                onChange={event => setBusinessDate(event.target.value)}
              />
            </label>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Ventes" value={String(data?.sale_count ?? 0)} />
            <Metric
              label="Chiffre d’affaires"
              value={money(data?.turnover ?? 0, currency)}
            />
            <Metric
              label="Mobile money"
              value={money(data?.mobile_sales ?? 0, currency)}
            />
            <Metric
              label="À crédit"
              value={money(data?.credit_sales ?? 0, currency)}
            />
          </div>
          <div className="mt-6 rounded-2xl bg-[#f6f7f0] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#788170]">
              Calcul du cash attendu
            </p>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <Line
                label="Ventes espèces"
                value={data?.cash_sales ?? 0}
                currency={currency}
                positive
              />
              <Line
                label="Remboursements cash"
                value={data?.cash_repayments ?? 0}
                currency={currency}
                positive
              />
              <Line
                label="Dépenses du jour"
                value={data?.expenses ?? 0}
                currency={currency}
              />
              <Line
                label="Cash attendu"
                value={data?.expected_cash ?? 0}
                currency={currency}
                emphasis
              />
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-[#e2e8ce] p-4">
            <Label
              htmlFor="declared-cash"
              className="text-xs font-bold uppercase tracking-[0.12em] text-[#65715d]"
            >
              Cash réellement compté
            </Label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <Input
                id="declared-cash"
                inputMode="decimal"
                disabled={closed}
                value={
                  closed
                    ? String(data?.closure?.declaredCash ?? 0)
                    : declaredCash
                }
                onChange={event => setDeclaredCash(event.target.value)}
                placeholder="0"
              />
              <Button
                disabled={closed || close.isPending || declared < 0}
                onClick={() =>
                  close.mutate({ shopId, businessDate, declaredCash: declared })
                }
                className="bg-[#405a3e] hover:bg-[#304a31]"
              >
                {close.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CircleCheck className="mr-2 h-4 w-4" />
                )}
                {closed ? "Journée clôturée" : "Clôturer la caisse"}
              </Button>
            </div>
            {closed ? (
              <p
                role="status"
                aria-live="polite"
                className="mt-3 text-sm font-medium text-[#4a7048]"
              >
                Clôture enregistrée. Cette journée reste verrouillée pour
                préserver la traçabilité.
              </p>
            ) : (
              <p
                role="status"
                aria-live="polite"
                className={
                  difference === 0
                    ? "mt-3 text-sm text-[#4a7048]"
                    : "mt-3 text-sm text-[#9a6333]"
                }
              >
                {difference === 0
                  ? "Le montant compté correspond au cash attendu."
                  : `Écart constaté : ${money(difference, currency)}.`}
              </p>
            )}
            {close.error && (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {close.error.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      <Card className="h-fit border-0 bg-[#25332b] text-[#f7f7ef]">
        <CardContent className="p-5">
          <p className="font-serif text-xl">Dernières clôtures</p>
          <p className="mt-1 text-xs text-[#b8c4b7]">
            Les 31 dernières journées verrouillées.
          </p>
          <div className="mt-5 space-y-3">
            {history.data?.map(entry => (
              <div key={entry.id} className="rounded-xl bg-white/[0.07] p-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{entry.businessDate}</p>
                  <p
                    className={
                      entry.difference === 0
                        ? "text-[#d1e980]"
                        : "text-[#f0c98a]"
                    }
                  >
                    {money(entry.difference, currency)}
                  </p>
                </div>
                <p className="mt-1 text-xs text-[#c1cdc1]">
                  Attendu {money(entry.expectedCash, currency)} · Compté{" "}
                  {money(entry.declaredCash, currency)}
                </p>
              </div>
            ))}
            {!history.data?.length && (
              <p className="rounded-xl border border-dashed border-white/15 py-8 text-center text-sm text-[#b8c4b7]">
                Aucune clôture pour le moment.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#ece9df] p-4">
      <p className="text-xs font-semibold text-[#7f8378]">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}
function Line({
  label,
  value,
  currency,
  positive,
  emphasis,
}: {
  label: string;
  value: number;
  currency: string;
  positive?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={emphasis ? "font-semibold" : "text-[#697067]"}>
        {positive ? "+ " : ""}
        {label}
      </span>
      <span
        className={emphasis ? "font-semibold text-[#25332b]" : "font-medium"}
      >
        {money(value, currency)}
      </span>
    </div>
  );
}
