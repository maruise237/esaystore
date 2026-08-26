import { createAuthClient } from "@neondatabase/neon-js/auth";

export function resolveNeonAuthUrl(value: string | undefined) {
  const url = value?.trim();
  if (!url) throw new Error("VITE_NEON_AUTH_URL est requis pour l’authentification.");
  return url.replace(/\/$/, "");
}

export const neonAuthClient = createAuthClient(
  resolveNeonAuthUrl(import.meta.env.VITE_NEON_AUTH_URL)
);
