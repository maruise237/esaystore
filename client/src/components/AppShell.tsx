import {
  BarChart3,
  Box,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  FileSpreadsheet,
  Settings2,
  ShoppingBag,
  WalletCards,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import SyncStatus from "./SyncStatus";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export type WorkspaceSection = "dashboard" | "pos" | "products" | "stock" | "customers" | "sales" | "expenses" | "reports" | "closing" | "migration" | "team" | "sync";

const navigation: Array<{ id: WorkspaceSection; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "Pilotage", icon: LayoutDashboard },
  { id: "pos", label: "Caisse", icon: ShoppingBag },
  { id: "products", label: "Produits", icon: Box },
  { id: "stock", label: "Stock", icon: Settings2 },
  { id: "customers", label: "Crédits", icon: WalletCards },
  { id: "sales", label: "Ventes", icon: ReceiptText },
  { id: "expenses", label: "Dépenses", icon: CreditCard },
  { id: "reports", label: "Rapports", icon: BarChart3 },
  { id: "closing", label: "Clôture", icon: WalletCards },
  { id: "migration", label: "Importer / exporter", icon: FileSpreadsheet },
  { id: "team", label: "Équipe", icon: Settings2 },
  { id: "sync", label: "Synchronisation", icon: CreditCard },
];
const mobilePrimary = navigation.filter((item) => ["dashboard", "pos", "products", "customers"].includes(item.id));
const mobileSecondary = navigation.filter((item) => !mobilePrimary.some((primary) => primary.id === item.id));

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
  return (
    <div className="min-h-screen bg-[#f6f4ef] text-[#24231e]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-[#e4e1d7] bg-[#1e2924] px-5 py-6 text-[#f7f5ee] lg:flex">
        <div className="mb-10 flex items-center gap-3 px-2">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#d1e980] text-[#1e2924] shadow-[0_8px_22px_rgba(209,233,128,0.18)]">
            <ShoppingBag className="h-5 w-5" strokeWidth={2.8} />
          </div>
          <div>
            <p className="font-serif text-xl tracking-tight">EASYSTOR</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a8b7a7]">commerce fluide</p>
          </div>
        </div>

        <div className="mb-7 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
          <p className="truncate text-sm font-semibold">{shopName}</p>
          <p className="mt-1 text-xs text-[#afbcaf]">Devise active · {currency}</p>
        </div>

        <nav className="space-y-1.5">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-all duration-200",
                  active === item.id
                    ? "bg-[#d1e980] text-[#1e2924] shadow-[0_8px_18px_rgba(0,0,0,0.15)]"
                    : "text-[#cdd6cc] hover:bg-white/[0.08] hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-5">
          <div className="mb-4 px-2"><SyncStatus /></div>
          <div className="mb-3 flex items-center gap-3 px-2">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-[#31423a] text-xs font-bold">{userName.slice(0, 1).toUpperCase()}</div>
            <div className="min-w-0"><p className="truncate text-sm font-medium">{userName}</p><p className="text-xs text-[#a8b7a7]">Session sécurisée</p></div>
          </div>
          <Button variant="ghost" onClick={onLogout} className="w-full justify-start text-[#b8c4b7] hover:bg-white/[0.08] hover:text-white">
            <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
          </Button>
        </div>
      </aside>

      <main className="pb-24 lg:ml-72 lg:pb-0">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[#dedbd2] bg-[#fbfaf6]/95 px-2 py-2 backdrop-blur lg:hidden">
        {mobilePrimary.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)} className={cn("flex min-w-0 flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition-colors", active === item.id ? "bg-[#e7f3b5] text-[#26352d]" : "text-[#77776c]") }>
              <Icon className="h-4 w-4" />{item.label}
            </button>
          );
        })}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild><button className={cn("flex min-w-0 flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition-colors", mobileSecondary.some((item) => item.id === active) ? "bg-[#e7f3b5] text-[#26352d]" : "text-[#77776c]") }><Menu className="h-4 w-4" />Menu</button></SheetTrigger>
          <SheetContent side="bottom" className="max-h-[78vh] rounded-t-3xl border-0 bg-[#f8f7f1] pb-5">
            <SheetHeader><SheetTitle className="font-serif text-2xl">EASYSTOR</SheetTitle><p className="text-sm text-[#71756d]">{shopName} · {currency}</p></SheetHeader>
            <div className="grid grid-cols-2 gap-2 px-4 pb-2">{mobileSecondary.map((item) => { const Icon = item.icon; return <SheetClose asChild key={item.id}><button onClick={() => { onNavigate(item.id); setMobileMenuOpen(false); }} className={cn("flex items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm font-semibold", active === item.id ? "border-[#bace7e] bg-[#e7f3b5] text-[#26352d]" : "border-[#e4e1d7] bg-white text-[#485048]") }><Icon className="h-4 w-4" />{item.label}</button></SheetClose>; })}</div>
            <div className="mx-4 mt-3 rounded-xl bg-[#eaf0df] px-3 py-2"><SyncStatus /></div>
            <Button variant="outline" onClick={onLogout} className="mx-4 mt-3 w-[calc(100%-2rem)] justify-center"><LogOut className="mr-2 h-4 w-4" />Se déconnecter</Button>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}
