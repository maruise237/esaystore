import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowDown,
  BarChart3,
  ChevronDown,
  CircleAlert,
  CreditCard,
  Loader2,
  Minus,
  PackagePlus,
  Plus,
  ScanLine,
  Search,
  ShoppingCart,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  cacheCustomers,
  cacheProducts,
  localCustomersFor,
  localProductsFor,
  purgeOfflineData,
  queueSale,
  resolveUnknownBarcode,
  saveUnknownBarcode,
} from "@/lib/offline";
import AppShell, { type WorkspaceSection } from "@/components/AppShell";
import {
  readWorkspaceSection,
  saveWorkspaceSection,
} from "@/lib/workspaceNavigation";
import AuthPage from "./AuthPage";
import StockPanel from "./StockPanel";
import SyncPanel from "./SyncPanel";
import TeamPanel from "./TeamPanel";
import CreditPanel from "./CreditPanel";
import SalesPanel from "./SalesPanel";
import ExpensesPanel from "./ExpensesPanel";
import ClosingPanel from "./ClosingPanel";
import MigrationPanel from "./MigrationPanel";
import CatalogPanel from "./CatalogPanel";
import CurrencyPanel from "./CurrencyPanel";
import ProfilePanel from "./ProfilePanel";
import BarcodeScannerDialog from "@/components/BarcodeScannerDialog";
import UnknownBarcodeQueue from "@/components/UnknownBarcodeQueue";
import SaleReceiptDialog from "@/components/SaleReceiptDialog";
import type { SaleReceipt } from "@/lib/receipt";
import {
  amountStillDue,
  excessPayment,
  requiresCustomerForSale,
  suggestedCashAmounts,
} from "@/lib/pos";
import { getOnboardingSteps } from "@/lib/onboarding";
import { resolveCatalogPhoto } from "@/lib/catalogVariants";
import PosCatalogSearch from "@/components/PosCatalogSearch";
import SupportPanel from "./SupportPanel";

const currencyFormat = (value: number, currency = "XAF") =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);
const sectionTitles: Record<
  WorkspaceSection,
  { kicker: string; title: string; description: string }
> = {
  dashboard: {
    kicker: "Vue d’ensemble",
    title: "Votre boutique, en un regard.",
    description:
      "Suivez l’activité et agissez avant que le stock ou les créances ne vous ralentissent.",
  },
  pos: {
    kicker: "Encaissement",
    title: "Caisse rapide",
    description:
      "Ajoutez vos produits, choisissez le paiement et confirmez la vente.",
  },
  products: {
    kicker: "Inventaire",
    title: "Catalogue & stock",
    description: "Gardez un catalogue propre et des niveaux de stock fiables.",
  },
  stock: {
    kicker: "Inventaire",
    title: "Mouvements de stock",
    description:
      "Enregistrez les réapprovisionnements et ajustements avec leur motif.",
  },
  customers: {
    kicker: "Relation client",
    title: "Crédits & remboursements",
    description: "Visualisez ce qui est dû et enregistrez chaque règlement.",
  },
  sales: {
    kicker: "Journal",
    title: "Historique des ventes",
    description: "Retrouvez les ventes récentes de la boutique.",
  },
  expenses: {
    kicker: "Journal",
    title: "Dépenses",
    description:
      "Enregistrez les sorties de caisse qui affectent la rentabilité.",
  },
  reports: {
    kicker: "Analyse",
    title: "Rapports essentiels",
    description:
      "Mesurez le chiffre d’affaires, la marge et vos meilleures ventes.",
  },
  closing: {
    kicker: "Fin de journée",
    title: "Fermeture de caisse",
    description:
      "Comparez le cash attendu et le montant compté, puis enregistrez la clôture du jour.",
  },
  migration: {
    kicker: "Transfert de données",
    title: "Importer / exporter",
    description:
      "Reprenez votre historique issu d’un fichier et préparez vos données pour un export global.",
  },
  currencies: {
    kicker: "Réglages de paiement",
    title: "Devises & taux",
    description:
      "Activez les monnaies utilisées dans votre zone et conservez un taux daté avec chaque vente.",
  },
  profile: {
    kicker: "Mon compte",
    title: "Profil & boutique",
    description:
      "Gardez votre numéro, votre pays et la devise de référence de votre boutique à jour.",
  },
  team: {
    kicker: "Administration",
    title: "Équipe de la boutique",
    description:
      "Ajoutez les collaborateurs déjà inscrits et attribuez leur rôle.",
  },
  sync: {
    kicker: "Hors ligne",
    title: "Synchronisation",
    description:
      "Contrôlez les opérations locales, les erreurs et les conflits de stock.",
  },
  support: {
    kicker: "Aide EASYSTOR",
    title: "Support & demandes",
    description:
      "Envoyez votre demande et échangez directement avec le support depuis l’application.",
  },
};

export default function Workspace() {
  const { user, loading } = useAuth();
  const [active, setActive] = useState<WorkspaceSection>(() =>
    readWorkspaceSection()
  );
  const shopsQuery = trpc.shops.list.useQuery(undefined, {
    enabled: Boolean(user),
  });
  const [shopId, setShopId] = useState<string | null>(null);
  const [catalogSeed, setCatalogSeed] = useState<{
    barcode: string;
    key: string;
  } | null>(null);
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => window.location.reload(),
  });
  const navigate = useCallback((section: WorkspaceSection) => {
    setActive(section);
    saveWorkspaceSection(section);
  }, []);

  useEffect(() => {
    const restoreWorkspaceSection = () => setActive(readWorkspaceSection());
    window.addEventListener("popstate", restoreWorkspaceSection);
    window.addEventListener("hashchange", restoreWorkspaceSection);
    return () => {
      window.removeEventListener("popstate", restoreWorkspaceSection);
      window.removeEventListener("hashchange", restoreWorkspaceSection);
    };
  }, []);

  useEffect(() => {
    const first = shopsQuery.data?.[0]?.shop.id;
    if (!shopId && first) setShopId(first);
  }, [shopId, shopsQuery.data]);

  if (loading || (user && shopsQuery.isLoading))
    return (
      <LoadingBlock label="Ouverture de votre espace marchand…" fullScreen />
    );
  if (!user) return <AuthPage />;
  const activeShop =
    shopsQuery.data?.find(entry => entry.shop.id === shopId) ??
    shopsQuery.data?.[0];
  if (!activeShop) return <EmptyShop />;
  const meta = sectionTitles[active];

  return (
    <AppShell
      active={active}
      onNavigate={navigate}
      shopName={activeShop.shop.name}
      currency={activeShop.shop.currency}
      userName={user.name || user.email || "Utilisateur"}
      onLogout={() => {
        purgeOfflineData().finally(() => logout.mutate());
      }}
    >
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[#e4e1d7] bg-[#f6f4ef]/90 px-4 py-3 backdrop-blur sm:px-5 sm:py-4 lg:px-10">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#73816f]">
            {meta.kicker}
          </p>
          <h1 className="mt-1 truncate font-serif text-xl tracking-tight sm:text-3xl">
            {meta.title}
          </h1>
        </div>
        {shopsQuery.data && shopsQuery.data.length > 1 && (
          <select
            value={activeShop.shop.id}
            onChange={event => setShopId(event.target.value)}
            className="max-w-32 shrink-0 rounded-xl border border-[#dedbd2] bg-white px-2 py-2 text-xs font-medium sm:max-w-none sm:px-3 sm:text-sm"
          >
            <option value={activeShop.shop.id}>{activeShop.shop.name}</option>
            {shopsQuery.data
              .filter(entry => entry.shop.id !== activeShop.shop.id)
              .map(entry => (
                <option key={entry.shop.id} value={entry.shop.id}>
                  {entry.shop.name}
                </option>
              ))}
          </select>
        )}
      </header>
      <div className="mx-auto max-w-[1500px] p-4 pb-8 sm:p-5 lg:p-10">
        <p className="mb-5 max-w-2xl text-sm leading-relaxed text-[#77776c] sm:mb-7">
          {meta.description}
        </p>
        {active === "dashboard" && (
          <Dashboard
            shopId={activeShop.shop.id}
            currency={activeShop.shop.currency}
            onNavigate={navigate}
          />
        )}
        {active === "pos" && (
          <Pos
            shopId={activeShop.shop.id}
            currency={activeShop.shop.currency}
            shopName={activeShop.shop.name}
            shopLogoUrl={activeShop.shop.logoUrl}
            shopAddress={activeShop.shop.address}
            shopContactPhone={activeShop.shop.contactPhone}
          />
        )}
        {active === "products" && (
          <>
            <CatalogPanel
              shopId={activeShop.shop.id}
              currency={activeShop.shop.currency}
              suggestedBarcode={catalogSeed?.barcode ?? ""}
              suggestionKey={catalogSeed?.key ?? ""}
              onBarcodeCreated={barcode => {
                resolveUnknownBarcode(activeShop.shop.id, barcode);
                setCatalogSeed(null);
              }}
            />
            <UnknownBarcodeQueue
              shopId={activeShop.shop.id}
              onPrepareProduct={barcode => {
                setCatalogSeed({ barcode, key: crypto.randomUUID() });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </>
        )}
        {active === "stock" && <StockPanel shopId={activeShop.shop.id} />}
        {active === "customers" && (
          <CreditPanel
            shopId={activeShop.shop.id}
            currency={activeShop.shop.currency}
          />
        )}
        {active === "sales" && (
          <SalesPanel
            shopId={activeShop.shop.id}
            currency={activeShop.shop.currency}
          />
        )}
        {active === "expenses" && (
          <ExpensesPanel
            shopId={activeShop.shop.id}
            currency={activeShop.shop.currency}
          />
        )}
        {active === "reports" && (
          <Reports
            shopId={activeShop.shop.id}
            currency={activeShop.shop.currency}
          />
        )}
        {active === "closing" && (
          <ClosingPanel
            shopId={activeShop.shop.id}
            currency={activeShop.shop.currency}
          />
        )}
        {active === "migration" && (
          <MigrationPanel shopId={activeShop.shop.id} />
        )}
        {active === "currencies" && (
          <CurrencyPanel shopId={activeShop.shop.id} />
        )}
        {active === "profile" && <ProfilePanel shopId={activeShop.shop.id} />}
        {active === "team" && <TeamPanel shopId={activeShop.shop.id} />}
        {active === "sync" && <SyncPanel />}
        {active === "support" && (
          <SupportPanel
            shops={(shopsQuery.data ?? []).map(entry => ({
              id: entry.shop.id,
              name: entry.shop.name,
            }))}
          />
        )}
      </div>
    </AppShell>
  );
}

function Dashboard({
  shopId,
  currency,
  onNavigate,
}: {
  shopId: string;
  currency: string;
  onNavigate: (section: WorkspaceSection) => void;
}) {
  const dashboard = trpc.insights.dashboard.useQuery({ shopId });
  const products = trpc.catalog.products.list.useQuery({ shopId });
  const sales = trpc.commerce.sales.list.useQuery({ shopId });
  const data = dashboard.data;
  if (dashboard.isLoading)
    return <LoadingBlock label="Chargement du pilotage…" />;
  if (dashboard.isError)
    return (
      <RecoveryBlock
        message="Le pilotage n’a pas pu être chargé."
        onRetry={() => dashboard.refetch()}
      />
    );
  const onboardingReady =
    !products.isLoading &&
    !sales.isLoading &&
    Boolean(products.data) &&
    Boolean(sales.data);
  const onboardingSteps = getOnboardingSteps(
    products.data?.length ?? 0,
    sales.data?.length ?? 0
  );
  const setupIncomplete =
    onboardingReady && onboardingSteps.some(step => !step.complete);
  const cards = [
    {
      label: "Ventes aujourd’hui",
      value: currencyFormat(data?.salesToday ?? 0, currency),
      detail: `${currencyFormat(data?.salesYesterday ?? 0, currency)} hier`,
      icon: TrendingUp,
      tone: "bg-[#e7f3b5]",
    },
    {
      label: "Encaissé en espèces",
      value: currencyFormat(data?.cashToday ?? 0, currency),
      detail: "Paiements cash du jour",
      icon: Wallet,
      tone: "bg-[#fde9b7]",
    },
    {
      label: "Mobile money",
      value: currencyFormat(data?.mobileToday ?? 0, currency),
      detail: "Encaissements digitaux",
      icon: CreditCard,
      tone: "bg-[#dbeefe]",
    },
    {
      label: "Créances à suivre",
      value: currencyFormat(data?.outstandingReceivables ?? 0, currency),
      detail: "Montant non réglé",
      icon: CircleAlert,
      tone: "bg-[#f9dddd]",
    },
  ];
  return (
    <div className="space-y-6">
      {setupIncomplete && (
        <QuickStart steps={onboardingSteps} onNavigate={onNavigate} />
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(card => (
          <Card
            key={card.label}
            className="border-0 bg-white shadow-[0_12px_30px_rgba(43,47,38,0.05)]"
          >
            <CardContent className="p-5">
              <div className="mb-6 flex items-start justify-between">
                <p className="text-xs font-semibold text-[#75786f]">
                  {card.label}
                </p>
                <div
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-xl",
                    card.tone
                  )}
                >
                  <card.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-semibold tracking-tight">
                {card.value}
              </p>
              <p className="mt-2 text-xs text-[#8a8c82]">{card.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <DashboardAlerts
        currency={currency}
        onNavigate={onNavigate}
        lowStockItems={data?.lowStockItems ?? []}
        overdueReceivables={data?.overdueReceivables ?? []}
      />
      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <Card className="border-0 bg-white shadow-[0_12px_30px_rgba(43,47,38,0.05)]">
          <CardContent className="p-6">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="font-serif text-xl">Rythme des ventes</p>
                <p className="mt-1 text-xs text-[#85877f]">
                  Les 7 derniers jours
                </p>
              </div>
              <BarChart3 className="h-5 w-5 text-[#78966f]" />
            </div>
            <figure>
              <div
                className="h-64"
                role="img"
                aria-label={
                  data?.trend?.length
                    ? `Évolution des ventes sur les ${data.trend.length} derniers jours. Consultez le résumé sous le graphique pour les données essentielles.`
                    : "Aucune évolution de ventes disponible sur la période."
                }
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.trend ?? []}>
                    <defs>
                      <linearGradient
                        id="sales-gradient"
                        x1="0"
                        x2="0"
                        y1="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#8faa74"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="100%"
                          stopColor="#8faa74"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#8c8d83", fontSize: 11 }}
                    />
                    <YAxis hide />
                    <Tooltip
                      formatter={value =>
                        currencyFormat(Number(value), currency)
                      }
                      contentStyle={{
                        borderRadius: 14,
                        border: "1px solid #e5e2d8",
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#54734e"
                      strokeWidth={2.5}
                      fill="url(#sales-gradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <figcaption className="mt-3 rounded-xl bg-[#f7f8f3] px-3 py-2 text-xs leading-relaxed text-[#5f665d]">
                {data?.trend?.length
                  ? `Résumé : ${currencyFormat(
                      (data.trend ?? []).reduce(
                        (total, item) => total + item.value,
                        0
                      ),
                      currency
                    )} sur ${data.trend.length} jour${data.trend.length > 1 ? "s" : ""}. Les valeurs détaillées sont disponibles au survol ou au focus dans le graphique.`
                  : "Aucune vente enregistrée sur la période sélectionnée."}
              </figcaption>
              {data?.trend?.length ? (
                <details className="mt-2 rounded-xl border border-[#e4e8de] bg-white px-3 py-2 text-xs text-[#4e5b4c]">
                  <summary className="cursor-pointer font-semibold">
                    Consulter le détail des ventes par jour
                  </summary>
                  <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                    {data.trend.map(item => (
                      <li
                        key={item.label}
                        className="flex justify-between gap-3"
                      >
                        <span>{item.label}</span>
                        <span className="font-semibold">
                          {currencyFormat(item.value, currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </figure>
          </CardContent>
        </Card>
        <Card className="border-0 bg-[#25332b] text-[#f7f7ef] shadow-[0_12px_30px_rgba(43,47,38,0.10)]">
          <CardContent className="flex h-full flex-col p-6">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#d1e980] text-[#26352d]">
              <CircleAlert className="h-5 w-5" />
            </div>
            <p className="mt-8 font-serif text-2xl">
              {data?.lowStockCount ?? 0} article
              {(data?.lowStockCount ?? 0) > 1 ? "s" : ""} à surveiller
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#b7c4b8]">
              Anticipez les ruptures avant le prochain encaissement.
            </p>
            <Button
              onClick={() => onNavigate("products")}
              className="mt-auto bg-[#d1e980] text-[#24332a] hover:bg-[#dfefa1]"
            >
              Voir le stock
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuickStart({
  steps,
  onNavigate,
}: {
  steps: ReturnType<typeof getOnboardingSteps>;
  onNavigate: (section: WorkspaceSection) => void;
}) {
  const pending = steps.filter(step => !step.complete);
  return (
    <Card className="border border-[#dce6be] bg-[#f6fae9] shadow-[0_12px_30px_rgba(43,47,38,0.04)]">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#667a55]">
              Démarrage express
            </p>
            <p className="mt-1 font-serif text-2xl text-[#26352d]">
              Votre boutique sera prête en deux étapes.
            </p>
          </div>
          <span className="rounded-full bg-[#dcebb2] px-3 py-1 text-xs font-bold text-[#3e593a]">
            {steps.filter(step => step.complete).length}/{steps.length} terminé
          </span>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {pending.map((step, index) => (
            <div
              key={step.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[#dfe8c8] bg-white p-4"
            >
              <div>
                <p className="text-xs font-bold text-[#7a8d67]">
                  ÉTAPE {index + 1}
                </p>
                <p className="mt-1 font-semibold">{step.title}</p>
                <p className="mt-1 text-xs text-[#6f786b]">
                  {step.description}
                </p>
              </div>
              <Button
                size="sm"
                className="shrink-0 bg-[#405a3e]"
                onClick={() =>
                  onNavigate(step.id === "products" ? "products" : "pos")
                }
              >
                {step.id === "products" ? "Ajouter" : "Vendre"}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardAlerts({
  currency,
  onNavigate,
  lowStockItems,
  overdueReceivables,
}: {
  currency: string;
  onNavigate: (section: WorkspaceSection) => void;
  lowStockItems: Array<{
    id: string;
    name: string;
    stockQuantity: number;
    alertThreshold: number;
  }>;
  overdueReceivables: Array<{
    id: string;
    customerName: string;
    balance: number;
    dueDate: Date;
  }>;
}) {
  if (lowStockItems.length === 0 && overdueReceivables.length === 0)
    return null;
  return (
    <Card className="border border-[#ecd8bd] bg-[#fffaf1] shadow-[0_12px_30px_rgba(43,47,38,0.04)]">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CircleAlert className="h-5 w-5 text-[#a46a2d]" />
            <div>
              <p className="font-serif text-xl">Alertes à traiter</p>
              <p className="text-xs text-[#7f7464]">
                Les priorités qui méritent votre attention aujourd’hui.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-[#f4e4c7] px-3 py-1 text-xs font-bold text-[#84581f]">
            {lowStockItems.length + overdueReceivables.length} alerte
            {lowStockItems.length + overdueReceivables.length > 1 ? "s" : ""}
          </span>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {lowStockItems.length > 0 && (
            <section className="rounded-2xl border border-[#f0dfc4] bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-[#9c593e]">Stock bas</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate("products")}
                >
                  Gérer le stock
                </Button>
              </div>
              <div className="mt-3 space-y-2">
                {lowStockItems.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="min-w-0 truncate">{item.name}</span>
                    <span className="shrink-0 font-semibold text-[#b85d4a]">
                      {item.stockQuantity} / seuil {item.alertThreshold}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
          {overdueReceivables.length > 0 && (
            <section className="rounded-2xl border border-[#f0dfc4] bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-[#a46a2d]">Créances échues</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate("customers")}
                >
                  Voir les créances
                </Button>
              </div>
              <div className="mt-3 space-y-2">
                {overdueReceivables.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      {item.customerName} ·{" "}
                      {new Date(item.dueDate).toLocaleDateString("fr-FR")}
                    </span>
                    <span className="shrink-0 font-semibold text-[#a46a2d]">
                      {currencyFormat(item.balance, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

type CartLine = {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  available: number;
  photoUrl?: string | null;
};
type Sellable = {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  barcode?: string | null;
  salePrice: number;
  stockQuantity: number;
  unit?: string;
  photoUrl?: string | null;
};
function Pos({
  shopId,
  currency,
  shopName,
  shopLogoUrl,
  shopAddress,
  shopContactPhone,
}: {
  shopId: string;
  currency: string;
  shopName: string;
  shopLogoUrl?: string | null;
  shopAddress?: string | null;
  shopContactPhone?: string | null;
}) {
  const products = trpc.catalog.products.list.useQuery({ shopId });
  const variants = trpc.catalog.variants.list.useQuery({ shopId });
  const currencySettings = trpc.currencies.settings.useQuery({ shopId });
  const customers = trpc.catalog.customers.list.useQuery({ shopId });
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [paymentCurrency, setPaymentCurrency] = useState(currency);
  const [cash, setCash] = useState("");
  const [mobileMoney, setMobileMoney] = useState("");
  const [discount, setDiscount] = useState("0");
  const [dueDate, setDueDate] = useState(() =>
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerNotice, setScannerNotice] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const quote = trpc.currencies.quote.useQuery(
    { shopId, currency: paymentCurrency },
    { enabled: Boolean(paymentCurrency) }
  );
  const [receipt, setReceipt] = useState<SaleReceipt | null>(null);
  const cartAnchor = useRef<HTMLDivElement>(null);
  const checkout = trpc.commerce.sales.checkout.useMutation({
    onSuccess: sale => {
      openReceipt(sale.saleNumber, false, sale.creditAmount === 0);
      setCart([]);
      setCustomerId("");
      setCash("");
      setMobileMoney("");
      setDueDate(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10)
      );
      utils.catalog.products.list.invalidate({ shopId });
      utils.insights.dashboard.invalidate({ shopId });
      utils.commerce.sales.list.invalidate({ shopId });
      utils.commerce.receivables.list.invalidate({ shopId });
    },
  });
  const [offlineProducts, setOfflineProducts] = useState<
    Array<{
      id: string;
      shopId: string;
      name: string;
      barcode?: string | null;
      isActive?: boolean;
      salePrice: number;
      stockQuantity: number;
      updatedAt: Date;
      unit?: string;
    }>
  >([]);
  const [offlineCustomers, setOfflineCustomers] = useState<
    Array<{
      id: string;
      shopId: string;
      name: string;
      phone?: string | null;
      updatedAt: Date;
    }>
  >([]);
  useEffect(() => {
    if (products.data) cacheProducts(products.data);
  }, [products.data]);
  useEffect(() => {
    if (customers.data) cacheCustomers(customers.data);
  }, [customers.data]);
  useEffect(() => {
    if (!navigator.onLine || products.isError)
      localProductsFor(shopId).then(setOfflineProducts);
  }, [shopId, products.isError]);
  useEffect(() => {
    if (!navigator.onLine || customers.isError)
      localCustomersFor(shopId).then(setOfflineCustomers);
  }, [shopId, customers.isError]);
  useEffect(() => {
    setPaymentCurrency(currency);
  }, [currency, shopId]);
  const activeProducts = products.data ?? offlineProducts;
  const sellableProducts = useMemo<Sellable[]>(() => {
    if (!products.data)
      return offlineProducts.map(item => ({
        ...item,
        productId: item.id,
        variantId: undefined,
        photoUrl: null,
      }));
    return products.data.reduce<Sellable[]>((result, product) => {
      const productVariants =
        variants.data?.filter(
          item => item.productId === product.id && item.isActive
        ) ?? [];
      if (productVariants.length === 0)
        result.push({
          id: product.id,
          productId: product.id,
          name: product.name,
          barcode: product.barcode,
          salePrice: product.salePrice,
          stockQuantity: product.stockQuantity,
          unit: product.unit,
          photoUrl: product.photoUrl,
        });
      else
        productVariants.forEach(variant =>
          result.push({
            id: variant.id,
            productId: product.id,
            variantId: variant.id,
            name: `${product.name} · ${variant.name}`,
            barcode: variant.barcode,
            salePrice: variant.salePrice,
            stockQuantity: variant.stockQuantity,
            unit: product.unit,
            photoUrl: resolveCatalogPhoto(product.photoUrl, variant.photoUrl),
          })
        );
      return result;
    }, []);
  }, [offlineProducts, products.data, variants.data]);
  const activeCustomers = customers.data ?? offlineCustomers;
  const filtered = sellableProducts.filter(
    item =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (typeof item.barcode === "string" && item.barcode.includes(search))
  );
  const exchangeRate =
    quote.data?.rateToBase ?? (paymentCurrency === currency ? 1 : 0);
  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const transactionSubtotal = exchangeRate > 0 ? subtotal / exchangeRate : 0;
  const discountValue = Number(discount) || 0;
  const transactionTotal = Math.max(0, transactionSubtotal - discountValue);
  const total = transactionTotal * (exchangeRate || 1);
  const credit = amountStillDue(
    total,
    (Number(cash) || 0) * (exchangeRate || 1),
    (Number(mobileMoney) || 0) * (exchangeRate || 1)
  );
  const customerRequired =
    requiresCustomerForSale(
      transactionTotal,
      Number(cash) || 0,
      Number(mobileMoney) || 0
    ) && !customerId;
  const overpayment = excessPayment(
    transactionTotal,
    Number(cash) || 0,
    Number(mobileMoney) || 0
  );
  const quickCashAmounts = suggestedCashAmounts(transactionTotal);
  const add = (item: (typeof filtered)[number]) =>
    setCart(items => {
      const found = items.find(
        line =>
          line.productId === item.productId && line.variantId === item.variantId
      );
      if (found)
        return items.map(line =>
          line.productId === item.productId && line.variantId === item.variantId
            ? { ...line, quantity: Math.min(line.quantity + 1, line.available) }
            : line
        );
      return [
        ...items,
        {
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          price: item.salePrice,
          quantity: 1,
          available: item.stockQuantity,
          photoUrl: item.photoUrl,
        },
      ];
    });
  const handleBarcode = useCallback(
    (barcode: string, source: "camera" | "manual") => {
      const product = sellableProducts.find(item => item.barcode === barcode);
      if (!product) {
        saveUnknownBarcode(shopId, barcode, source).catch(() => undefined);
        setSearch(barcode);
        setScannerNotice(
          `Code ${barcode} introuvable : il a été conservé localement pour compléter le catalogue.`
        );
        return false;
      }
      if (product.stockQuantity <= 0) {
        setScannerNotice(
          `${product.name} est actuellement en rupture de stock.`
        );
        return false;
      }
      add(product);
      setSearch("");
      setScannerNotice(`${product.name} a été ajouté au panier.`);
      return true;
    },
    [sellableProducts, shopId]
  );
  const handleScan = useCallback(
    (barcode: string) => handleBarcode(barcode, "camera"),
    [handleBarcode]
  );
  const submitManualBarcode = (event: React.FormEvent) => {
    event.preventDefault();
    const code = manualBarcode.trim();
    if (!code) return;
    if (handleBarcode(code, "manual")) setManualBarcode("");
  };
  const openReceipt = (
    saleNumber: string,
    pendingSync = false,
    isPaid = credit === 0
  ) =>
    setReceipt({
      shopName,
      logoUrl: shopLogoUrl,
      shopAddress,
      shopContactPhone,
      saleNumber,
      currency: paymentCurrency,
      soldAt: new Date(),
      customerName: activeCustomers.find(customer => customer.id === customerId)
        ?.name,
      lines: cart.map(line => ({
        name: line.name,
        quantity: line.quantity,
        unitPrice: line.price / (exchangeRate || 1),
      })),
      subtotal: transactionSubtotal,
      discount: discountValue,
      total: transactionTotal,
      cash: Number(cash) || 0,
      mobileMoney: Number(mobileMoney) || 0,
      credit: credit / (exchangeRate || 1),
      isPaid,
      pendingSync,
    });
  const submitSale = async () => {
    const payload = {
      shopId,
      customerId: customerId || undefined,
      operationId: crypto.randomUUID(),
      transactionCurrency: paymentCurrency,
      discountAmount: discountValue,
      payment: {
        cash: Number(cash) || 0,
        mobileMoney: Number(mobileMoney) || 0,
      },
      items: cart.map(line => ({
        productId: line.productId,
        variantId: line.variantId,
        quantity: line.quantity,
      })),
      dueDate:
        credit > 0 && dueDate ? new Date(`${dueDate}T23:59:59`) : undefined,
    };
    if (paymentCurrency !== currency && !navigator.onLine) {
      setScannerNotice(
        "Une vente dans une devise étrangère nécessite une connexion pour verrouiller le taux."
      );
      return;
    }
    if (!navigator.onLine) {
      await queueSale(
        payload,
        cart.map(line => ({
          productId: line.productId,
          name: line.name,
          quantity: line.quantity,
          price: line.price,
        }))
      );
      openReceipt(
        `HORS-LIGNE-${payload.operationId.slice(0, 6).toUpperCase()}`,
        true
      );
      setCart([]);
      setCustomerId("");
      setCash("");
      setMobileMoney("");
      return;
    }
    checkout.mutate(payload);
  };
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F2") {
        event.preventDefault();
        setScannerNotice(null);
        setScannerOpen(true);
      }
      if (
        event.ctrlKey &&
        event.key === "Enter" &&
        cart.length > 0 &&
        !checkout.isPending &&
        !customerRequired
      ) {
        event.preventDefault();
        submitSale();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cart.length, checkout.isPending, customerRequired, submitSale]);
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
      <Card className="border-0 bg-white shadow-[0_12px_30px_rgba(43,47,38,0.05)]">
        <CardContent className="p-5 sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-serif text-xl">Catalogue disponible</p>
              <p className="mt-1 text-xs text-[#85877f]">
                Touchez un article, scannez ou saisissez son code-barres. Sur
                ordinateur, F2 ouvre le scanner.
              </p>
            </div>
            <PosCatalogSearch
              query={search}
              onQueryChange={setSearch}
              onOpenScanner={() => {
                setScannerNotice(null);
                setScannerOpen(true);
              }}
            />
          </div>
          <form
            onSubmit={submitManualBarcode}
            className="mb-4 flex flex-col gap-2 rounded-xl bg-[#f3f5ec] p-3 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <Label htmlFor="manual-barcode" className="sr-only">
                Code-barres manuel
              </Label>
              <Input
                id="manual-barcode"
                value={manualBarcode}
                onChange={event => setManualBarcode(event.target.value)}
                inputMode="numeric"
                autoComplete="off"
                placeholder="Saisir ou coller un code-barres"
              />
            </div>
            <Button
              type="submit"
              disabled={!manualBarcode.trim()}
              className="h-11 bg-[#405a3e] hover:bg-[#304a31]"
            >
              Ajouter le code
            </Button>
          </form>
          {(!navigator.onLine || products.isError) && (
            <p className="mb-4 rounded-xl bg-[#fff5d8] px-3 py-2 text-xs font-medium text-[#87611f]">
              Mode hors ligne : le catalogue local est utilisé.
            </p>
          )}
          {scannerNotice && (
            <p
              role="status"
              aria-live="polite"
              className="mb-4 rounded-xl bg-[#edf1e3] px-3 py-2 text-xs font-medium text-[#4e6949]"
            >
              {scannerNotice}
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(item => (
              <button
                key={item.id}
                disabled={item.stockQuantity <= 0}
                onClick={() => add(item)}
                className="rounded-2xl border border-[#ece9df] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#bfd683] hover:shadow-md disabled:opacity-45"
              >
                <div className="flex gap-3">
                  {item.photoUrl ? (
                    <img
                      src={item.photoUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#edf1e3] text-lg font-semibold text-[#64805e]">
                      {item.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{item.name}</p>
                    <p className="mt-2 text-sm font-medium text-[#4f6c4b]">
                      {currencyFormat(item.salePrice, currency)}
                    </p>
                    <p className="mt-2 text-xs text-[#85877f]">
                      {item.stockQuantity} {item.unit ?? "unité"} en stock
                    </p>
                  </div>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-full py-12 text-center text-sm text-[#85877f]">
                Aucun produit disponible. Ajoutez-en depuis le catalogue.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      {cart.length > 0 && (
        <button
          type="button"
          onClick={() =>
            cartAnchor.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }
          className="fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-20 flex min-h-12 items-center justify-between rounded-2xl bg-[#26352d] px-4 text-left text-[#f7f7ef] shadow-[0_14px_30px_rgba(30,41,36,0.24)] lg:hidden"
        >
          <span className="text-sm font-semibold">
            {cart.length} article{cart.length > 1 ? "s" : ""} au panier
          </span>
          <span className="flex items-center gap-2 text-sm font-bold text-[#d1e980]">
            {currencyFormat(transactionTotal, paymentCurrency)}
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
          </span>
        </button>
      )}
      <Card
        ref={cartAnchor}
        id="pos-cart"
        className="h-fit scroll-mt-24 border-0 bg-[#26352d] text-[#f7f7ef] shadow-[0_18px_40px_rgba(43,47,38,0.18)] xl:sticky xl:top-24"
      >
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-[#d1e980]" />
              <p className="font-serif text-xl">Panier</p>
            </div>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs">
              {cart.length} article{cart.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="mt-5 max-h-64 space-y-3 overflow-auto pr-1">
            {cart.length === 0 && (
              <p className="rounded-xl border border-dashed border-white/15 py-8 text-center text-sm text-[#b7c4b8]">
                Votre panier est vide.
              </p>
            )}
            {cart.map(line => (
              <div
                key={`${line.productId}-${line.variantId || "base"}`}
                className="rounded-xl bg-white/[0.06] p-3"
              >
                <div className="flex justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    {line.photoUrl ? (
                      <img
                        src={line.photoUrl}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-xs font-bold text-[#d1e980]">
                        {line.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">
                      {line.name}
                    </p>
                  </div>
                  <button
                    aria-label={`Retirer ${line.name}`}
                    onClick={() =>
                      setCart(
                        cart.filter(
                          item =>
                            item.productId !== line.productId ||
                            item.variantId !== line.variantId
                        )
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4 text-[#dca0a0]" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center rounded-lg bg-[#18231d]/55">
                    <button
                      aria-label={`Réduire ${line.name}`}
                      onClick={() =>
                        setCart(
                          cart.map(item =>
                            item.productId === line.productId &&
                            item.variantId === line.variantId
                              ? {
                                  ...item,
                                  quantity: Math.max(1, item.quantity - 1),
                                }
                              : item
                          )
                        )
                      }
                      className="min-h-11 min-w-11 p-2.5"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-7 text-center text-sm">
                      {line.quantity}
                    </span>
                    <button
                      aria-label={`Augmenter ${line.name}`}
                      onClick={() =>
                        setCart(
                          cart.map(item =>
                            item.productId === line.productId &&
                            item.variantId === line.variantId
                              ? {
                                  ...item,
                                  quantity: Math.min(
                                    item.available,
                                    item.quantity + 1
                                  ),
                                }
                              : item
                          )
                        )
                      }
                      className="min-h-11 min-w-11 p-2.5"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="text-sm text-[#d1e980]">
                    {currencyFormat(
                      (line.price * line.quantity) / (exchangeRate || 1),
                      paymentCurrency
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Separator className="my-5 bg-white/10" />
          <div className="space-y-3">
            <select
              value={customerId}
              onChange={event => setCustomerId(event.target.value)}
              className="h-10 w-full rounded-md border border-white/15 bg-white/[0.07] px-3 text-sm text-white"
            >
              <option value="">Client comptant</option>
              {activeCustomers.map(customer => (
                <option
                  key={customer.id}
                  value={customer.id}
                  className="text-[#26352d]"
                >
                  {customer.name}
                </option>
              ))}
            </select>
            <label className="grid gap-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#d8e1d8]">
                Devise de paiement
              </Label>
              <select
                value={paymentCurrency}
                onChange={event => {
                  setPaymentCurrency(event.target.value);
                  setCash("");
                  setMobileMoney("");
                }}
                className="h-10 w-full rounded-md border border-white/15 bg-white/[0.07] px-3 text-sm text-white"
              >
                {currencySettings.data?.currencies
                  .filter(item => item.isActive)
                  .map(item => (
                    <option
                      key={item.currency}
                      value={item.currency}
                      className="text-[#26352d]"
                    >
                      {item.currency}
                      {item.currency === currency ? " · référence" : ""}
                    </option>
                  ))}
              </select>
            </label>
            {paymentCurrency !== currency && (
              <p className="rounded-xl bg-white/[0.07] px-3 py-2 text-xs text-[#d8e1d8]">
                {quote.isLoading
                  ? "Recherche du taux…"
                  : quote.data
                    ? `Taux appliqué : 1 ${paymentCurrency} = ${quote.data.rateToBase} ${currency}`
                    : "Définissez un taux avant d’encaisser dans cette devise."}
              </p>
            )}
            {credit > 0 && (
              <label className="grid gap-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#d8e1d8]">
                  Échéance du crédit
                </Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={event => setDueDate(event.target.value)}
                  className="border-white/15 bg-white/[0.07] text-white"
                />
              </label>
            )}
            <div className="grid grid-cols-2 gap-3">
              <SmallInput
                label={`Espèces · ${paymentCurrency}`}
                value={cash}
                onChange={setCash}
              />
              <SmallInput
                label={`Mobile money · ${paymentCurrency}`}
                value={mobileMoney}
                onChange={setMobileMoney}
              />
            </div>
            {transactionTotal > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#d8e1d8]">
                  Encaissement rapide
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {quickCashAmounts.map(amount => (
                    <Button
                      key={amount}
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                      onClick={() => {
                        setCash(String(amount));
                        setMobileMoney("");
                      }}
                    >
                      {amount === transactionTotal
                        ? "Montant exact"
                        : currencyFormat(amount, paymentCurrency)}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <SmallInput
              label={`Remise · ${paymentCurrency}`}
              value={discount}
              onChange={setDiscount}
            />
          </div>
          <Separator className="my-5 bg-white/10" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-[#b7c4b8]">
              <span>Sous-total</span>
              <span>
                {currencyFormat(transactionSubtotal, paymentCurrency)}
              </span>
            </div>
            <div className="flex justify-between text-[#b7c4b8]">
              <span>Remise</span>
              <span>- {currencyFormat(discountValue, paymentCurrency)}</span>
            </div>
            <div className="flex justify-between pt-2 text-lg font-semibold">
              <span>Total</span>
              <span>{currencyFormat(transactionTotal, paymentCurrency)}</span>
            </div>
            {paymentCurrency !== currency && (
              <div className="flex justify-between text-xs text-[#b7c4b8]">
                <span>Équivalent référence</span>
                <span>{currencyFormat(total, currency)}</span>
              </div>
            )}
            {credit > 0 && (
              <div className="flex justify-between text-sm text-[#f0c98a]">
                <span>Reste à crédit</span>
                <span>
                  {currencyFormat(
                    credit / (exchangeRate || 1),
                    paymentCurrency
                  )}
                </span>
              </div>
            )}
          </div>
          {overpayment > 0 && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-[#7a452d] px-3 py-2 text-center text-xs font-medium text-[#fff5e9]"
            >
              Le montant saisi dépasse le total de{" "}
              {currencyFormat(overpayment, paymentCurrency)}.
            </p>
          )}
          {customerRequired && !customerId && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-[#7a452d] px-3 py-2 text-center text-xs font-medium text-[#fff5e9]"
            >
              Choisissez un client pour enregistrer le solde à crédit.
            </p>
          )}
          <Button
            disabled={
              cart.length === 0 ||
              checkout.isPending ||
              customerRequired ||
              overpayment > 0 ||
              (paymentCurrency !== currency && (!quote.data || quote.isError))
            }
            onClick={submitSale}
            className="mt-4 h-12 w-full bg-[#d1e980] text-[#26352d] hover:bg-[#deeea2]"
          >
            {checkout.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="mr-2 h-4 w-4" />
            )}
            {credit > 0 ? "Enregistrer le crédit" : "Confirmer la vente"}
            <span className="ml-2 hidden text-xs opacity-70 sm:inline">
              Ctrl + Entrée
            </span>
          </Button>
          {checkout.error && (
            <p role="alert" className="mt-3 text-center text-xs text-[#f5acac]">
              {checkout.error.message}
            </p>
          )}
        </CardContent>
      </Card>
      <BarcodeScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onDetected={handleScan}
      />
      <SaleReceiptDialog
        receipt={receipt}
        onOpenChange={open => {
          if (!open) setReceipt(null);
        }}
      />
    </div>
  );
}

function Products({
  shopId,
  currency,
  suggestedBarcode,
  suggestionKey,
  onBarcodeCreated,
}: {
  shopId: string;
  currency: string;
  suggestedBarcode: string;
  suggestionKey: string;
  onBarcodeCreated: (barcode: string) => void;
}) {
  const utils = trpc.useUtils();
  const list = trpc.catalog.products.list.useQuery({ shopId });
  const [form, setForm] = useState({
    name: "",
    barcode: "",
    salePrice: "",
    purchasePrice: "",
    stockQuantity: "",
    alertThreshold: "5",
    category: "",
  });
  useEffect(() => {
    if (suggestedBarcode)
      setForm(current => ({ ...current, barcode: suggestedBarcode }));
  }, [suggestedBarcode, suggestionKey]);
  const create = trpc.catalog.products.create.useMutation({
    onSuccess: () => {
      if (form.barcode) onBarcodeCreated(form.barcode);
      setForm({
        name: "",
        barcode: "",
        salePrice: "",
        purchasePrice: "",
        stockQuantity: "",
        alertThreshold: "5",
        category: "",
      });
      utils.catalog.products.list.invalidate({ shopId });
      utils.insights.dashboard.invalidate({ shopId });
    },
  });
  const adjust = trpc.catalog.products.adjust.useMutation({
    onSuccess: () => {
      utils.catalog.products.list.invalidate({ shopId });
      utils.insights.dashboard.invalidate({ shopId });
    },
  });
  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <Card className="h-fit border-0 bg-[#edf1e3]">
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-[#4e6b48]" />
            <p className="font-serif text-xl">Nouveau produit</p>
          </div>
          <form
            onSubmit={event => {
              event.preventDefault();
              create.mutate({
                shopId,
                name: form.name,
                barcode: form.barcode || undefined,
                salePrice: Number(form.salePrice),
                purchasePrice: Number(form.purchasePrice) || 0,
                stockQuantity: Number(form.stockQuantity) || 0,
                alertThreshold: Number(form.alertThreshold) || 0,
                category: form.category || "Sans catégorie",
              });
            }}
            className="mt-5 space-y-3"
          >
            <SmallInput
              label="Nom"
              value={form.name}
              onChange={name => setForm({ ...form, name })}
            />
            <SmallInput
              label="Code-barres"
              value={form.barcode}
              onChange={barcode => setForm({ ...form, barcode })}
            />
            <SmallInput
              label="Prix de vente"
              value={form.salePrice}
              onChange={salePrice => setForm({ ...form, salePrice })}
            />
            <SmallInput
              label="Prix d’achat"
              value={form.purchasePrice}
              onChange={purchasePrice => setForm({ ...form, purchasePrice })}
            />
            <div className="grid grid-cols-2 gap-3">
              <SmallInput
                label="Stock initial"
                value={form.stockQuantity}
                onChange={stockQuantity => setForm({ ...form, stockQuantity })}
              />
              <SmallInput
                label="Seuil"
                value={form.alertThreshold}
                onChange={alertThreshold =>
                  setForm({ ...form, alertThreshold })
                }
              />
            </div>
            <SmallInput
              label="Catégorie"
              value={form.category}
              onChange={category => setForm({ ...form, category })}
            />
            <Button
              disabled={create.isPending || !form.name || !form.salePrice}
              className="mt-2 w-full bg-[#415b3c]"
              type="submit"
            >
              {create.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Ajouter au catalogue
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card className="border-0 bg-white shadow-[0_12px_30px_rgba(43,47,38,0.05)]">
        <CardContent className="p-5 sm:p-7">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="font-serif text-xl">Articles en stock</p>
              <p className="mt-1 text-xs text-[#85877f]">
                Les ajustements sont tracés dans l’historique.
              </p>
            </div>
            <span className="rounded-full bg-[#eef1e8] px-3 py-1 text-xs font-semibold">
              {list.data?.length ?? 0} articles
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-[#8b8e84]">
                <tr>
                  <th className="pb-4 font-semibold">Produit</th>
                  <th className="pb-4 font-semibold">Prix</th>
                  <th className="pb-4 font-semibold">Stock</th>
                  <th className="pb-4 font-semibold">Seuil</th>
                  <th className="pb-4 font-semibold text-right">Ajuster</th>
                </tr>
              </thead>
              <tbody>
                {list.data?.map(product => (
                  <tr key={product.id} className="border-t border-[#efede6]">
                    <td className="py-4">
                      <p className="font-semibold">{product.name}</p>
                      <p className="mt-0.5 text-xs text-[#8b8e84]">
                        {product.category}
                        {product.barcode ? ` · ${product.barcode}` : ""}
                      </p>
                    </td>
                    <td className="py-4">
                      {currencyFormat(product.salePrice, currency)}
                    </td>
                    <td
                      className={cn(
                        "py-4 font-semibold",
                        product.stockQuantity <= product.alertThreshold
                          ? "text-[#b85d4a]"
                          : "text-[#4c7148]"
                      )}
                    >
                      {product.stockQuantity} {product.unit}
                    </td>
                    <td className="py-4 text-[#77776c]">
                      {product.alertThreshold}
                    </td>
                    <td className="py-4 text-right">
                      <div className="inline-flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            adjust.mutate({
                              shopId,
                              productId: product.id,
                              delta: -1,
                              kind: "adjustment",
                              reason: "Ajustement manuel",
                            })
                          }
                        >
                          −1
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            adjust.mutate({
                              shopId,
                              productId: product.id,
                              delta: 1,
                              kind: "restock",
                              reason: "Réapprovisionnement manuel",
                            })
                          }
                        >
                          +1
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Credits({ shopId, currency }: { shopId: string; currency: string }) {
  const utils = trpc.useUtils();
  const receivables = trpc.commerce.receivables.list.useQuery({
    shopId,
    includeSettled: false,
  });
  const customers = trpc.catalog.customers.list.useQuery({ shopId });
  const [name, setName] = useState("");
  const create = trpc.catalog.customers.create.useMutation({
    onSuccess: () => {
      setName("");
      utils.catalog.customers.list.invalidate({ shopId });
    },
  });
  const repay = trpc.commerce.receivables.repay.useMutation({
    onSuccess: () => utils.commerce.receivables.list.invalidate({ shopId }),
  });
  return (
    <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
      <Card className="h-fit border-0 bg-[#fdf0dc]">
        <CardContent className="p-6">
          <p className="font-serif text-xl">Nouveau client</p>
          <p className="mt-2 text-sm text-[#7f7464]">
            Créez un client avant de lui accorder un crédit.
          </p>
          <form
            onSubmit={event => {
              event.preventDefault();
              create.mutate({ shopId, name });
            }}
            className="mt-5 space-y-3"
          >
            <SmallInput label="Nom du client" value={name} onChange={setName} />
            <Button
              disabled={!name || create.isPending}
              className="w-full bg-[#9d632d] hover:bg-[#82501f]"
              type="submit"
            >
              Ajouter le client
            </Button>
          </form>
          <div className="mt-7 border-t border-[#eddabf] pt-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8d7355]">
              Clients enregistrés
            </p>
            <div className="mt-3 space-y-2">
              {customers.data?.slice(0, 6).map(customer => (
                <p key={customer.id} className="text-sm">
                  {customer.name}
                </p>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-0 bg-white shadow-[0_12px_30px_rgba(43,47,38,0.05)]">
        <CardContent className="p-5 sm:p-7">
          <div className="mb-5">
            <p className="font-serif text-xl">Créances en cours</p>
            <p className="mt-1 text-xs text-[#85877f]">
              Chaque règlement réduit automatiquement le solde.
            </p>
          </div>
          <div className="space-y-3">
            {receivables.data?.map(({ receivable, customerName }) => (
              <div
                key={receivable.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#ece9df] p-4"
              >
                <div>
                  <p className="font-semibold">{customerName}</p>
                  <p className="mt-1 text-xs text-[#85877f]">
                    Solde initial :{" "}
                    {currencyFormat(receivable.originalAmount, currency)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-[#b05d4c]">
                    {currencyFormat(receivable.balance, currency)}
                  </p>
                  <Button
                    size="sm"
                    onClick={() =>
                      repay.mutate({
                        shopId,
                        receivableId: receivable.id,
                        amount: receivable.balance,
                        operationId: crypto.randomUUID(),
                        paymentMethod: "cash",
                      })
                    }
                  >
                    Régler
                  </Button>
                </div>
              </div>
            ))}
            {!receivables.data?.length && (
              <p className="py-12 text-center text-sm text-[#85877f]">
                Aucune créance ouverte.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Sales({ shopId, currency }: { shopId: string; currency: string }) {
  const sales = trpc.commerce.sales.list.useQuery({ shopId });
  return (
    <Card className="border-0 bg-white shadow-[0_12px_30px_rgba(43,47,38,0.05)]">
      <CardContent className="p-5 sm:p-7">
        <p className="font-serif text-xl">Ventes récentes</p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-[#8b8e84]">
              <tr>
                <th className="pb-4">Référence</th>
                <th className="pb-4">Date</th>
                <th className="pb-4">Client</th>
                <th className="pb-4">Paiement</th>
                <th className="pb-4 text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {sales.data?.map(({ sale, customerName }) => (
                <tr key={sale.id} className="border-t border-[#efede6]">
                  <td className="py-4 font-semibold">{sale.saleNumber}</td>
                  <td className="py-4 text-[#77776c]">
                    {new Date(sale.soldAt).toLocaleString("fr-FR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="py-4">{customerName || "Comptant"}</td>
                  <td className="py-4 capitalize">
                    {sale.paymentMethod.replace("_", " ")}
                  </td>
                  <td className="py-4 text-right font-semibold">
                    {currencyFormat(sale.total, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!sales.data?.length && (
            <p className="py-12 text-center text-sm text-[#85877f]">
              Aucune vente n’a encore été enregistrée.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function Reports({
  shopId,
  currency,
}: {
  shopId: string;
  currency: string;
}) {
  const toInputDate = (value: Date) => value.toISOString().slice(0, 10);
  const weekStart = () => {
    const value = new Date();
    value.setDate(value.getDate() - ((value.getDay() + 6) % 7));
    return toInputDate(value);
  };
  const [from, setFrom] = useState(weekStart);
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [granularity, setGranularity] = useState<"day" | "week">("day");
  const reportInput = useMemo(
    () => ({
      shopId,
      from: new Date(`${from}T00:00:00`),
      to: new Date(`${to}T23:59:59`),
      granularity,
    }),
    [shopId, from, to, granularity]
  );
  const report = trpc.insights.report.useQuery(reportInput);
  const data = report.data;
  const applyPreset = (kind: "today" | "week" | "month") => {
    const end = new Date();
    if (kind === "today") {
      const date = toInputDate(end);
      setFrom(date);
      setTo(date);
      setGranularity("day");
      return;
    }
    if (kind === "week") {
      setFrom(weekStart());
      setTo(toInputDate(end));
      setGranularity("day");
      return;
    }
    const start = new Date();
    start.setDate(start.getDate() - 27);
    setFrom(toInputDate(start));
    setTo(toInputDate(end));
    setGranularity("week");
  };
  if (report.isLoading)
    return <LoadingBlock label="Préparation de vos indicateurs…" />;
  if (report.isError)
    return (
      <RecoveryBlock
        message="Les rapports n’ont pas pu être chargés."
        onRetry={() => report.refetch()}
      />
    );
  return (
    <div className="space-y-6">
      <Card className="border-0 bg-[#edf1e3] shadow-[0_12px_30px_rgba(43,47,38,0.04)]">
        <CardContent className="flex flex-col gap-5 p-5 sm:p-6">
          <div>
            <p className="font-serif text-xl">Pilotez selon votre besoin</p>
            <p className="mt-1 text-xs text-[#85877f]">
              Consultez une journée, une semaine ou l’évolution des dernières
              semaines.
            </p>
          </div>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div
              className="flex flex-wrap gap-2"
              aria-label="Raccourcis de période"
            >
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => applyPreset("today")}
              >
                Aujourd’hui
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => applyPreset("week")}
              >
                Cette semaine
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => applyPreset("month")}
              >
                4 semaines
              </Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="grid min-w-[8.5rem] flex-1 gap-1 text-xs font-semibold text-[#687267]">
                Du
                <Input
                  type="date"
                  value={from}
                  onChange={event => setFrom(event.target.value)}
                />
              </label>
              <label className="grid min-w-[8.5rem] flex-1 gap-1 text-xs font-semibold text-[#687267]">
                Au
                <Input
                  type="date"
                  value={to}
                  onChange={event => setTo(event.target.value)}
                />
              </label>
              <fieldset className="grid gap-1">
                <legend className="text-xs font-semibold text-[#687267]">
                  Vue historique
                </legend>
                <div className="flex rounded-xl border border-[#d7ddca] bg-white p-1">
                  {(["day", "week"] as const).map(value => (
                    <Button
                      key={value}
                      type="button"
                      size="sm"
                      variant={granularity === value ? "default" : "ghost"}
                      className={cn(
                        "h-8 px-3",
                        granularity === value &&
                          "bg-[#405a3e] hover:bg-[#405a3e]"
                      )}
                      onClick={() => setGranularity(value)}
                    >
                      {value === "day" ? "Jour" : "Semaine"}
                    </Button>
                  ))}
                </div>
              </fieldset>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportMetric
          label="Chiffre d’affaires"
          value={currencyFormat(data?.turnover ?? 0, currency)}
          detail={`${data?.saleCount ?? 0} vente${(data?.saleCount ?? 0) > 1 ? "s" : ""} enregistrée${(data?.saleCount ?? 0) > 1 ? "s" : ""}`}
          change={data?.changes.turnover ?? null}
        />
        <ReportMetric
          label="Résultat d’activité"
          value={currencyFormat(data?.operatingResult ?? 0, currency)}
          detail="Marge brute moins dépenses"
          change={data?.changes.operatingResult ?? null}
        />
        <ReportMetric
          label="Dépenses"
          value={currencyFormat(data?.expenses ?? 0, currency)}
          detail={`${data?.expenseCount ?? 0} sortie${(data?.expenseCount ?? 0) > 1 ? "s" : ""} enregistrée${(data?.expenseCount ?? 0) > 1 ? "s" : ""}`}
          change={data?.changes.expenses ?? null}
          inverseTone
        />
        <ReportMetric
          label="Ticket moyen"
          value={currencyFormat(data?.averageTicket ?? 0, currency)}
          detail={`${currencyFormat(data?.creditAmount ?? 0, currency)} de créances créées`}
        />
      </div>
      <Card className="border-0 bg-white shadow-[0_12px_30px_rgba(43,47,38,0.05)]">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-serif text-xl">Évolution de l’activité</p>
              <p className="mt-1 text-xs text-[#85877f]">
                Ventes et dépenses par{" "}
                {granularity === "day" ? "jour" : "semaine"}.
              </p>
            </div>
            <div className="flex gap-3 text-xs font-semibold text-[#687267]">
              <span className="flex items-center gap-1.5">
                <i className="size-2 rounded-full bg-[#54734e]" />
                Ventes
              </span>
              <span className="flex items-center gap-1.5">
                <i className="size-2 rounded-full bg-[#c4873c]" />
                Dépenses
              </span>
            </div>
          </div>
          <figure className="mt-5">
            <div
              className="h-64"
              role="img"
              aria-label={`Évolution des ventes et dépenses par ${granularity === "day" ? "jour" : "semaine"}. Consultez le résumé et le détail sous le graphique.`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.timeline ?? []}>
                  <defs>
                    <linearGradient
                      id="report-sales-gradient"
                      x1="0"
                      x2="0"
                      y1="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#8faa74"
                        stopOpacity={0.38}
                      />
                      <stop offset="100%" stopColor="#8faa74" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="report-expenses-gradient"
                      x1="0"
                      x2="0"
                      y1="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#d9a65c"
                        stopOpacity={0.24}
                      />
                      <stop offset="100%" stopColor="#d9a65c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#8c8d83", fontSize: 11 }}
                  />
                  <YAxis hide />
                  <Tooltip
                    formatter={(value, name) => [
                      currencyFormat(Number(value), currency),
                      name === "turnover" ? "Ventes" : "Dépenses",
                    ]}
                    contentStyle={{
                      borderRadius: 14,
                      border: "1px solid #e5e2d8",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="turnover"
                    stroke="#54734e"
                    strokeWidth={2.5}
                    fill="url(#report-sales-gradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="#c4873c"
                    strokeWidth={2}
                    fill="url(#report-expenses-gradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <figcaption className="mt-3 rounded-xl bg-[#f7f8f3] px-3 py-2 text-xs leading-relaxed text-[#5f665d]">
              {currencyFormat(data?.turnover ?? 0, currency)} de ventes et{" "}
              {currencyFormat(data?.expenses ?? 0, currency)} de dépenses sur la
              période. La comparaison utilise la période précédente de même
              durée.
            </figcaption>
            {data?.timeline.length ? (
              <details className="mt-2 rounded-xl border border-[#e4e8de] bg-white px-3 py-2 text-xs text-[#4e5b4c]">
                <summary className="cursor-pointer font-semibold">
                  Consulter le détail de l’évolution
                </summary>
                <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {data.timeline.map(item => (
                    <li
                      key={item.startAt.toISOString()}
                      className="flex justify-between gap-3"
                    >
                      <span>{item.label}</span>
                      <span className="text-right font-semibold tabular-nums">
                        {currencyFormat(item.turnover, currency)} ·{" "}
                        {currencyFormat(item.expenses, currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </figure>
        </CardContent>
      </Card>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-0 bg-white shadow-[0_12px_30px_rgba(43,47,38,0.05)]">
          <CardContent className="p-6">
            <p className="font-serif text-xl">Produits les plus vendus</p>
            <div className="mt-5 space-y-3">
              {data?.topProducts.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-xl bg-[#f7f6f1] px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#dbe8bc] text-xs font-bold">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.name}</p>
                      <p className="text-xs text-[#85877f]">
                        {item.quantity} unité(s)
                      </p>
                    </div>
                  </div>
                  <p className="shrink-0 font-semibold tabular-nums">
                    {currencyFormat(item.revenue, currency)}
                  </p>
                </div>
              ))}
              {!data?.topProducts.length && (
                <p className="py-10 text-center text-sm text-[#85877f]">
                  Aucune vente sur cette période.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-white shadow-[0_12px_30px_rgba(43,47,38,0.05)]">
          <CardContent className="p-6">
            <p className="font-serif text-xl">Dépenses par catégorie</p>
            <p className="mt-1 text-xs text-[#85877f]">
              Repérez les postes qui pèsent le plus sur l’activité.
            </p>
            <div className="mt-5 space-y-3">
              {data?.expenseCategories.map(item => (
                <div
                  key={item.category}
                  className="flex items-center justify-between rounded-xl bg-[#fff9ef] px-4 py-3"
                >
                  <p className="font-medium">{item.category}</p>
                  <p className="font-semibold tabular-nums text-[#8c5c20]">
                    {currencyFormat(item.amount, currency)}
                  </p>
                </div>
              ))}
              {!data?.expenseCategories.length && (
                <p className="py-10 text-center text-sm text-[#85877f]">
                  Aucune dépense sur cette période.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ReportMetric({
  label,
  value,
  detail,
  change,
  inverseTone = false,
}: {
  label: string;
  value: string;
  detail: string;
  change?: number | null;
  inverseTone?: boolean;
}) {
  const isPositive = (change ?? 0) > 0;
  const isNegative = (change ?? 0) < 0;
  const beneficial = inverseTone ? isNegative : isPositive;
  const labelChange =
    change === null || change === undefined
      ? "Pas de comparaison sur la période précédente"
      : `${change > 0 ? "+" : ""}${change.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} % vs période précédente`;
  return (
    <Card className="border-0 bg-white shadow-[0_12px_30px_rgba(43,47,38,0.05)]">
      <CardContent className="p-5">
        <p className="text-xs font-semibold text-[#85877f]">{label}</p>
        <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        <p className="mt-2 text-xs text-[#72786d]">{detail}</p>
        {change !== undefined && (
          <p
            className={cn(
              "mt-3 flex items-center gap-1.5 text-xs font-semibold",
              change === null
                ? "text-[#737b70]"
                : beneficial
                  ? "text-[#3e6b42]"
                  : isNegative || isPositive
                    ? "text-[#a05c3f]"
                    : "text-[#737b70]"
            )}
          >
            {change === null ? (
              <Minus className="size-3" />
            ) : isPositive ? (
              <TrendingUp className="size-3" />
            ) : isNegative ? (
              <ArrowDown className="size-3" />
            ) : (
              <Minus className="size-3" />
            )}
            {labelChange}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
function SmallInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5">
      <Label className="text-[10px] font-bold uppercase tracking-[0.12em] text-current opacity-70">
        {label}
      </Label>
      <Input
        inputMode="decimal"
        value={value}
        onChange={event => onChange(event.target.value)}
      />
    </label>
  );
}
function LoadingBlock({
  label = "Chargement en cours…",
  fullScreen = false,
}: {
  label?: string;
  fullScreen?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "grid place-items-center gap-3 text-center text-sm text-[#52634d]",
        fullScreen ? "min-h-screen bg-[#f7f5ee]" : "min-h-[300px]"
      )}
    >
      <Loader2 className="h-6 w-6 animate-spin text-[#405641]" />
      <span>{label}</span>
    </div>
  );
}
function RecoveryBlock({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="grid min-h-[300px] place-items-center">
      <Card className="max-w-md border border-[#ecd8bd] bg-[#fffaf1]">
        <CardContent className="p-6 text-center">
          <p role="alert" className="text-sm leading-relaxed text-[#754d31]">
            {message}
          </p>
          <Button variant="outline" className="mt-4" onClick={onRetry}>
            Réessayer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
function EmptyShop() {
  const [shopName, setShopName] = useState("");
  const createShop = trpc.shops.create.useMutation({
    onSuccess: () => window.location.reload(),
  });
  return (
    <div className="grid min-h-screen place-items-center bg-[#f7f5ee] p-6">
      <Card className="max-w-md border-0 bg-white">
        <CardContent className="p-8 text-center">
          <p className="font-serif text-2xl">Aucune boutique configurée</p>
          <p className="mt-3 text-sm text-[#77776c]">
            Créez votre première boutique pour ouvrir la caisse et le catalogue.
          </p>
          <form
            className="mt-6 grid gap-3 text-left"
            onSubmit={event => {
              event.preventDefault();
              createShop.mutate({
                name: shopName,
                currency: "XAF",
                country: "CMR",
              });
            }}
          >
            <Label htmlFor="first-shop-name">Nom de la boutique</Label>
            <Input
              id="first-shop-name"
              required
              minLength={2}
              value={shopName}
              onChange={event => setShopName(event.target.value)}
              placeholder="Épicerie du marché"
            />
            <Button type="submit" disabled={createShop.isPending}>
              {createShop.isPending ? "Création…" : "Créer ma boutique"}
            </Button>
          </form>
          {createShop.error && (
            <p className="mt-3 text-sm text-red-700" role="alert">
              La boutique ne peut pas être créée pour le moment.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
