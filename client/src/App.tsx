import React, { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Workspace from "./pages/Workspace";
import PlatformAdminPage from "./pages/PlatformAdminPage";
import AuthPage from "./pages/AuthPage";
import Home from "./pages/Home";
import MigrationGuidePage from "./pages/MigrationGuidePage";
import OfflineGuidePage from "./pages/OfflineGuidePage";
import PwaInstallPrompt from "./components/PwaInstallPrompt";
import PwaUpdatePrompt from "./components/PwaUpdatePrompt";
import { useAuth } from "./_core/hooks/useAuth";

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  const pathname = window.location.pathname;
  const isPlatformAdminRoute = pathname === "/platform-admin";
  const isAuthRoute = pathname === "/auth";
  const isWorkspaceRoute = pathname === "/app";
  const isMigrationGuideRoute = pathname === "/guides/migrer-excel-google-sheets";
  const isOfflineGuideRoute = pathname === "/guides/travailler-hors-connexion";
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          {isPlatformAdminRoute ? (
            <PlatformAdminPage />
          ) : isAuthRoute ? (
            <AuthEntry />
          ) : isWorkspaceRoute ? (
            <Workspace />
          ) : isMigrationGuideRoute ? (
            <MigrationGuidePage />
          ) : isOfflineGuideRoute ? (
            <OfflineGuidePage />
          ) : (
            <PublicEntry />
          )}
          <PwaInstallPrompt />
          <PwaUpdatePrompt />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function PublicEntry() {
  const { user } = useAuth();
  return user ? <Workspace /> : <Home />;
}

function AuthEntry() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) window.location.replace("/app");
  }, [user]);

  if (user) {
    return <RouteLoading label="Ouverture de votre espace marchand…" />;
  }
  return <AuthPage />;
}

function RouteLoading({ label }: { label: string }) {
  return (
    <main
      role="status"
      aria-live="polite"
      className="grid min-h-screen place-items-center bg-[#f7f5ee] px-6 text-center text-sm font-medium text-[#52634d]"
    >
      {label}
    </main>
  );
}

export default App;
