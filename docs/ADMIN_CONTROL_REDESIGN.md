# EASYSTOR Control — référentiel de refonte du back-office SaaS

## Objet et périmètre

EASYSTOR Control est le **back-office de plateforme** d’EASYSTOR. Il sert à superviser les boutiques, les comptes, les demandes de support et les actions administratives sensibles. Il ne doit pas devenir l’administration d’une boutique et n’inclut, à ce stade, **ni abonnement, ni plan, ni facturation, ni paiement SaaS**.

La recherche a été réalisée dans le navigateur intégré le 25 août 2026. Seules des sources officielles effectivement consultables ont été retenues pour les décisions de conception. Une page Atlassian, non lisible dans cet environnement, a volontairement été écartée plutôt que résumée à partir d’extraits non vérifiables.

## Principes retenus

| Principe | Référence | Décision pour EASYSTOR Control |
|---|---|---|
| **Une entrée orientée décision** | Un centre d’administration mature rassemble les tâches fréquentes, la santé, le support, les rapports et les espaces spécialisés. [1] | La vue **Pilotage** montre seulement les signaux qui appellent une action, puis renvoie vers Support, Boutiques, Comptes ou Journal. |
| **Des espaces explicites** | Microsoft distingue la gestion des utilisateurs, des rôles, du support, des rapports et de la santé. [1] | La navigation persistante est regroupée en Pilotage, Support, Boutiques, Comptes et Journal, avec une description courte par entrée. |
| **Des permissions réelles côté serveur** | OWASP différencie authentification et autorisation et recommande le moindre privilège ainsi que la validation des permissions pour chaque requête. [2] | La route privée améliore l’ergonomie, mais la protection repose exclusivement sur `adminProcedure` et sur les garde-fous métier. |
| **Des actions sensibles traçables** | L’ASVS fournit un référentiel vérifiable pour les contrôles de sécurité d’applications web. [3] | Les suspensions et changements de rôle nécessitent une confirmation, les suspensions de boutique un motif, et les actions sont journalisées. |
| **Un journal exploitable** | GitHub Enterprise agrège les événements, permet la recherche, l’identification de l’auteur et l’export pour analyse. [4] | Le journal EASYSTOR expose déjà l’auteur, la cible, l’action, l’horodatage et le motif. Il offre désormais des filtres par recherche, action et période. |
| **Des données accessibles** | Les tableaux de données doivent conserver l’association entre les en-têtes et les cellules. [5] | Les listes structurées restent sémantiques ; les vues mobiles privilégient les cartes lorsque le tableau serait illisible. |

## Fonctions retenues et état d’implémentation

| Domaine | Fonction retenue | État |
|---|---|---|
| Pilotage | Quatre indicateurs concis : boutiques saines, comptes actifs, ventes du jour et support à traiter. | Implémenté avec données Neon réelles. |
| File d’action | Accès direct aux demandes haute priorité, boutiques suspendues et comptes suspendus. | Implémenté avec appels vers les espaces concernés. |
| Santé opérationnelle | Nouveaux comptes et boutiques sur 7 jours, dossiers support en attente et volume d’activité du jour. | Implémenté avec agrégats serveur protégés. |
| Gouvernance | Suspension/réactivation, rôle de plateforme distinct, protection contre l’auto-désactivation et le dernier administrateur. | Déjà implémenté et conservé. |
| Support | Badge de demandes en attente, priorités, tri opérationnel, réponse, résolution et clôture. | Déjà implémenté et conservé. |
| Audit | Filtrage par texte, action et période ; conservation de l’auteur, de la cible, du motif et de la date. | Implémenté ; l’export restera une évolution distincte lorsque le volume le rendra nécessaire. |

## Décisions d’ergonomie

La console adopte un **parcours opérateur**. L’administrateur arrive sur « Pilotage », voit les quatre signaux essentiels et traite les éléments urgents sans parcourir des métriques décoratives. Les zones détaillées restent disponibles dans une navigation stable, dont les libellés décrivent à la fois l’objet et son rôle.

Les informations denses sont révélées progressivement. Les indicateurs restent globaux, les cartes « À traiter maintenant » donnent le contexte minimum et les boutons conduisent au dossier détaillé. Cette hiérarchie évite de fabriquer une fausse « santé plateforme » : tous les chiffres exposés proviennent des boutiques, comptes, tickets, ventes ou événements réels de Neon.

## Sécurité et confidentialité

La sécurité ne dépend jamais d’un bouton caché ou de l’URL `/platform-admin`. Les procédures administratives sont protégées côté serveur. Les valeurs de configuration et les identifiants d’infrastructure ne sont pas exposés dans la console, le journal ou le client. L’identité de l’administrateur, la cible, l’action et le motif restent les seules informations nécessaires à l’investigation opérationnelle.

> La route privée sépare les contextes de travail ; les contrôles d’autorisation côté serveur protègent les données et les actions.

## Exclusions assumées

La facturation, les abonnements, les plans, les licences payantes, les paiements SaaS et les annonces sponsorisées sont hors de cette refonte. Les annonces pourront constituer plus tard un module isolé, après définition de règles de diffusion, de modération et de traçabilité propres. Les alertes externes ou automatisées ne seront ajoutées qu’avec une politique de seuils, de destinataires et d’escalade explicitement validée.

## Validation attendue

Chaque évolution de la console doit préserver l’accès exclusif par `adminProcedure`, la confirmation des mutations à impact, les tests de refus pour un marchand, les tests d’accessibilité, le typage TypeScript, le build Vercel et les parcours Neon. L’objectif reste **WCAG 2.2 AA** avec des renforcements ciblés ; aucune conformité AAA globale n’est revendiquée.

## Références

[1]: https://learn.microsoft.com/en-us/microsoft-365/admin/admin-overview/admin-center-overview?view=o365-worldwide "Microsoft Learn — Microsoft 365 admin center overview"

[2]: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html "OWASP Cheat Sheet Series — Authorization"

[3]: https://owasp.org/www-project-application-security-verification-standard/ "OWASP — Application Security Verification Standard v5.0.0"

[4]: https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise "GitHub Enterprise Cloud Docs — Reviewing audit logs"

[5]: https://www.w3.org/WAI/tutorials/tables/ "W3C WAI — Tables Tutorial"
