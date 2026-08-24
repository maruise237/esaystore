# Déploiement EASYSTOR sur Vercel et Neon

EASYSTOR est configuré comme une application **Vite + React** servie depuis Vercel, avec des fonctions Node Serverless pour les procédures tRPC. La donnée métier est uniquement stockée dans **Neon PostgreSQL** via Drizzle. Cette version ne requiert ni image de conteneur, ni Dockerfile, ni service persistant.

## Architecture de production

| Couche | Service | Responsabilité |
|---|---|---|
| Interface | Vercel Static | Application React, manifeste PWA et service worker. |
| API | Vercel Serverless | Procédures tRPC, authentification par cookie signé et règles de contrôle d’accès. |
| Base de données | Neon PostgreSQL | Données cloisonnées par boutique, mouvements de stock, ventes et créances. |
| ORM | Drizzle | Schéma PostgreSQL versionné et migrations SQL dans `drizzle/migrations/`. |

> La connexion utilise le pilote HTTP Neon, adapté aux requêtes courtes des fonctions serverless. Les opérations de vente sensibles sont réalisées dans une transaction SQL atomique. [1] [2]

## Variables d’environnement

Ajoutez les variables suivantes dans **Vercel → Project Settings → Environment Variables** pour les environnements Production, Preview et Development. La valeur `NEON_DATABASE_URL` doit rester uniquement côté serveur : elle ne doit jamais être préfixée par `VITE_`.

| Variable | Requise | Rôle |
|---|---:|---|
| `NEON_DATABASE_URL` | Oui | URL poolée Neon PostgreSQL avec `sslmode=require`. |
| `JWT_SECRET` | Oui | Secret long et aléatoire utilisé pour signer les sessions de 30 jours. |
| `APP_URL` | Recommandée | URL publique de l’application, utile pour les futures extensions transactionnelles. |

Les variables `VITE_*` sont exposées au navigateur au moment du build. **N’ajoutez jamais** `NEON_DATABASE_URL` ou `JWT_SECRET` sous cette forme.

## Déploiement initial

Commencez par créer un projet Vercel depuis le dépôt GitHub. Sélectionnez `pnpm` comme gestionnaire de paquets si Vercel vous le demande. Le fichier `vercel.json` impose la commande `pnpm build:vercel`, produit le client dans `dist/public` et route les appels tRPC vers `api/trpc/[trpc].ts`.

Ensuite, renseignez les variables de production, puis appliquez la structure de base de données depuis une machine de confiance disposant de la même variable `NEON_DATABASE_URL` :

```bash
pnpm install --frozen-lockfile
pnpm drizzle-kit migrate
pnpm check
pnpm test
```

La migration initiale crée les utilisateurs, boutiques, membres, produits, mouvements de stock, ventes, lignes de ventes, créances, remboursements, dépenses et journal d’idempotence des synchronisations. Avant chaque évolution de modèle, exécutez `pnpm drizzle-kit generate`, relisez le SQL généré, puis appliquez `pnpm drizzle-kit migrate` contre la branche Neon visée.

## Branches et migrations Neon

Pour une évolution de schéma risquée, créez une branche Neon temporaire. Appliquez-y la migration et les tests, vérifiez les tables et index, puis promouvez la migration selon votre processus de changement. Ne supprimez jamais une table ou une colonne de production sans sauvegarde validée et plan de restauration.

| Situation | Pratique recommandée |
|---|---|
| Nouvelle migration additive | Générer, lire le SQL, tester sur une branche Neon, puis migrer la branche de production. |
| Modification ou suppression de données | Sauvegarde/export préalable, validation humaine et procédure de retour arrière documentée. |
| Déploiement Vercel Preview | Utiliser une branche Neon dédiée si la prévisualisation doit écrire des données. |

## Vérifications avant mise en ligne

La commande `pnpm check` contrôle TypeScript, tandis que `pnpm test` couvre la disponibilité Neon, la présence des tables critiques, la déconnexion et les règles de calcul de paiement. Vérifiez aussi manuellement : création de compte, ajout de produit, ajustement, vente comptant, vente à crédit, remboursement, déconnexion et vente hors-ligne suivie d’une reconnexion.

La PWA évite de mettre les routes `/api/*` dans le cache HTTP. Les opérations hors ligne sont écrites de façon atomique dans IndexedDB et remontées séquentiellement à la reconnexion. Les ventes qui rencontrent un conflit de stock restent dans le journal local et sont signalées pour résolution, sans suppression silencieuse de l’opération.

## Limites de la V1

Le mécanisme de synchronisation différée couvre les écritures métier déjà exposées par tRPC. Les écrans de résolution détaillée de conflit, scan caméra de code-barres, téléversement photo produit et paiements Mobile Money restent des extensions à finaliser avant une commercialisation large. Les données de démonstration ne sont jamais injectées dans la base de production.

## Références

[1] [Neon — Pilote serverless](https://neon.com/docs/serverless/serverless-driver)

[2] [Drizzle — Connexion à Neon](https://orm.drizzle.team/docs/connect-neon)

[3] [Vercel — Intégration Neon](https://vercel.com/marketplace/neon)
