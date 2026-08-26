import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  downloadEasystorWorkbook,
  parseMigrationFile,
  type MigrationData,
  type MigrationSheetSummary,
} from "@/lib/sheetMigration";
import { MAX_IMPORT_FILE_BYTES, MAX_IMPORT_PAYLOAD_BYTES, serializedByteLength } from "../../../shared/importLimits";
import { trpc } from "@/lib/trpc";

const strategyCopy = {
  block: {
    title: "Bloquer l’import",
    text: "Aucune écriture tant qu’une collision existe.",
  },
  skip: {
    title: "Ignorer les collisions",
    text: "Conserve les données existantes et saute les lignes en conflit.",
  },
  update: {
    title: "Mettre à jour les référentiels",
    text: "Met à jour les prix, seuils et coordonnées des produits ou clients reconnus.",
  },
  copy: {
    title: "Créer une copie",
    text: "Crée un produit ou client séparé, clairement suffixé « import ».",
  },
} as const;
type Strategy = keyof typeof strategyCopy;

export default function MigrationPanel({ shopId }: { shopId: string }) {
  const [fileName, setFileName] = useState("");
  const [data, setData] = useState<MigrationData | null>(null);
  const [ignoredSheets, setIgnoredSheets] = useState<string[]>([]);
  const [sheetSummary, setSheetSummary] = useState<MigrationSheetSummary[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<Strategy>("block");
  const preview = trpc.migration.preview.useMutation();
  const exportData = trpc.migration.exportData.useQuery(
    { shopId },
    { enabled: false }
  );
  const apply = trpc.migration.run.useMutation({
    onSuccess: result => {
      setNotice(
        result.replayed
          ? "Ce fichier avait déjà été importé : aucune donnée n’a été dupliquée."
          : `Import terminé : ${result.imported.products} produits, ${result.imported.customers} clients, ${result.imported.suppliers} fournisseurs, ${result.imported.sales} ventes, ${result.imported.purchases} achats et ${result.imported.expenses} dépenses.`
      );
    },
  });
  const previewData = preview.data;
  const fatalConflict = previewData?.conflicts.some(
    item => item.type === "business_day" || item.type === "reimport"
  );

  const chooseFile = async (file?: File) => {
    if (!file) return;
    setNotice(null);
    setPreviewState();
    if (!/\.(xlsx|csv)$/i.test(file.name)) {
      setNotice(
        "Choisissez un fichier .xlsx ou .csv exporté depuis Google Sheets ou Excel."
      );
      return;
    }
    if (file.size > MAX_IMPORT_FILE_BYTES) {
      setNotice(
        "Ce fichier dépasse la limite sécurisée de 2 Mo. Réduisez-le ou séparez les onglets."
      );
      return;
    }
    try {
      const result = await parseMigrationFile(file);
      const total =
        result.data.products.length +
        result.data.customers.length +
        result.data.suppliers.length +
        result.data.sales.length +
        result.data.saleItems.length +
        result.data.purchases.length +
        result.data.purchaseItems.length +
        result.data.expenses.length;
      if (!total) {
        setNotice(
          "Aucune donnée reconnue. Vérifiez les noms d’onglets ou les en-têtes de colonnes."
        );
        return;
      }
      if (serializedByteLength(result.data) > MAX_IMPORT_PAYLOAD_BYTES) {
        setNotice("Les données extraites dépassent la limite sécurisée de l’import. Réduisez le nombre de lignes ou séparez les onglets.");
        return;
      }
      setData(result.data);
      setIgnoredSheets(result.ignoredSheets);
      setSheetSummary(result.sheetSummary);
      setFileName(file.name);
      preview.mutate({ shopId, data: result.data });
    } catch {
      setNotice(
        "Le fichier n’a pas pu être lu. Vérifiez qu’il est bien au format .xlsx ou .csv."
      );
    }
  };
  const setPreviewState = () => {
    preview.reset();
    apply.reset();
    setData(null);
    setIgnoredSheets([]);
    setSheetSummary([]);
    setFileName("");
  };
  const confirm = () => {
    if (!data || !fileName) return;
    apply.mutate({ shopId, fileName, data, conflictStrategy: strategy });
  };
  const exportWorkbook = async () => {
    const result = await exportData.refetch();
    if (result.data) {
      await downloadEasystorWorkbook(
        result.data,
        `EASYSTOR-export-${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      setNotice(
        "Le classeur global a été téléchargé. Importez-le dans Google Sheets si vous le souhaitez."
      );
    } else
      setNotice(
        "L’export n’a pas pu être préparé. Réessayez dans quelques instants."
      );
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-[#25332b] text-[#f7f7ef] shadow-[0_12px_30px_rgba(43,47,38,0.12)]">
        <CardContent className="p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[#d1e980]">
                <FileSpreadsheet className="h-5 w-5" />
                <p className="text-xs font-bold uppercase tracking-[0.16em]">
                  Fichiers, pas synchronisation distante
                </p>
              </div>
              <h2 className="mt-3 font-serif text-2xl">
                Importer un historique ou exporter vos données.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#c0cdc0]">
                EASYSTOR lit un fichier exporté depuis Google Sheets ou Excel.
                Il ne se connecte pas à votre compte Google et ne modifie jamais
                un Sheet distant.
              </p>
            </div>
            <Button
              variant="outline"
              disabled={exportData.isFetching}
              onClick={exportWorkbook}
              className="border-white/20 text-white hover:bg-white/10"
            >
              {exportData.isFetching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Exporter le classeur
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-white shadow-[0_12px_30px_rgba(43,47,38,0.05)]">
        <CardContent className="p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-serif text-xl">1. Choisir le fichier</p>
              <p className="mt-1 text-sm text-[#77776c]">
                Formats acceptés : .xlsx et .csv, jusqu’à 12 Mo.
              </p>
            </div>
            <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md bg-[#405a3e] px-4 text-sm font-medium text-white transition hover:bg-[#304a31]">
              <Upload className="mr-2 h-4 w-4" />
              Sélectionner
              <input
                type="file"
                accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                className="sr-only"
                onChange={event => chooseFile(event.target.files?.[0])}
              />
            </label>
          </div>
          {fileName && (
            <div className="mt-5 rounded-2xl border border-[#dce6be] bg-[#f6fae9] p-4 text-sm">
              <p className="font-semibold text-[#3f593c]">{fileName}</p>
              <p className="mt-1 text-[#6f786b]">
                Fichier analysé localement avant toute écriture en base.
              </p>
            </div>
          )}
          {notice && (
            <div
              role="status"
              aria-live="polite"
              className="mt-5 flex gap-3 rounded-2xl bg-[#fff4de] p-4 text-sm text-[#7f5d24]"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{notice}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {data && (
        <Card className="border-0 bg-white shadow-[0_12px_30px_rgba(43,47,38,0.05)]">
          <CardContent className="p-5 sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-serif text-xl">2. Aperçu détecté</p>
                <p className="mt-1 text-sm text-[#77776c]">
                  Les dates du fichier sont conservées pour reconstituer
                  l’historique.
                </p>
              </div>
              {preview.isPending && (
                <Loader2 className="h-5 w-5 animate-spin text-[#4e6b48]" />
              )}
            </div>
            <div className="mt-5 grid gap-3 grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Produits", value: data.products.length },
                { label: "Clients", value: data.customers.length },
                { label: "Fournisseurs", value: data.suppliers.length },
                { label: "Ventes", value: data.sales.length },
                { label: "Lignes", value: data.saleItems.length },
                { label: "Achats", value: data.purchases.length },
                { label: "Lignes d’achat", value: data.purchaseItems.length },
                { label: "Dépenses", value: data.expenses.length },
              ].map(item => (
                <div key={item.label} className="rounded-2xl bg-[#f4f5ef] p-4">
                  <p className="text-xs font-semibold text-[#77776c]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-2xl font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
            {sheetSummary.length > 0 && (
              <div className="mt-6 rounded-2xl border border-[#e5e2d8] bg-[#fbfbf7] p-4 sm:p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold text-[#30452f]">Onglets examinés avant import</p>
                  <p className="text-xs text-[#6f786b]">Aucune écriture n’a encore été effectuée.</p>
                </div>
                <ul className="mt-4 space-y-2" aria-label="Résumé des onglets du fichier">
                  {sheetSummary.map(sheet => (
                    <li key={sheet.name} className="flex flex-col gap-1 rounded-xl bg-white px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-[#344534]">{sheet.name} <span className="font-normal text-[#737d70]">· {sheet.rows} ligne{sheet.rows > 1 ? "s" : ""}</span></p>
                        <p className="mt-0.5 text-xs leading-relaxed text-[#737d70]">{sheet.reason}</p>
                      </div>
                      <span className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${sheet.status === "imported" ? "bg-[#edf6e9] text-[#41623d]" : sheet.status === "support" ? "bg-[#edf2f7] text-[#45657d]" : "bg-[#fff4de] text-[#8a6b35]"}`}>
                        {sheet.status === "imported" ? "Pris en compte" : sheet.status === "support" ? "Utilisé pour le stock" : "Ignoré"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {ignoredSheets.length > 0 && (
              <p className="mt-4 text-xs text-[#8a6b35]">
                {ignoredSheets.length} onglet{ignoredSheets.length > 1 ? "s" : ""} ignoré{ignoredSheets.length > 1 ? "s" : ""} : {ignoredSheets.join(", ")}.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {previewData && (
        <Card className="border-0 bg-white shadow-[0_12px_30px_rgba(43,47,38,0.05)]">
          <CardContent className="p-5 sm:p-7">
            <div>
              <p className="font-serif text-xl">3. Contrôler les collisions</p>
              <p className="mt-1 text-sm text-[#77776c]">
                Aucun doublon n’est créé ni aucune donnée existante remplacée
                sans choix explicite.
              </p>
            </div>
            {previewData.conflicts.length === 0 ? (
              <div className="mt-5 flex gap-3 rounded-2xl bg-[#edf6e9] p-4 text-sm text-[#41623d]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <p>
                  Aucune collision détectée. Vous pouvez confirmer l’import.
                </p>
              </div>
            ) : (
              <>
                <div className="mt-5 max-h-56 space-y-2 overflow-auto">
                  {previewData.conflicts.map((item, index) => (
                    <div
                      key={`${item.sourceId}-${index}`}
                      className="flex gap-3 rounded-xl border border-[#f0dfc4] bg-[#fffaf1] p-3 text-sm"
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#a46a2d]" />
                      <p>
                        <strong>
                          {item.type === "business_day"
                            ? "Journée clôturée"
                            : item.type === "reimport"
                              ? "Réimport"
                              : item.type === "sale"
                                ? "Vente"
                                : item.type === "purchase"
                                  ? "Achat"
                                  : item.type === "supplier"
                                    ? "Fournisseur"
                                    : item.type === "product"
                                  ? "Produit"
                                  : "Client"}
                        </strong>{" "}
                        · {item.reason}
                      </p>
                    </div>
                  ))}
                </div>
                {!fatalConflict && (
                  <fieldset className="mt-6">
                    <legend className="text-sm font-semibold">
                      Traitement des produits et clients en collision
                    </legend>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {(Object.keys(strategyCopy) as Strategy[]).map(key => (
                        <label
                          key={key}
                          className={`cursor-pointer rounded-2xl border p-4 ${strategy === key ? "border-[#a9c76b] bg-[#f6fae9]" : "border-[#e5e2d8] bg-white"}`}
                        >
                          <input
                            className="sr-only"
                            type="radio"
                            name="strategy"
                            value={key}
                            checked={strategy === key}
                            onChange={() => setStrategy(key)}
                          />
                          <p className="font-semibold">
                            {strategyCopy[key].title}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-[#77776c]">
                            {strategyCopy[key].text}
                          </p>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {previewData && (
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={setPreviewState}>
            Choisir un autre fichier
          </Button>
          <Button
            disabled={apply.isPending || !data || Boolean(fatalConflict)}
            onClick={confirm}
            className="bg-[#405a3e] hover:bg-[#304a31]"
          >
            {apply.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Confirmer l’import
          </Button>
        </div>
      )}
      {apply.error && (
        <p
          role="alert"
          className="rounded-xl bg-[#fff0ed] p-3 text-sm text-[#a64d3d]"
        >
          {apply.error.message}
        </p>
      )}
    </div>
  );
}
