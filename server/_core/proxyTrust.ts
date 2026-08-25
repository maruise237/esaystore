import type { Express } from "express";

export function trustedProxySetting(environment = process.env.NODE_ENV) {
  // Les requêtes de production passent par le proxy géré juste en amont de la fonction.
  // En développement, ne faire confiance à aucun en-tête transmis par le client.
  return environment === "production" ? 1 : false;
}

export function configureTrustedProxy(app: Express) {
  app.set("trust proxy", trustedProxySetting());
}
