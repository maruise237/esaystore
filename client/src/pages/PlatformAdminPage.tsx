import React from "react";
import { ArrowLeft, Loader2, LogIn, ShieldCheck } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import AdminPanel from "./AdminPanel";

const returnToWorkspace = () => window.location.replace("/");
const returnToLogin = () => window.location.assign("/?mode=login");

export default function PlatformAdminPage() {
  const { user, loading } = useAuth();
  const bootstrap = trpc.admin.bootstrapStatus.useQuery(undefined, {
    enabled: Boolean(user) && user?.role !== "admin",
  });
  const logout = trpc.auth.logout.useMutation({ onSuccess: returnToWorkspace });

  if (
    loading ||
    (Boolean(user) && user?.role !== "admin" && bootstrap.isLoading)
  ) {
    return (
      <main
        role="status"
        aria-live="polite"
        className="grid min-h-screen place-items-center gap-3 bg-[#f6f4ef] text-sm text-[#52634d]"
      >
        <Loader2 className="h-6 w-6 animate-spin text-[#405a3e]" />
        <span>Vérification de votre accès sécurisé…</span>
      </main>
    );
  }

  if (!user) {
    return (
      <RestrictedRoute message="Connectez-vous avec un compte administrateur de plateforme pour continuer." />
    );
  }

  const canClaimInitialAccess = Boolean(bootstrap.data?.canClaimInitialAccess);
  if (user.role !== "admin" && !canClaimInitialAccess) {
    return (
      <RestrictedRoute message="Cette console est réservée aux administrateurs de la plateforme." />
    );
  }

  return (
    <AdminPanel
      user={user}
      canClaimInitialAccess={canClaimInitialAccess}
      onExit={returnToWorkspace}
      onLogout={() => logout.mutate()}
    />
  );
}

function RestrictedRoute({ message }: { message: string }) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f6f4ef] p-5 lg:p-10">
      <aside className="absolute inset-y-0 left-0 hidden w-[38%] bg-[#1e2924] p-12 text-[#f7f5ee] lg:flex lg:flex-col">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#d1e980] text-[#1e2924]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="font-serif text-2xl">EASYSTOR</span>
        </div>
        <div className="my-auto max-w-xs">
          <p className="font-serif text-5xl leading-[1.02] tracking-tight">Control</p>
          <p className="mt-5 text-base leading-relaxed text-[#cdd6cc]">
            Les accès, boutiques et demandes sensibles de la plateforme restent sous supervision.
          </p>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b7ce69]">
          Accès opérateur sécurisé
        </p>
      </aside>
      <Card className="relative w-full max-w-lg border-0 bg-white shadow-[0_18px_50px_rgba(30,41,36,0.16)] lg:ml-[22%]">
        <CardContent className="p-6 sm:p-9">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#1e2924] text-[#d1e980]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="mt-2 font-serif text-3xl text-[#20251f]">
            Console de plateforme
          </h1>
          <p
            role="alert"
            className="mt-3 text-sm leading-relaxed text-[#805243]"
          >
            {message}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={returnToLogin} className="bg-[#26352d] text-[#f5f7e8] hover:bg-[#1b2721]">
              <LogIn className="mr-2 h-4 w-4" /> Se connecter
            </Button>
            <Button variant="outline" onClick={returnToWorkspace}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Retour à EASYSTOR
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
