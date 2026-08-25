import React from "react";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import AdminPanel from "./AdminPanel";

const returnToWorkspace = () => window.location.replace("/");

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
      <main className="grid min-h-screen place-items-center bg-[#f6f4ef]">
        <Loader2 className="h-6 w-6 animate-spin text-[#405a3e]" />
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
    <main className="grid min-h-screen place-items-center bg-[#f6f4ef] p-5">
      <Card className="w-full max-w-lg border-0 bg-white shadow-[0_18px_50px_rgba(30,41,36,0.12)]">
        <CardContent className="p-6 sm:p-9">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#1e2924] text-[#d1e980]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-[#5f665d]">
            Accès restreint
          </p>
          <h1 className="mt-2 font-serif text-3xl text-[#20251f]">
            Console de plateforme
          </h1>
          <p
            role="alert"
            className="mt-3 text-sm leading-relaxed text-[#805243]"
          >
            {message}
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={returnToWorkspace}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour à EASYSTOR
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
