import React, { useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  BadgeCheck,
  Building2,
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
  Store,
  UserCheck,
  UserRoundCog,
  Users,
  LifeBuoy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import AdminSupportPanel from "./AdminSupportPanel";

type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
};

type AdminTab = "overview" | "shops" | "users" | "activity" | "support";
type PendingAction =
  | { type: "shop"; id: string; label: string; nextActive: boolean }
  | { type: "user-status"; id: string; label: string; nextActive: boolean }
  | {
      type: "user-role";
      id: string;
      label: string;
      nextRole: "admin" | "user";
    };

const dateTime = (value: Date | string) =>
  new Date(value).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const formatNumber = (value: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value);

const tabs: Array<{ id: AdminTab; label: string; icon: typeof Activity }> = [
  { id: "overview", label: "Vue d’ensemble", icon: ShieldCheck },
  { id: "shops", label: "Boutiques", icon: Store },
  { id: "users", label: "Comptes", icon: Users },
  { id: "activity", label: "Journal", icon: Activity },
  { id: "support", label: "Support", icon: LifeBuoy },
];

export default function AdminPanel({
  user,
  canClaimInitialAccess,
  onExit,
  onLogout,
}: {
  user: AdminUser;
  canClaimInitialAccess: boolean;
  onExit: () => void;
  onLogout: () => void;
}) {
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "suspended">("all");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null
  );
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const isAdmin = user.role === "admin";
  const listInput = useMemo(
    () => ({ query, status, limit: 40 }),
    [query, status]
  );
  const overview = trpc.admin.overview.useQuery(undefined, {
    enabled: isAdmin,
  });
  const shopList = trpc.admin.shops.useQuery(listInput, {
    enabled: isAdmin && activeTab === "shops",
  });
  const userList = trpc.admin.users.useQuery(listInput, {
    enabled: isAdmin && activeTab === "users",
  });
  const activity = trpc.admin.activity.useQuery(
    { limit: 50 },
    { enabled: isAdmin && activeTab === "activity" }
  );
  const supportSummary = trpc.support.adminSummary.useQuery(undefined, {
    enabled: isAdmin,
  });
  const claimInitialAccess = trpc.admin.claimInitialAccess.useMutation({
    onSuccess: () => window.location.reload(),
  });
  const setShopActive = trpc.admin.setShopActive.useMutation({
    onSuccess: (_, values) => {
      setNotice(
        values.isActive
          ? "La boutique a été réactivée."
          : "La boutique a été suspendue."
      );
      setPendingAction(null);
      setReason("");
      utils.admin.overview.invalidate();
      utils.admin.shops.invalidate();
      utils.admin.activity.invalidate();
    },
  });
  const setUserActive = trpc.admin.setUserActive.useMutation({
    onSuccess: (_, values) => {
      setNotice(
        values.isActive
          ? "Le compte a été réactivé."
          : "Le compte a été suspendu."
      );
      setPendingAction(null);
      utils.admin.overview.invalidate();
      utils.admin.users.invalidate();
      utils.admin.activity.invalidate();
    },
  });
  const setUserRole = trpc.admin.setUserRole.useMutation({
    onSuccess: (_, values) => {
      setNotice(
        values.role === "admin"
          ? "Le compte est désormais administrateur."
          : "Les droits d’administration ont été retirés."
      );
      setPendingAction(null);
      utils.admin.overview.invalidate();
      utils.admin.users.invalidate();
      utils.admin.activity.invalidate();
    },
  });

  const pending =
    claimInitialAccess.isPending ||
    setShopActive.isPending ||
    setUserActive.isPending ||
    setUserRole.isPending;
  const queryError =
    overview.error ||
    shopList.error ||
    userList.error ||
    activity.error ||
    supportSummary.error;

  const submitPendingAction = () => {
    if (!pendingAction) return;
    if (pendingAction.type === "shop") {
      if (!pendingAction.nextActive && reason.trim().length < 3) return;
      setShopActive.mutate({
        shopId: pendingAction.id,
        isActive: pendingAction.nextActive,
        reason: pendingAction.nextActive ? undefined : reason.trim(),
      });
      return;
    }
    if (pendingAction.type === "user-status") {
      setUserActive.mutate({
        userId: pendingAction.id,
        isActive: pendingAction.nextActive,
      });
      return;
    }
    setUserRole.mutate({
      userId: pendingAction.id,
      role: pendingAction.nextRole,
    });
  };

  if (!isAdmin) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f6f4ef] p-5">
        <Card className="w-full max-w-xl border-0 bg-white shadow-[0_18px_50px_rgba(30,41,36,0.12)]">
          <CardContent className="p-6 sm:p-9">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#1e2924] text-[#d1e980]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-[#5f665d]">
              Configuration sécurisée
            </p>
            <h1 className="mt-2 font-serif text-3xl text-[#20251f]">
              Administration EASYSTOR
            </h1>
            {canClaimInitialAccess ? (
              <>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-[#4d5f4b]">
                  Aucun administrateur SaaS n’est encore défini. Cette
                  initialisation ne peut être réalisée qu’une seule fois : le
                  compte courant deviendra l’administrateur de la plateforme.
                </p>
                <Button
                  className="mt-6 w-full bg-[#405a3e] sm:w-auto"
                  disabled={claimInitialAccess.isPending}
                  onClick={() => claimInitialAccess.mutate()}
                >
                  {claimInitialAccess.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Initialiser l’administration
                </Button>
                {claimInitialAccess.error && (
                  <p role="alert" className="mt-3 text-sm text-red-700">
                    {claimInitialAccess.error.message}
                  </p>
                )}
              </>
            ) : (
              <p
                role="alert"
                className="mt-3 text-sm leading-relaxed text-[#805243]"
              >
                Cet espace est réservé aux administrateurs SaaS. Contactez un
                administrateur existant pour obtenir les droits nécessaires.
              </p>
            )}
            <Button variant="ghost" className="mt-5" onClick={onExit}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Retour à la boutique
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f4ef] text-[#24231e]">
      <header className="border-b border-[#e4e1d7] bg-[#1e2924] text-[#f7f5ee]">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#d1e980] text-[#1e2924]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-serif text-xl">EASYSTOR Control</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#cdd6cc]">
                Administration SaaS
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={onExit}
              className="text-[#f7f5ee] hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Boutique
            </Button>
            <Button
              variant="ghost"
              onClick={onLogout}
              className="text-[#f7f5ee] hover:bg-white/10 hover:text-white"
            >
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-6 pb-10 sm:px-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#52634d]">
              Supervision sécurisée
            </p>
            <h1 className="mt-1 font-serif text-3xl">
              Pilotez la plateforme, sans toucher aux données métier.
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#4d5f4b]">
              Les suspensions, réactivations et droits d’administration sont
              contrôlés côté serveur et inscrits dans un journal d’audit.
            </p>
          </div>
          <div className="rounded-2xl border border-[#cfdf9d] bg-[#edf5d8] px-4 py-3 text-sm text-[#334a30]">
            <BadgeCheck className="mr-2 inline h-4 w-4" />
            Session administrateur :{" "}
            {user.email || user.name || "Compte protégé"}
          </div>
        </div>

        <nav
          aria-label="Sections d’administration"
          className="mt-6 flex gap-2 overflow-x-auto rounded-2xl border border-[#e4e1d7] bg-white p-2"
        >
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setQuery("");
                  setStatus("all");
                }}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold",
                  activeTab === tab.id
                    ? "bg-[#1e2924] text-white"
                    : "text-[#4d5f4b] hover:bg-[#eff2e8]"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.id === "support" &&
                  (supportSummary.data?.pending ?? 0) > 0 && (
                    <span
                      aria-label={`${supportSummary.data?.pending} demandes de support à traiter`}
                      className="grid min-w-5 place-items-center rounded-full bg-[#d1e980] px-1.5 py-0.5 text-[10px] font-bold text-[#1e2924]"
                    >
                      {supportSummary.data!.pending > 99
                        ? "99+"
                        : supportSummary.data!.pending}
                    </span>
                  )}
              </button>
            );
          })}
        </nav>

        {notice && (
          <p
            role="status"
            className="mt-5 rounded-xl bg-[#e7f3b5] px-4 py-3 text-sm font-medium text-[#334a30]"
          >
            {notice}
          </p>
        )}
        {queryError && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-[#fff0ed] px-4 py-3 text-sm text-red-800"
          >
            {queryError.message}
          </p>
        )}

        {activeTab === "overview" && (
          <OverviewPanel loading={overview.isLoading} data={overview.data} />
        )}
        {activeTab === "shops" && (
          <ShopsPanel
            query={query}
            status={status}
            onQueryChange={setQuery}
            onStatusChange={setStatus}
            loading={shopList.isLoading}
            shops={shopList.data ?? []}
            onAction={setPendingAction}
          />
        )}
        {activeTab === "users" && (
          <UsersPanel
            query={query}
            status={status}
            onQueryChange={setQuery}
            onStatusChange={setStatus}
            loading={userList.isLoading}
            users={userList.data ?? []}
            currentUserId={user.id}
            onAction={setPendingAction}
          />
        )}
        {activeTab === "activity" && (
          <ActivityPanel
            loading={activity.isLoading}
            entries={activity.data ?? []}
          />
        )}
        {activeTab === "support" && <AdminSupportPanel />}
      </main>

      <Dialog
        open={Boolean(pendingAction)}
        onOpenChange={open => {
          if (!open && !pending) {
            setPendingAction(null);
            setReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction?.type === "shop"
                ? pendingAction.nextActive
                  ? "Réactiver la boutique"
                  : "Suspendre la boutique"
                : pendingAction?.type === "user-status"
                  ? pendingAction.nextActive
                    ? "Réactiver le compte"
                    : "Suspendre le compte"
                  : pendingAction?.nextRole === "admin"
                    ? "Accorder l’administration"
                    : "Retirer l’administration"}
            </DialogTitle>
            <DialogDescription>
              Vous allez modifier l’accès de{" "}
              <strong>{pendingAction?.label}</strong>. Cette action est
              journalisée et peut être inversée par un administrateur.
            </DialogDescription>
          </DialogHeader>
          {pendingAction?.type === "shop" && !pendingAction.nextActive && (
            <div className="grid gap-2">
              <Label htmlFor="suspension-reason">Motif de suspension</Label>
              <Input
                id="suspension-reason"
                value={reason}
                onChange={event => setReason(event.target.value)}
                placeholder="Ex. Vérification de sécurité en cours"
              />
              <p className="text-xs text-[#5f665d]">
                Au moins 3 caractères sont requis.
              </p>
            </div>
          )}
          {(setShopActive.error ||
            setUserActive.error ||
            setUserRole.error) && (
            <p role="alert" className="text-sm text-red-700">
              {setShopActive.error?.message ||
                setUserActive.error?.message ||
                setUserRole.error?.message}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => {
                setPendingAction(null);
                setReason("");
              }}
            >
              Annuler
            </Button>
            <Button
              className="bg-[#405a3e]"
              disabled={
                pending ||
                (pendingAction?.type === "shop" &&
                  !pendingAction.nextActive &&
                  reason.trim().length < 3)
              }
              onClick={submitPendingAction}
            >
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OverviewPanel({
  loading,
  data,
}: {
  loading: boolean;
  data?: {
    users: { total: number; active: number; administrators: number };
    shops: { total: number; active: number; suspended: number };
    sales: { total: number; today: number; turnover: number };
    activityToday: number;
  };
}) {
  const stats = data
    ? [
        {
          label: "Boutiques actives",
          value: `${formatNumber(data.shops.active)} / ${formatNumber(data.shops.total)}`,
          detail: `${formatNumber(data.shops.suspended)} suspendue(s)`,
          icon: Building2,
          tone: "bg-[#eef3e4] text-[#334a30]",
        },
        {
          label: "Comptes actifs",
          value: `${formatNumber(data.users.active)} / ${formatNumber(data.users.total)}`,
          detail: `${formatNumber(data.users.administrators)} administrateur(s)`,
          icon: Users,
          tone: "bg-[#edf4f0] text-[#285446]",
        },
        {
          label: "Ventes aujourd’hui",
          value: formatNumber(data.sales.today),
          detail: `${formatNumber(data.sales.total)} vente(s) au total`,
          icon: Store,
          tone: "bg-[#fff0df] text-[#704916]",
        },
        {
          label: "Actions journalisées",
          value: formatNumber(data.activityToday),
          detail: "depuis minuit",
          icon: Activity,
          tone: "bg-[#f2ecfa] text-[#5e437b]",
        },
      ]
    : [];
  return (
    <section className="mt-6" aria-label="Synthèse de la plateforme">
      {loading ? (
        <p className="py-12 text-center text-sm text-[#5f665d]">
          Chargement de la supervision…
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map(stat => {
              const Icon = stat.icon;
              return (
                <Card
                  key={stat.label}
                  className="border-0 bg-white shadow-[0_10px_28px_rgba(43,47,38,0.05)]"
                >
                  <CardContent className="p-5">
                    <div
                      className={cn(
                        "grid h-10 w-10 place-items-center rounded-xl",
                        stat.tone
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-[#5f665d]">
                      {stat.label}
                    </p>
                    <p className="mt-1 font-serif text-3xl">{stat.value}</p>
                    <p className="mt-2 text-sm text-[#4d5f4b]">{stat.detail}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Card className="mt-5 border-0 bg-[#1e2924] text-[#f7f5ee]">
            <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
              <ShieldAlert className="h-8 w-8 shrink-0 text-[#d1e980]" />
              <div>
                <p className="font-serif text-xl">Garde-fous actifs</p>
                <p className="mt-1 text-sm leading-relaxed text-[#cdd6cc]">
                  Un administrateur ne peut ni désactiver son propre compte, ni
                  retirer le dernier accès administrateur actif. Les suspensions
                  de boutique exigent un motif, et chaque action sensible est
                  horodatée.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </section>
  );
}

function SearchControls({
  query,
  status,
  onQueryChange,
  onStatusChange,
  label,
}: {
  query: string;
  status: "all" | "active" | "suspended";
  onQueryChange: (value: string) => void;
  onStatusChange: (value: "all" | "active" | "suspended") => void;
  label: string;
}) {
  return (
    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Label htmlFor={`${label}-search`} className="sr-only">
          Rechercher {label}
        </Label>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#52634d]" />
        <Input
          id={`${label}-search`}
          value={query}
          onChange={event => onQueryChange(event.target.value)}
          className="pl-10"
          placeholder={`Rechercher ${label}…`}
        />
      </div>
      <Label className="flex items-center gap-2 text-sm font-semibold text-[#4d5f4b]">
        Statut
        <select
          value={status}
          onChange={event =>
            onStatusChange(event.target.value as "all" | "active" | "suspended")
          }
          className="h-11 rounded-md border border-input bg-white px-3 text-base sm:h-10 sm:text-sm"
        >
          <option value="all">Tous</option>
          <option value="active">Actifs</option>
          <option value="suspended">Suspendus</option>
        </select>
      </Label>
    </div>
  );
}

function ShopsPanel({
  query,
  status,
  onQueryChange,
  onStatusChange,
  loading,
  shops,
  onAction,
}: {
  query: string;
  status: "all" | "active" | "suspended";
  onQueryChange: (value: string) => void;
  onStatusChange: (value: "all" | "active" | "suspended") => void;
  loading: boolean;
  shops: Array<{
    id: string;
    name: string;
    slug: string;
    currency: string;
    country: string;
    isActive: boolean;
    suspensionReason: string | null;
    suspendedAt: Date | null;
    createdAt: Date;
    ownerName: string | null;
    ownerEmail: string | null;
  }>;
  onAction: (value: PendingAction) => void;
}) {
  return (
    <section className="mt-6">
      <Card className="border-0 bg-white shadow-[0_10px_28px_rgba(43,47,38,0.05)]">
        <CardContent className="p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <Store className="mt-1 h-5 w-5 text-[#405a3e]" />
            <div>
              <h2 className="font-serif text-2xl">Boutiques</h2>
              <p className="mt-1 text-sm text-[#4d5f4b]">
                Supervisez les espaces marchands sans supprimer leurs données.
              </p>
            </div>
          </div>
          <SearchControls
            label="les boutiques"
            query={query}
            status={status}
            onQueryChange={onQueryChange}
            onStatusChange={onStatusChange}
          />
          <div className="mt-5 space-y-3">
            {loading ? (
              <p className="py-8 text-center text-sm text-[#5f665d]">
                Chargement des boutiques…
              </p>
            ) : (
              shops.map(shop => (
                <article
                  key={shop.id}
                  className="flex flex-col gap-4 rounded-2xl border border-[#e4e1d7] p-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{shop.name}</p>
                      <StatusBadge active={shop.isActive} />
                    </div>
                    <p className="mt-1 break-all text-xs text-[#5f665d]">
                      {shop.slug} · {shop.country} · {shop.currency}
                    </p>
                    <p className="mt-2 text-sm text-[#4d5f4b]">
                      Propriétaire :{" "}
                      {shop.ownerName || shop.ownerEmail || "Non renseigné"}
                    </p>
                    {!shop.isActive && (
                      <p className="mt-1 text-xs text-[#805243]">
                        Suspendue{" "}
                        {shop.suspendedAt
                          ? `le ${dateTime(shop.suspendedAt)}`
                          : ""}{" "}
                        · {shop.suspensionReason || "Sans motif renseigné"}
                      </p>
                    )}
                  </div>
                  <Button
                    variant={shop.isActive ? "outline" : "default"}
                    className={
                      shop.isActive
                        ? "border-[#bf7b69] text-[#9c4d3b]"
                        : "bg-[#405a3e]"
                    }
                    onClick={() =>
                      onAction({
                        type: "shop",
                        id: shop.id,
                        label: shop.name,
                        nextActive: !shop.isActive,
                      })
                    }
                  >
                    {shop.isActive ? "Suspendre" : "Réactiver"}
                  </Button>
                </article>
              ))
            )}
            {!loading && shops.length === 0 && (
              <p className="py-10 text-center text-sm text-[#5f665d]">
                Aucune boutique ne correspond à ce filtre.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function UsersPanel({
  query,
  status,
  onQueryChange,
  onStatusChange,
  loading,
  users,
  currentUserId,
  onAction,
}: {
  query: string;
  status: "all" | "active" | "suspended";
  onQueryChange: (value: string) => void;
  onStatusChange: (value: "all" | "active" | "suspended") => void;
  loading: boolean;
  users: Array<{
    id: string;
    name: string | null;
    email: string | null;
    role: "user" | "admin";
    isActive: boolean;
    createdAt: Date;
    lastSignedIn: Date;
    shopCount: number;
  }>;
  currentUserId: string;
  onAction: (value: PendingAction) => void;
}) {
  return (
    <section className="mt-6">
      <Card className="border-0 bg-white shadow-[0_10px_28px_rgba(43,47,38,0.05)]">
        <CardContent className="p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <UserRoundCog className="mt-1 h-5 w-5 text-[#405a3e]" />
            <div>
              <h2 className="font-serif text-2xl">Comptes & droits</h2>
              <p className="mt-1 text-sm text-[#4d5f4b]">
                Gérez les accès SaaS sans modifier les rôles opérationnels
                propres aux boutiques.
              </p>
            </div>
          </div>
          <SearchControls
            label="les comptes"
            query={query}
            status={status}
            onQueryChange={onQueryChange}
            onStatusChange={onStatusChange}
          />
          <div className="mt-5 space-y-3">
            {loading ? (
              <p className="py-8 text-center text-sm text-[#5f665d]">
                Chargement des comptes…
              </p>
            ) : (
              users.map(account => {
                const isCurrent = account.id === currentUserId;
                const label =
                  account.name || account.email || "Compte sans nom";
                return (
                  <article
                    key={account.id}
                    className="flex flex-col gap-4 rounded-2xl border border-[#e4e1d7] p-4 xl:flex-row xl:items-center xl:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{label}</p>
                        <StatusBadge active={account.isActive} />
                        {account.role === "admin" && (
                          <span className="rounded-full bg-[#e7f3b5] px-2.5 py-1 text-xs font-bold text-[#334a30]">
                            Administrateur
                          </span>
                        )}
                      </div>
                      <p className="mt-1 break-all text-xs text-[#5f665d]">
                        {account.email || "E-mail non renseigné"}
                      </p>
                      <p className="mt-2 text-sm text-[#4d5f4b]">
                        {account.shopCount} boutique(s) · dernière connexion :{" "}
                        {dateTime(account.lastSignedIn)}
                      </p>
                    </div>
                    <div className="grid gap-2 sm:flex">
                      {!isCurrent && (
                        <Button
                          variant="outline"
                          onClick={() =>
                            onAction({
                              type: "user-role",
                              id: account.id,
                              label,
                              nextRole:
                                account.role === "admin" ? "user" : "admin",
                            })
                          }
                        >
                          {account.role === "admin"
                            ? "Retirer l’admin"
                            : "Rendre admin"}
                        </Button>
                      )}
                      {!isCurrent && (
                        <Button
                          variant={account.isActive ? "outline" : "default"}
                          className={
                            account.isActive
                              ? "border-[#bf7b69] text-[#9c4d3b]"
                              : "bg-[#405a3e]"
                          }
                          onClick={() =>
                            onAction({
                              type: "user-status",
                              id: account.id,
                              label,
                              nextActive: !account.isActive,
                            })
                          }
                        >
                          {account.isActive ? "Suspendre" : "Réactiver"}
                        </Button>
                      )}
                      {isCurrent && (
                        <span className="self-center text-xs font-semibold text-[#52634d]">
                          Votre compte
                        </span>
                      )}
                    </div>
                  </article>
                );
              })
            )}
            {!loading && users.length === 0 && (
              <p className="py-10 text-center text-sm text-[#5f665d]">
                Aucun compte ne correspond à ce filtre.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function ActivityPanel({
  loading,
  entries,
}: {
  loading: boolean;
  entries: Array<{
    id: string;
    action: string;
    targetType: string;
    targetId: string | null;
    metadata: Record<string, unknown>;
    createdAt: Date;
    actorName: string | null;
    actorEmail: string | null;
  }>;
}) {
  const actionLabels: Record<string, string> = {
    initial_admin_claimed: "Administration initialisée",
    shop_suspended: "Boutique suspendue",
    shop_reactivated: "Boutique réactivée",
    user_suspended: "Compte suspendu",
    user_reactivated: "Compte réactivé",
    user_promoted_to_admin: "Droits administrateur accordés",
    user_demoted_to_user: "Droits administrateur retirés",
  };
  return (
    <section className="mt-6">
      <Card className="border-0 bg-white shadow-[0_10px_28px_rgba(43,47,38,0.05)]">
        <CardContent className="p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <Activity className="mt-1 h-5 w-5 text-[#405a3e]" />
            <div>
              <h2 className="font-serif text-2xl">Journal d’audit</h2>
              <p className="mt-1 text-sm text-[#4d5f4b]">
                Historique horodaté des changements administratifs sensibles.
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {loading ? (
              <p className="py-8 text-center text-sm text-[#5f665d]">
                Chargement du journal…
              </p>
            ) : (
              entries.map(entry => (
                <article
                  key={entry.id}
                  className="flex flex-col gap-2 rounded-2xl border border-[#e4e1d7] p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div>
                    <p className="font-semibold">
                      {actionLabels[entry.action] || entry.action}
                    </p>
                    <p className="mt-1 text-sm text-[#4d5f4b]">
                      Par{" "}
                      {entry.actorName || entry.actorEmail || "Administrateur"}{" "}
                      · cible : {entry.targetType}
                      {entry.metadata.name
                        ? ` · ${String(entry.metadata.name)}`
                        : ""}
                    </p>
                    {entry.metadata.reason ? (
                      <p className="mt-1 text-xs text-[#805243]">
                        Motif : {String(entry.metadata.reason)}
                      </p>
                    ) : null}
                  </div>
                  <time className="shrink-0 text-xs text-[#5f665d]">
                    {dateTime(entry.createdAt)}
                  </time>
                </article>
              ))
            )}
            {!loading && entries.length === 0 && (
              <p className="py-10 text-center text-sm text-[#5f665d]">
                Aucune action administrative n’a encore été journalisée.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-bold",
        active ? "bg-[#edf5d8] text-[#334a30]" : "bg-[#fff0ed] text-[#805243]"
      )}
    >
      {active ? (
        <>
          <UserCheck className="mr-1 inline h-3.5 w-3.5" />
          Actif
        </>
      ) : (
        "Suspendu"
      )}
    </span>
  );
}
