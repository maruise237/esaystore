# Administration SaaS EASYSTOR

Le panneau **EASYSTOR Control** est distinct de l’espace de gestion d’une boutique. Il sert à superviser la plateforme, les comptes et les espaces marchands sans donner aux utilisateurs ordinaires un accès global aux données.

## Initialisation et accès

Lorsqu’aucun compte administrateur n’existe encore, le premier compte connecté peut ouvrir **Administration SaaS** depuis sa session boutique et choisir **Initialiser l’administration**. L’attribution est atomique : une seule mise à jour conditionnelle peut réussir, même si deux sessions tentent l’action en même temps.

Une fois un administrateur enregistré, toutes les opérations de supervision passent par des procédures serveur protégées. Le contrôle ne repose jamais uniquement sur le bouton affiché dans l’interface.

| Rôle                         | Portée                                | Accès au panneau SaaS |
| ---------------------------- | ------------------------------------- | --------------------- |
| `seller`, `manager`, `owner` | Opérations d’une boutique donnée      | Non                   |
| `user`                       | Compte EASYSTOR sans privilège global | Non                   |
| `admin`                      | Supervision de la plateforme          | Oui                   |

## Fonctions disponibles

L’administration présente les indicateurs réels de comptes, boutiques, ventes et actions administratives quotidiennes. Elle permet de rechercher et filtrer les boutiques et comptes, de suspendre ou réactiver un espace marchand, de suspendre ou réactiver un compte et d’accorder ou retirer un rôle administrateur.

Toute action sensible est inscrite dans `admin_audit_logs` avec l’administrateur, l’action, la cible, les métadonnées utiles et l’horodatage. Les données métier ne sont pas supprimées depuis ce panneau.

## Garde-fous

> Une suspension bloque les procédures métier de la boutique côté serveur. L’utilisateur ne peut donc pas contourner l’interface en appelant directement l’API.

Les protections suivantes sont appliquées côté serveur :

- une boutique ne peut être suspendue sans motif ;
- un administrateur ne peut pas désactiver son propre compte ni modifier son propre rôle ;
- le dernier administrateur actif ne peut ni être désactivé ni être rétrogradé ;
- les comptes non-administrateurs reçoivent une réponse `FORBIDDEN` sur toutes les procédures SaaS ;
- les actions de suspension, réactivation et changement de rôle sont journalisées.

## Schéma et exploitation

La migration `0006_chilly_george_stacy.sql` ajoute `shops.is_active`, les informations de suspension et la table `admin_audit_logs`. Elle a été appliquée sur la base Neon du projet. Les migrations historiques étant déjà enregistrées par le déploiement initial, les évolutions suivantes doivent être préparées puis validées directement sur Neon selon la procédure de migration du projet.
