# Revue senior EASYSTOR — état initial

## Parcours publié observé

Le 25 août 2026, la route publique `https://easystore-gckfmy7r.manus.space/platform-admin` a été parcourue dans le navigateur intégré. Après un premier affichage de chargement, la page a rendu un refus clair : « Accès restreint — Console de plateforme ». Le contenu administratif n’a pas été exposé sans session administrateur.

La route conserve un chemin de retour vers EASYSTOR. L’invitation PWA reste également visible sur cette page refusée ; ce comportement sera évalué lors de la revue UX comme une question de priorité visuelle, sans être considéré à ce stade comme une défaillance de sécurité.

Le bouton de retour a été suivi jusqu’à l’accueil publié. Celui-ci charge correctement, présente le formulaire de création et l’accès de connexion, sans cul-de-sac de navigation observé. Sur le viewport desktop observé, l’invitation PWA recouvre une partie basse du formulaire ; elle ne masque pas les champs principaux, mais peut détourner l’attention d’une action d’inscription. Ce point est classé provisoirement comme **amélioration UX à arbitrer**, sous réserve de l’essai mobile.

Les captures de contrôle à **375 × 812 px** confirment que l’accueil et le refus d’accès à `/platform-admin` restent lisibles, sans débordement ni cible cachée observés. L’invitation PWA n’apparaît pas sur cette capture mobile, ce qui évite le chevauchement constaté sur desktop. Une revue visuelle indépendante estime l’interface sobre et cohérente, tout en recommandant de renforcer l’identité de marque à long terme ; il s’agit d’une opportunité d’évolution et non d’un défaut de stabilité.

## Méthode prévue

La revue couvre : architecture, sécurité, gestion des erreurs, maintenabilité, dette technique, performances, accessibilité, tests, données Neon et déploiement Vercel. Les constats seront classés en **bloquant**, **élevé**, **modéré**, **faible** ou **amélioration recommandée** et seront distingués des hypothèses non vérifiées.

## Constats techniques vérifiés

| Domaine | État observé | Évaluation provisoire |
| --- | --- | --- |
| Contrôle d’accès | Les procédures métier vérifient l’identité, l’accès à la boutique, la suspension de celle-ci et les rôles avant l’exécution. Les routes de plateforme utilisent une procédure administrateur dédiée. | **Point fort** |
| Sessions | Les mots de passe sont hachés avec bcrypt et la session est placée dans un cookie `httpOnly`, `sameSite=lax`, avec `secure` en HTTPS. L’utilisateur est rechargé depuis Neon à chaque contexte, ce qui rend la désactivation effective sans attendre l’expiration du jeton. | **Point fort** |
| Secret de session | Le code utilise un secret de développement par défaut si `JWT_SECRET` est absent. Une instance de production mal configurée signerait donc des sessions avec une valeur connue. | **Élevé** |
| Limitation anti-abus | L’inscription et la connexion sont publiques, sans limite de tentative, temporisation progressive, verrouillage ni télémétrie d’échec applicative. | **Élevé** |
| Import de données | Le client accepte des fichiers de 12 Mo et le contrat métier autorise jusqu’à 8 000 lignes, tandis que le handler Vercel limite le corps tRPC à 1 Mo. Les imports réalistes peuvent donc échouer en production malgré une prévisualisation locale valide. | **Élevé** |
| Import XLSX | La dépendance directe `xlsx@0.18.5`, utilisée pour lire des fichiers fournis par les utilisateurs, est signalée par l’audit de dépendances pour des vulnérabilités de pollution de prototype et ReDoS sans correctif disponible sur npm. | **Élevé** |
| Dépendances | L’audit `pnpm audit --prod` signale 1 vulnérabilité critique, 22 élevées, 49 modérées et 10 faibles. Le paquet AWS portant la critique n’est pas importé par le code applicatif, mais demeure installé inutilement. `axios@1.12.2` et les transitives de `streamdown` doivent aussi être mises à jour ou retirées suivant leur usage réel. | **Élevé** |
| Images produit sur Vercel | Les uploads renvoient des URL `/manus-storage/...`. Le proxy qui les redirige vers un téléchargement signé n’est enregistré que dans le serveur Express local ; la configuration Vercel ne déclare aucune fonction équivalente ni réécriture vers celle-ci. Les images produit risquent donc d’être réécrites vers `index.html` sur Vercel. | **Élevé** |
| Routage | L’application choisit manuellement `/platform-admin` à partir de `window.location.pathname`; l’approche est correcte pour deux routes, mais ne constitue pas une architecture extensible et empêche le chargement paresseux des grands écrans. | **Modéré** |
| Interface de dialogue | La suite de tests affiche un avertissement React/Radix : les wrappers de dialogue ne transmettent pas les références. Les tests passent, mais ce signal doit être corrigé pour éviter une fragilité lors de mises à jour UI. | **Modéré** |
| Modules volumineux | `Workspace.tsx` atteint 1 928 lignes et `AdminPanel.tsx` 1 210 lignes. Le build produit un paquet JavaScript principal de 2,38 Mo non compressé (674 Ko gzip), avec avertissement Vite. | **Modéré** |
| Erreurs client | La frontière d’erreur globale affiche la pile JavaScript brute au visiteur, y compris en production. Cela divulgue des détails internes et ne respecte pas la langue de l’interface. | **Modéré** |
| Configuration d’outillage | pnpm avertit que `patchedDependencies` et `overrides` placés dans `package.json` sont ignorés. Le lockfile conserve aujourd’hui le patch de Wouter, mais une réinstallation peut ne plus le reproduire comme attendu. | **Modéré** |
| Observabilité | Les journaux publiés examinés ne remontent pas d’erreur runtime. Neon ne remonte aucune erreur de point d’accès sur sept jours. En revanche, `pg_stat_statements` n’est pas installé, empêchant d’identifier les requêtes lentes avant un incident. | **Modéré** |
| Qualité de livraison | 38 fichiers de test couvrent les parcours métier et l’intégration Neon. Le projet ne contient cependant ni configuration de linting, ni contrôle de couverture, ni pipeline CI versionné. | **Modéré** |
| Neon | Le schéma de ventes possède les index d’unicité et `(shop_id, sold_at)` attendus. Le journal d’audit indexe la date, l’acteur et la cible, mais le nouveau filtre par action et recherche textuelle ne bénéficiera pas d’index dédié lorsque le volume augmentera. | **Faible à court terme** |

Les tables et journaux Neon ont été interrogés en **lecture seule**. Aucune donnée de production n’a été modifiée pendant cette revue.

## Résultat des validations

| Contrôle | Résultat | Note |
| --- | --- | --- |
| Navigation publiée | Réussi | La route `/platform-admin` refuse correctement l’accès hors session et le retour vers l’accueil fonctionne. |
| Parcours mobile | Réussi | Les captures à 375 × 812 px ne révèlent pas de débordement sur l’accueil ni sur le refus d’accès administrateur. |
| TypeScript | Réussi | `pnpm check` termine sans erreur. |
| Tests unitaires | Réussi avec avertissement | 64 tests passent dans 30 fichiers. L’avertissement de références React/Radix du dialogue doit être supprimé. |
| Tests d’intégration Neon | Réussi | 17 tests passent dans 8 fichiers, y compris commerce, clôture, migration, devises, administration et support. |
| Build Vercel | Réussi avec avertissement | Le build Vite aboutit, mais signale un paquet principal supérieur à 500 Ko. |
| Journaux runtime publiés | Sans erreur observée | Les quatre lignes disponibles correspondent à des démarrages serveur normaux. |
| Journaux Neon sur sept jours | Sans erreur observée | Aucune erreur de point d’accès retournée par Neon. |

## Plan de remédiation priorisé

| Priorité | Action recommandée | Critère de clôture |
| --- | --- | --- |
| P0 — avant élargissement d’usage | Remplacer `xlsx` par une bibliothèque maintenue ou isoler strictement l’analyse des fichiers non fiables dans un traitement à faible privilège ; ajouter des tests de fichiers malformés. | L’audit ne contient plus de vulnérabilité élevée liée à l’import XLSX et les cas malveillants connus sont refusés. |
| P0 — avant promotion Vercel | Ajouter une fonction serverless pour `/manus-storage/*` ou remplacer les URLs retournées par un mécanisme compatible Vercel ; tester une photo produit après déploiement réel. | Une image chargée, affichée puis réouverte après un rafraîchissement est accessible depuis Vercel. |
| P0 — sécurité | Refuser le démarrage de production en l’absence de `JWT_SECRET`; ajouter une protection anti-bruteforce serveur pour `auth.login` et `auth.register`. | Un secret absent bloque la production et des tentatives répétées reçoivent une réponse limitée sans révéler d’information sur le compte. |
| P1 — fiabilité métier | Aligner la taille maximale d’import avec le handler Vercel et passer les imports volumineux à un stockage temporaire avec traitement par lots. | Un fichier accepté par l’interface atteint le serveur, est importé ou refusé par une limite cohérente et explicite. |
| P1 — dépendances | Retirer `@aws-sdk/client-s3`, les composants de démonstration inutilisés et leurs dépendances; mettre à jour axios; déplacer la configuration pnpm dans `pnpm-workspace.yaml`. | `pnpm install --frozen-lockfile`, les tests et le build ne produisent plus d’avertissement de configuration, tandis que l’audit est requalifié. |
| P1 — expérience d’erreur | Utiliser `React.forwardRef` pour les primitives de dialogue et afficher une erreur publique concise, en français, avec un identifiant corrélable au lieu d’une stack trace. | Les tests ne génèrent plus d’avertissement React et aucune pile interne n’est visible dans le navigateur publié. |
| P2 — performance et évolution | Scinder `Workspace.tsx` et `AdminPanel.tsx` par domaine; ajouter des imports paresseux pour les panneaux rarement ouverts et définir un budget de bundle. | Le premier chargement ne contient plus les modules non essentiels et Vite n’émet plus d’avertissement de paquet principal. |
| P2 — exploitation | Ajouter un linting, un contrôle de couverture et une CI; activer une solution d’observabilité de requêtes Neon adaptée à l’environnement. | Toute modification passe automatiquement typage, tests, build et seuils qualité avant livraison. |

## Conclusion

EASYSTOR présente un socle métier cohérent : isolation par boutique, contrôles de rôle, transactions de vente, journalisation administrative et tests Neon sont déjà bien structurés. Sa **première priorité n’est pas fonctionnelle** mais opérationnelle : sécuriser la chaîne d’import, fermer les écarts Vercel autour du stockage, imposer les secrets et limiter les tentatives d’authentification. Les optimisations de bundle, de découpage de composants et d’outillage peuvent ensuite renforcer durablement la maintenabilité sans perturber les parcours commerçants existants.
