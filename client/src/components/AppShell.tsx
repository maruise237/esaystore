import {
  BarChart3,
  Box,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  FileSpreadsheet,
  ArrowRightLeft,
  PanelLeftClose,
  PanelLeftOpen,
  CircleHelp,
  Settings2,
  ShoppingBag,
  WalletCards,
} from "lucide-react";
import React, { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import SyncStatus from "./SyncStatus";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  readSidebarCollapsed,
  saveSidebarCollapsed,
} from "@/lib/sidebarPreference";
import { type WorkspaceSection } from "@/lib/workspaceNavigation";

export type { WorkspaceSection } from "@/lib/workspaceNavigation";

const navigation: Array<{
  id: WorkspaceSection;
  label: string;
  icon: typeof LayoutDashboard;
  group: "Vendre" | "Gérer" | "Suivre" | "Réglages";
}> = [
  { id: "dashboard", label: "Pilotage", icon: LayoutDashboard, group: "Suivre" },
  { id: "pos", label: "Caisse", icon: ShoppingBag, group: "Vendre" },
  { id: "products", label: "Produits", icon: Box, group: "Vendre" },
  { id: "stock", label: "Stock", icon: Settings2, group: "Gérer" },
  { id: "customers", label: "Crédits", icon: WalletCards, group: "Suivre" },
  { id: "sales", label: "Ventes", icon: ReceiptText, group: "Suivre" },
  { id: "expenses", label: "Dépenses", icon: CreditCard, group: "Suivre" },
  { id: "reports", label: "Rapports", icon: BarChart3, group: "Suivre" },
  { id: "closing", label: "Clôture", icon: WalletCards, group: "Suivre" },
  { id: "migration", label: "Importer / exporter", icon: FileSpreadsheet, group: "Réglages" },
  { id: "currencies", label: "Devises & taux", icon: ArrowRightLeft, group: "Réglages" },
  { id: "team", label: "Équipe", icon: Settings2, group: "Réglages" },
  { id: "sync", label: "Synchronisation", icon: CreditCard, group: "Réglages" },
  { id: "support", label: "Support", icon: CircleHelp, group: "Réglages" },
];
const navigationGroups = ["Vendre", "Suivre", "Gérer", "Réglages"] as const;
const mobilePrimary = navigation.filter(item =>
  ["dashboard", "pos", "products", "customers"].includes(item.id)
);
const mobileSecondary = navigation.filter(
  item => !mobilePrimary.some(primary => primary.id === item.id)
);
const mobileSecondaryGroups = navigationGroups
  .map(group => ({
    group,
    items: mobileSecondary.filter(item => item.group === group),
  }))
  .filter(({ items }) => items.length > 0);

export default function AppShell({
  active,
  onNavigate,
  shopName,
  currency,
  userName,
  onLogout,
  children,
}: {
  active: WorkspaceSection;
  onNavigate: (section: WorkspaceSection) => void;
  shopName: string;
  currency: string;
  userName: string;
  onLogout: () => void;
  children: ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(readSidebarCollapsed);
  const toggleSidebar = () =>
    setSidebarCollapsed(current => {
      const next = !current;
      saveSidebarCollapsed(next);
      return next;
    });
  return (
    <div className="min-h-screen bg-[#f6f4ef] text-[#24231e]">
      <aside
        data-testid="desktop-sidebar"
        aria-label="Informations et navigation de la boutique"
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden min-h-0 flex-col overflow-hidden border-r border-[#e4e1d7] bg-[#1e2924] py-5 text-[#f7f5ee] transition-[width,padding] duration-200 lg:flex",
          sidebarCollapsed ? "w-[76px] px-3" : "w-72 px-5"
        )}
      >
        <div
          className={cn(
            "mb-6 flex shrink-0",
            sidebarCollapsed ? "flex-col items-center gap-3" : "items-center gap-3 px-2"
          )}
        >
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#d1e980] text-[#1e2924] shadow-[0_8px_22px_rgba(209,233,128,0.18)]">
            <ShoppingBag className="h-5 w-5" strokeWidth={2.8} />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="font-serif text-xl tracking-tight">EASYSTOR</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a8b7a7]">
                commerce fluide
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={
              sidebarCollapsed
                ? "Développer la barre latérale"
                : "Réduire la barre latérale"
            }
            title={sidebarCollapsed ? "Développer le menu" : "Réduire le menu"}
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[#cdd6cc] transition-colors hover:bg-white/[0.1] hover:text-white",
              sidebarCollapsed &&
                "border border-white/10 bg-[#293a30] shadow-[0_6px_14px_rgba(15,28,21,0.24)]"
            )}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        {!sidebarCollapsed && (
          <div className="mb-4 shrink-0 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <p className="truncate text-sm font-semibold">{shopName}</p>
            <p className="mt-1 text-xs text-[#afbcaf]">
              Devise active · {currency}
            </p>
          </div>
        )}

        <nav
          aria-label="Navigation principale"
          className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain pr-1 pb-4 [scrollbar-width:thin] [scrollbar-color:#6f816d_transparent]"
        >
          {navigationGroups.map(group => {
            const items = navigation.filter(item => item.group === group);
            if (items.length === 0) return null;
            return (
              <div key={group} className="space-y-1.5">
                {!sidebarCollapsed && (
                  <p className="px-3 pt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#829180] first:pt-0">
                    {group}
                  </p>
                )}
                {items.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={cn(
                        "flex w-full items-center rounded-xl py-3 text-left text-sm font-medium transition-[background-color,color,box-shadow] duration-150 ease-out motion-reduce:transition-none",
                        sidebarCollapsed ? "justify-center px-2" : "gap-3 px-3",
                        active === item.id
                          ? "bg-[#d1e980] text-[#1e2924] shadow-[0_8px_18px_rgba(15,28,21,0.22)]"
                          : "text-[#cdd6cc] hover:bg-white/[0.08] hover:text-white"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!sidebarCollapsed && item.label}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div
          className={cn(
            "shrink-0 border-t border-white/10 pt-4",
            sidebarCollapsed && "flex flex-col items-center"
          )}
        >
          {!sidebarCollapsed && (
            <div className="mb-4 px-2">
              <SyncStatus />
            </div>
          )}
          <div
            className={cn(
              "mb-3 flex items-center",
              sidebarCollapsed ? "justify-center" : "gap-3 px-2"
            )}
          >
            <div className="grid h-8 w-8 place-items-center rounded-full bg-[#31423a] text-xs font-bold">
              {userName.slice(0, 1).toUpperCase()}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{userName}</p>
                <p className="text-xs text-[#a8b7a7]">Session sécurisée</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            onClick={onLogout}
            title="Se déconnecter"
            className={cn(
              "text-[#b8c4b7] hover:bg-white/[0.08] hover:text-white",
              sidebarCollapsed ? "h-10 w-10 p-0" : "w-full justify-start"
            )}
          >
            <LogOut className={cn("h-4 w-4", !sidebarCollapsed && "mr-2")} />{" "}
            {!sidebarCollapsed && "Se déconnecter"}
          </Button>
        </div>
      </aside>

      <main
        className={cn(
          "pb-[calc(6rem+env(safe-area-inset-bottom))] transition-[margin] duration-200 lg:pb-0",
          sidebarCollapsed ? "lg:ml-[76px]" : "lg:ml-72"
        )}
      >
        {children}
      </main>

      <nav
        aria-label="Navigation mobile"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[#dedbd2] bg-[#fbfaf6]/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden"
      >
        {mobilePrimary.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex min-w-0 flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition-[background-color,color] duration-150 ease-out motion-reduce:transition-none",
                active === item.id
                  ? "bg-[#e7f3b5] text-[#26352d]"
                  : "text-[#77776c]"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex min-w-0 flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition-[background-color,color] duration-150 ease-out motion-reduce:transition-none",
                mobileSecondary.some(item => item.id === active)
                  ? "bg-[#e7f3b5] text-[#26352d]"
                  : "text-[#77776c]"
              )}
            >
              <Menu className="h-4 w-4" />
              Menu
            </button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="max-h-[85dvh] overflow-y-auto overscroll-contain rounded-t-3xl border-0 bg-[#f8f7f1] pb-[max(1.25rem,env(safe-area-inset-bottom))]"
          >
            <SheetHeader className="relative z-10 min-h-24 shrink-0 gap-1 border-b border-[#e4e1d7] pb-3 pr-14">
              <SheetTitle className="font-serif text-2xl">EASYSTOR</SheetTitle>
              <SheetDescription className="text-sm text-[#71756d]">
                {shopName} · {currency}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-4 px-4 pb-2">
              {mobileSecondaryGroups.map(({ group, items }) => (
                <section key={group} aria-label={group}>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#64715f]">
                    {group}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {items.map(item => {
                      const Icon = item.icon;
                      return (
                        <SheetClose asChild key={item.id}>
                          <button
                            onClick={() => {
                              onNavigate(item.id);
                              setMobileMenuOpen(false);
                            }}
                            className={cn(
                              "flex min-h-11 items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm font-semibold",
                              active === item.id
                                ? "border-[#bace7e] bg-[#e7f3b5] text-[#26352d]"
                                : "border-[#e4e1d7] bg-white text-[#485048]"
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            {item.label}
                          </button>
                        </SheetClose>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
            <div className="mx-4 mt-3 rounded-xl bg-[#eaf0df] px-3 py-2">
              <SyncStatus />
            </div>
            <Button
              variant="outline"
              onClick={onLogout}
              className="mx-4 mt-3 w-[calc(100%-2rem)] justify-center"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Se déconnecter
            </Button>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}
