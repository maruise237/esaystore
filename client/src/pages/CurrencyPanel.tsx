import React, { useMemo, useState } from "react";
import {
  ArrowRightLeft,
  CheckCircle2,
  Loader2,
  PlusCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";

const dateTime = (value: Date | string) =>
  new Date(value).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

export default function CurrencyPanel({ shopId }: { shopId: string }) {
  const utils = trpc.useUtils();
  const settings = trpc.currencies.settings.useQuery({ shopId });
  const rates = trpc.currencies.rates.useQuery({ shopId });
  const [currency, setCurrency] = useState("");
  const [rate, setRate] = useState("");
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const setCurrencyStatus = trpc.currencies.setCurrency.useMutation({
    onSuccess: () => utils.currencies.settings.invalidate({ shopId }),
  });
  const saveRateMutation = trpc.currencies.setRate.useMutation({
    onSuccess: () => {
      utils.currencies.rates.invalidate({ shopId });
      setRate("");
      setNote("");
      setNotice("Taux enregistré avec sa date d’effet.");
    },
  });
  const activeCurrencies = useMemo(
    () => settings.data?.currencies.filter(item => item.isActive) ?? [],
    [settings.data]
  );
  const activate = async () => {
    if (!currency) return;
    try {
      await setCurrencyStatus.mutateAsync({ shopId, currency, isActive: true });
      setNotice(`${currency} est maintenant disponible dans la caisse.`);
      setCurrency("");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "La devise n’a pas pu être activée."
      );
    }
  };
  const saveRate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currency || !rate) return;
    try {
      await saveRateMutation.mutateAsync({
        shopId,
        currency,
        rateToBase: Number(rate),
        note: note || undefined,
      });
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Le taux n’a pas pu être enregistré."
      );
    }
  };
  return (
    <div className="space-y-6">
      <Card className="border-0 bg-[#25332b] text-[#f7f7ef] shadow-[0_12px_30px_rgba(43,47,38,0.12)]">
        <CardContent className="p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#d1e980] text-[#28362e]">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d1e980]">
                Taux contrôlés par la boutique
              </p>
              <h2 className="mt-1 font-serif text-2xl">
                Encaissez dans plusieurs devises, gardez un seul référentiel.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#c0cdc0]">
                La devise de référence est{" "}
                <strong>{settings.data?.baseCurrency ?? "…"}</strong>. Les taux
                sont saisis par un responsable, datés, puis conservés avec
                chaque vente. EASYSTOR ne récupère pas de taux automatiquement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-0 bg-white shadow-[0_12px_30px_rgba(43,47,38,0.05)]">
          <CardContent className="p-5 sm:p-6">
            <p className="font-serif text-xl">Devises actives</p>
            <p className="mt-1 text-xs text-[#85877f]">
              Seules ces devises sont proposées à la caisse.
            </p>
            <div className="mt-5 space-y-3">
              {activeCurrencies.map(item => (
                <div
                  key={item.currency}
                  className="flex items-center justify-between rounded-2xl border border-[#ece9df] p-4"
                >
                  <div>
                    <p className="font-semibold">{item.currency}</p>
                    <p className="text-xs text-[#85877f]">
                      {item.currency === settings.data?.baseCurrency
                        ? "Référence de la boutique"
                        : item.label || "Devise de transaction"}
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-[#629157]" />
                </div>
              ))}
            </div>
            <div className="mt-5 border-t border-[#ece9df] pt-5">
              <Label
                htmlFor="currency-to-activate"
                className="text-xs font-semibold text-[#5d6759]"
              >
                Activer une devise
              </Label>
              <div className="mt-2 flex gap-2">
                <select
                  id="currency-to-activate"
                  value={currency}
                  onChange={event => setCurrency(event.target.value)}
                  className="h-10 min-w-0 flex-1 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="">Choisir</option>
                  {settings.data?.supportedCurrencies
                    .filter(
                      code =>
                        !activeCurrencies.some(item => item.currency === code)
                    )
                    .map(code => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                </select>
                <Button
                  onClick={activate}
                  disabled={!currency || setCurrencyStatus.isPending}
                  className="bg-[#405a3e]"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Activer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-[#eef3e4]">
          <CardContent className="p-5 sm:p-6">
            <p className="font-serif text-xl">Nouveau taux</p>
            <p className="mt-1 text-xs text-[#71806c]">
              Saisissez combien vaut{" "}
              <strong>1 unité de devise étrangère</strong> dans la devise de
              référence.
            </p>
            <form
              onSubmit={saveRate}
              className="mt-5 grid gap-3 sm:grid-cols-2"
            >
              <label className="grid gap-1.5">
                <Label>Devise</Label>
                <select
                  value={currency}
                  onChange={event => setCurrency(event.target.value)}
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="">Choisir</option>
                  {activeCurrencies
                    .filter(
                      item => item.currency !== settings.data?.baseCurrency
                    )
                    .map(item => (
                      <option key={item.currency} value={item.currency}>
                        {item.currency}
                      </option>
                    ))}
                </select>
              </label>
              <label className="grid gap-1.5">
                <Label>Taux vers {settings.data?.baseCurrency ?? "…"}</Label>
                <Input
                  required
                  inputMode="decimal"
                  value={rate}
                  onChange={event => setRate(event.target.value)}
                  placeholder="Ex. 655.957"
                />
              </label>
              <label className="grid gap-1.5 sm:col-span-2">
                <Label>Note facultative</Label>
                <Input
                  value={note}
                  onChange={event => setNote(event.target.value)}
                  placeholder="Ex. Taux comptoir du matin"
                />
              </label>
              <div className="sm:col-span-2">
                <Button
                  type="submit"
                  disabled={!currency || !rate || saveRateMutation.isPending}
                  className="w-full bg-[#405a3e]"
                >
                  {saveRateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Enregistrer le taux
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <Card className="border-0 bg-white shadow-[0_12px_30px_rgba(43,47,38,0.05)]">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-serif text-xl">Historique des taux</p>
              <p className="mt-1 text-xs text-[#85877f]">
                Chaque vente garde le taux applicable au moment de son
                enregistrement.
              </p>
            </div>
            <span className="rounded-full bg-[#eef1e8] px-3 py-1 text-xs font-semibold">
              {rates.data?.length ?? 0} taux
            </span>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-[#8b8e84]">
                <tr>
                  <th className="pb-3">Devise</th>
                  <th className="pb-3">1 unité vaut</th>
                  <th className="pb-3">Date d’effet</th>
                  <th className="pb-3">Note</th>
                </tr>
              </thead>
              <tbody>
                {rates.data?.map(item => (
                  <tr key={item.id} className="border-t border-[#efede6]">
                    <td className="py-3 font-semibold">{item.currency}</td>
                    <td className="py-3">
                      {item.rateToBase} {settings.data?.baseCurrency}
                    </td>
                    <td className="py-3 text-[#77776c]">
                      {dateTime(item.effectiveAt)}
                    </td>
                    <td className="py-3 text-[#77776c]">{item.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rates.data?.length && (
              <p className="py-10 text-center text-sm text-[#85877f]">
                Aucun taux enregistré. Activez une devise, puis renseignez son
                taux avant de l’utiliser en caisse.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      {notice && (
        <p
          role="status"
          className="rounded-xl bg-[#edf1e3] px-4 py-3 text-sm text-[#4e6b48]"
        >
          {notice}
        </p>
      )}
    </div>
  );
}
