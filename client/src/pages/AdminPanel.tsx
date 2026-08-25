import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CircleAlert,
  CircleCheck,
  ClipboardCheck,
  Gauge,
  Loader2,
  ListChecks,
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
import {
  readAdminTab,
  saveAdminTab,
  type AdminTab,
} from "@/lib/adminNavigation";
import AdminSupportPanel from "./AdminSupportPanel";

type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
};

type AuditAction =
  | "all"
  | "initial_admin_claimed"
  | "shop_suspended"
  | "shop_reactivated"
  | "user_suspended"
  | "user_reactivated"
  | "user_promoted_to_admin"
  | "user_demoted_to_user";
type AuditPeriod = "all" | "today" | "week" | "month";
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

const auditActionLabels: Record<Exclude<AuditAction, "all">, string> = {
  initial_admin_claimed: "Administration initialisée",
  shop_suspended: "Boutique suspendue",
  shop_reactivated: "Boutique réactivée",
  user_suspended: "Compte suspendu",
  user_reactivated: "Compte réactivé",
  user_promoted_to_admin: "Droits administrateur accordés",
  user_demoted_to_user: "Droits administrateur retirés",
};

const auditPeriodLabels: Record<AuditPeriod, string> = {
  all: "Tout l’historique",
  today: "Aujourd’hui",
  week: "7 derniers jours",
  month: "30 derniers jours",
};

const tabs: Array<{
  id: AdminTab;
  label: string;
  description: string;
  icon: typeof Activity;
}> = [
  { id: "overview", label: "Pilotage", description: "À surveiller", icon: Gauge },
  { id: "support", label: "Support", description: "Demandes", icon: LifeBuoy },
  { id: "shops", label: "Boutiques", description: "Espaces", icon: Store },
  { id: "users", label: "Comptes", description: "Accès", icon: Users },
  { id: "activity", label: "Journal", description: "Traçabilité", icon: Activity },
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
  const [activeTab, setActiveTab] = useState<AdminTab>(() => readAdminTab());
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "suspended">("all");
  const [auditQuery, setAuditQuery] = useState("");
  const [auditAction, setAuditAction] = useState<AuditAction>("all");
  const [auditPeriod, setAuditPeriod] = useState<AuditPeriod>("month");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null
  );
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    const restoreAdminTab = () => setActiveTab(readAdminTab());
    window.addEventListener("popstate", restoreAdminTab);
    window.addEventListener("hashchange", restoreAdminTab);
    return () => {
      window.removeEventListener("popstate", restoreAdminTab);
      window.removeEventListener("hashchange", restoreAdminTab);
    };
  }, []);
  const isAdmin = user.role === "admin";
  const listInput = useMemo(
    () => ({ query, status, limit: 40 }),
    [query, status]
  );
  const auditInput = useMemo(
    () => ({ query: auditQuery, action: auditAction, period: auditPeriod, limit: 50 }),
    [auditAction, auditPeriod, auditQuery]
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
  const activity = trpc.admin.activity.useQuery(auditInput, {
    enabled: isAdmin && activeTab === "activity",
  });
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

  const selectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    saveAdminTab(tab);
    setQuery("");
    setStatus("all");
  };

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
    <div className="min-h-screen bg-[#f5f6f2] text-[#20251f]">
      <header className="border-b border-[#27382e] bg-[#17241d] text-[#f7f5ee]">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#d1e980] text-[#1e2924] shadow-[0_8px_22px_rgba(209,233,128,0.16)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-serif text-lg">EASYSTOR Control</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#b7c5b4]">
                Console de plateforme
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

      <main className="mx-auto max-w-[1440px] px-4 py-5 pb-10 sm:px-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#52634d]">
              Centre de contrôle
            </p>
            <h1 className="mt-1 font-serif text-3xl tracking-tight sm:text-4xl">
              Décidez vite. Gardez le contrôle.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#4d5f4b]">
              Commencez par les dossiers qui exigent une action, puis pilotez
              les boutiques, comptes et règles de sécurité depuis un même espace.
            </p>
          </div>
          <div className="rounded-xl border border-[#cfdf9d] bg-[#edf5d8] px-4 py-3 text-sm text-[#334a30]">
            <BadgeCheck className="mr-2 inline h-4 w-4" />
            Session protégée ·{" "}
            {user.email || user.name || "Compte protégé"}
          </div>
        </div>

        <nav
          aria-label="Sections d’administration"
          className="mt-6 grid gap-2 rounded-2xl border border-[#e0e4da] bg-white p-2 shadow-[0_10px_28px_rgba(43,47,38,0.04)] sm:grid-cols-2 lg:grid-cols-5"
        >
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => selectTab(tab.id)}
                className={cn(
                  "relative flex min-w-0 items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                  activeTab === tab.id
                    ? "bg-[#1e2924] text-white shadow-[0_8px_18px_rgba(30,41,36,0.15)]"
                    : "text-[#4d5f4b] hover:bg-[#eff2e8]"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-bold">{tab.label}</span>
                  <span
                    className={cn(
                      "mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.12em]",
                      activeTab === tab.id ? "text-[#d1e980]" : "text-[#697868]"
                    )}
                  >
                    {tab.description}
                  </span>
                </span>
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
          <OverviewPanel
            loading={overview.isLoading}
            data={overview.data}
            onNavigate={selectTab}
          />
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
            query={auditQuery}
            action={auditAction}
            period={auditPeriod}
            onQueryChange={setAuditQuery}
            onActionChange={setAuditAction}
            onPeriodChange={setAuditPeriod}
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
  onNavigate,
}: {
  loading: boolean;
  data?: {
    users: {
      total: number;
      active: number;
      administrators: number;
      newLast7Days: number;
    };
    shops: {
      total: number;
      active: number;
      suspended: number;
      newLast7Days: number;
    };
    sales: {
      total: number;
      today: number;
      turnover: number;
      turnoverToday: number;
    };
    activityToday: number;
    support: { pending: number; waitingUser: number; highPriority: number };
  };
  onNavigate: (tab: AdminTab) => void;
}) {
  const stats = data
    ? [
        {
          label: "Boutiques saines",
          value: `${formatNumber(data.shops.active)} / ${formatNumber(data.shops.total)}`,
          detail: `${formatNumber(data.shops.newLast7Days)} nouvelle(s) en 7 jours`,
          icon: Building2,
          tone: "bg-[#eef3e4] text-[#334a30]",
        },
        {
          label: "Comptes actifs",
          value: `${formatNumber(data.users.active)} / ${formatNumber(data.users.total)}`,
          detail: `${formatNumber(data.users.newLast7Days)} nouveau(x) en 7 jours`,
          icon: Users,
          tone: "bg-[#edf4f0] text-[#285446]",
        },
        {
          label: "Ventes du jour",
          value: formatNumber(data.sales.today),
          detail: `${formatNumber(data.sales.turnoverToday)} montant de référence`,
          icon: Store,
          tone: "bg-[#fff0df] text-[#704916]",
        },
        {
          label: "Support à traiter",
          value: formatNumber(data.support.pending),
          detail: `${formatNumber(data.support.highPriority)} haute(s) priorité`,
          icon: LifeBuoy,
          tone: "bg-[#fff0ed] text-[#9c4d3b]",
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
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#52634d]">
                Vue opérationnelle
              </p>
              <h2 className="mt-1 font-serif text-2xl">Les signaux essentiels</h2>
            </div>
            <p className="text-sm text-[#52634d]">
              {formatNumber(data?.activityToday ?? 0)} action(s) journalisée(s) aujourd’hui
            </p>
          </div>
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
          <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
            <Card className="border-0 bg-white shadow-[0_10px_28px_rgba(43,47,38,0.05)]">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <ListChecks className="h-5 w-5 text-[#405a3e]" />
                      <h3 className="font-serif text-2xl">À traiter maintenant</h3>
                    </div>
                    <p className="mt-1 text-sm text-[#4d5f4b]">
                      Les éléments qui demandent une décision, pas seulement une lecture.
                    </p>
                  </div>
                  <ClipboardCheck className="h-6 w-6 text-[#9aaa83]" />
                </div>
                <div className="mt-5 space-y-3">
                  <ActionQueueItem
                    critical={(data?.support.highPriority ?? 0) > 0}
                    title={`${formatNumber(data?.support.highPriority ?? 0)} demande(s) à haute priorité`}
                    description="Consultez les dossiers de support qui ne doivent pas attendre."
                    action="Ouvrir le support"
                    onClick={() => onNavigate("support")}
                  />
                  <ActionQueueItem
                    critical={(data?.shops.suspended ?? 0) > 0}
                    title={`${formatNumber(data?.shops.suspended ?? 0)} boutique(s) suspendue(s)`}
                    description="Vérifiez les motifs, réactivez ou maintenez la protection nécessaire."
                    action="Voir les boutiques"
                    onClick={() => onNavigate("shops")}
                  />
                  <ActionQueueItem
                    critical={(data?.users.total ?? 0) > (data?.users.active ?? 0)}
                    title={`${formatNumber((data?.users.total ?? 0) - (data?.users.active ?? 0))} compte(s) suspendu(s)`}
                    description="Contrôlez les accès avant toute réactivation."
                    action="Gérer les comptes"
                    onClick={() => onNavigate("users")}
                  />
                </div>
              </CardContent>
            </Card>
            <div className="grid gap-5">
              <Card className="border-0 bg-[#1e2924] text-[#f7f5ee] shadow-[0_14px_32px_rgba(30,41,36,0.16)]">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-[#d1e980]" />
                    <div>
                      <h3 className="font-serif text-xl">Garde-fous actifs</h3>
                      <p className="mt-2 text-sm leading-relaxed text-[#cdd6cc]">
                        Le dernier administrateur et votre propre accès restent protégés. Les suspensions exigent un motif et chaque action sensible est tracée.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-[#d8e4c7] bg-[#f4f8eb] shadow-none">
                <CardContent className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#52634d]">Relations support</p>
                    <p className="mt-1 font-serif text-2xl text-[#26352d]">{formatNumber(data?.support.waitingUser ?? 0)}</p>
                    <p className="mt-1 text-sm text-[#4d5f4b]">dossier(s) en attente de réponse client</p>
                  </div>
                  <Button variant="outline" className="shrink-0" onClick={() => onNavigate("support")}>
                    Suivre <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function ActionQueueItem({
  critical,
  title,
  description,
  action,
  onClick,
}: {
  critical: boolean;
  title: string;
  description: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#e4e8de] bg-[#fbfcf9] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 gap-3">
        {critical ? (
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#a3533d]" />
        ) : (
          <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#537151]" />
        )}
        <div>
          <p className="font-semibold text-[#283128]">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-[#5f665d]">{description}</p>
        </div>
      </div>
      <Button variant="outline" className="shrink-0" onClick={onClick}>
        {action} <ArrowUpRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
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
  query,
  action,
  period,
  onQueryChange,
  onActionChange,
  onPeriodChange,
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
  query: string;
  action: AuditAction;
  period: AuditPeriod;
  onQueryChange: (value: string) => void;
  onActionChange: (value: AuditAction) => void;
  onPeriodChange: (value: AuditPeriod) => void;
}) {
  return (
    <section className="mt-6">
      <Card className="border-0 bg-white shadow-[0_10px_28px_rgba(43,47,38,0.05)]">
        <CardContent className="p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <Activity className="mt-1 h-5 w-5 text-[#405a3e]" />
            <div>
              <h2 className="font-serif text-2xl">Journal d’audit</h2>
              <p className="mt-1 text-sm text-[#4d5f4b]">
                Recherchez les changements sensibles par auteur, type d’action et période.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_190px]">
            <div className="relative">
              <Label htmlFor="admin-audit-search" className="sr-only">
                Rechercher dans le journal
              </Label>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#52634d]" />
              <Input
                id="admin-audit-search"
                value={query}
                onChange={event => onQueryChange(event.target.value)}
                className="pl-10"
                placeholder="Administrateur, action ou cible…"
              />
            </div>
            <Label className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[#4d5f4b]">
              Action
              <select
                value={action}
                onChange={event => onActionChange(event.target.value as AuditAction)}
                className="h-11 min-w-0 flex-1 rounded-md border border-input bg-white px-3 text-base sm:h-10 sm:text-sm"
              >
                <option value="all">Toutes</option>
                {Object.entries(auditActionLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Label>
            <Label className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[#4d5f4b]">
              Période
              <select
                value={period}
                onChange={event => onPeriodChange(event.target.value as AuditPeriod)}
                className="h-11 min-w-0 flex-1 rounded-md border border-input bg-white px-3 text-base sm:h-10 sm:text-sm"
              >
                {Object.entries(auditPeriodLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Label>
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
                      {auditActionLabels[entry.action as Exclude<AuditAction, "all">] || entry.action}
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
