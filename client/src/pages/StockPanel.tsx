import { useMemo, useState } from "react";
import { ClipboardList, Loader2, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { queueOperation } from "@/lib/offline";
import { trpc } from "@/lib/trpc";

export default function StockPanel({ shopId }: { shopId: string }) {
  const utils = trpc.useUtils();
  const products = trpc.catalog.products.list.useQuery({ shopId });
  const movements = trpc.catalog.products.movements.useQuery({ shopId });
  const [productId, setProductId] = useState("");
  const [delta, setDelta] = useState("");
  const [kind, setKind] = useState<"restock" | "adjustment">("restock");
  const [reason, setReason] = useState("");
  const mutation = trpc.catalog.products.adjust.useMutation({
    onSuccess: () => {
      setDelta("");
      setReason("");
      utils.catalog.products.list.invalidate({ shopId });
      utils.catalog.products.movements.invalidate({ shopId });
      utils.insights.dashboard.invalidate({ shopId });
    },
  });
  const selected = useMemo(
    () => products.data?.find(product => product.id === productId),
    [products.data, productId]
  );
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(delta);
    if (!productId || !value || !reason) return;
    const payload = {
      shopId,
      productId,
      delta: kind === "restock" ? Math.abs(value) : value,
      kind,
      reason,
      operationId: crypto.randomUUID(),
    };
    if (!navigator.onLine) {
      await queueOperation("adjustment", payload);
      setDelta("");
      setReason("");
      return;
    }
    mutation.mutate(payload);
  };
  const typeLabel = (type: string) =>
    type === "restock"
      ? "Réapprovisionnement"
      : type === "sale"
        ? "Vente"
        : "Ajustement";
  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <Card className="h-fit border-0 bg-[#e9f0e3]">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-[#4e6b48]" />
            <p className="font-serif text-xl">Mouvement de stock</p>
          </div>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <label className="grid gap-2">
              <Label>Produit</Label>
              <select
                value={productId}
                onChange={event => setProductId(event.target.value)}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm"
                required
              >
                <option value="">Sélectionnez un produit</option>
                {products.data?.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} — {product.stockQuantity} {product.unit}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <Label>Opération</Label>
              <select
                value={kind}
                onChange={event =>
                  setKind(event.target.value as "restock" | "adjustment")
                }
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:text-sm"
              >
                <option value="restock">Réapprovisionnement (+)</option>
                <option value="adjustment">Ajustement (+ ou −)</option>
              </select>
            </label>
            <label className="grid gap-2">
              <Label>
                Quantité {kind === "adjustment" ? "(signe autorisé)" : ""}
              </Label>
              <Input
                type="number"
                step="0.001"
                value={delta}
                onChange={event => setDelta(event.target.value)}
                required
              />
            </label>
            <label className="grid gap-2">
              <Label>Motif</Label>
              <Input
                value={reason}
                onChange={event => setReason(event.target.value)}
                placeholder="Ex. livraison fournisseur"
                required
              />
            </label>
            {selected && (
              <p className="rounded-xl bg-white/70 px-3 py-2 text-xs text-[#53644f]">
                Stock actuel :{" "}
                <strong>
                  {selected.stockQuantity} {selected.unit}
                </strong>
              </p>
            )}
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="w-full bg-[#415b3c]"
            >
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Enregistrer le mouvement
            </Button>
            {mutation.error && (
              <p role="alert" className="text-xs text-red-600">
                {mutation.error.message}
              </p>
            )}
          </form>
        </CardContent>
      </Card>
      <Card className="border-0 bg-white shadow-[0_12px_30px_rgba(43,47,38,0.05)]">
        <CardContent className="p-4 sm:p-7">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-[#577651]" />
            <div>
              <p className="font-serif text-xl">Historique des mouvements</p>
              <p className="mt-1 text-xs text-[#85877f]">
                Les derniers ajustements, entrées et sorties de stock.
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3 sm:hidden">
            {movements.data?.map(movement => (
              <article
                key={movement.id}
                className="rounded-2xl border border-[#ece9df] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{typeLabel(movement.type)}</p>
                    <p className="mt-1 text-xs text-[#77776c]">
                      {new Date(movement.createdAt).toLocaleString("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <p
                    className={
                      movement.quantityDelta > 0
                        ? "font-semibold text-[#4e7549]"
                        : "font-semibold text-[#b85d4a]"
                    }
                  >
                    {movement.quantityDelta > 0 ? "+" : ""}
                    {movement.quantityDelta}
                  </p>
                </div>
                <div className="mt-3 flex justify-between gap-3 text-xs text-[#77776c]">
                  <span>Après : {movement.stockAfter}</span>
                  <span className="text-right">{movement.reason || "—"}</span>
                </div>
              </article>
            ))}
            {!movements.data?.length && (
              <p className="py-10 text-center text-sm text-[#85877f]">
                Aucun mouvement enregistré.
              </p>
            )}
          </div>
          <div className="mt-5 hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-[#8b8e84]">
                <tr>
                  <th className="pb-4">Date</th>
                  <th className="pb-4">Type</th>
                  <th className="pb-4">Écart</th>
                  <th className="pb-4">Stock après</th>
                  <th className="pb-4">Motif</th>
                </tr>
              </thead>
              <tbody>
                {movements.data?.map(movement => (
                  <tr key={movement.id} className="border-t border-[#efede6]">
                    <td className="py-4 text-[#77776c]">
                      {new Date(movement.createdAt).toLocaleString("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="py-4">{typeLabel(movement.type)}</td>
                    <td
                      className={
                        movement.quantityDelta > 0
                          ? "py-4 font-semibold text-[#4e7549]"
                          : "py-4 font-semibold text-[#b85d4a]"
                      }
                    >
                      {movement.quantityDelta > 0 ? "+" : ""}
                      {movement.quantityDelta}
                    </td>
                    <td className="py-4">{movement.stockAfter}</td>
                    <td className="py-4 text-[#77776c]">
                      {movement.reason || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!movements.data?.length && (
              <p className="py-10 text-center text-sm text-[#85877f]">
                Aucun mouvement enregistré.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
