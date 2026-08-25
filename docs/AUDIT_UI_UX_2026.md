# Audit UI/UX EASYSTOR — 25 août 2026

## Périmètre et méthode

Cet audit couvre l’authentification, la navigation de l’espace marchand, la caisse, le catalogue, les données de pilotage, l’accès à la console de plateforme, les comportements mobiles et les états d’accessibilité. La prévisualisation a été contrôlée sur desktop et sur un viewport mobile de 390 px. Les espaces nécessitant une identité marchand ou administrateur ont été évalués dans leur implémentation et leurs tests automatisés, sans créer ni altérer de données utilisateur.

La grille de décision utilise le référentiel **UI/UX Pro** pour les parcours React, le mobile, les formulaires, les états et l’accessibilité. Ses recommandations sont adaptées au contexte d’une caisse française utilisable dans des réseaux instables, et non appliquées mécaniquement.[1]

## Diagnostic synthétique

| Axe | État initial | Correction livrée | État actuel |
| --- | --- | --- | --- |
| Entrée et inscription | Promesse claire, bons libellés et parcours guidé. | Conservation du split-screen desktop et de la forme mobile, sans ajout de friction. | Solide. |
| Navigation marchand | Quatorze sections au même niveau et sans reprise depuis l’URL. | Regroupement par tâches « Vendre », « Suivre », « Gérer » et « Réglages » ; navigation par hash avec prise en charge du bouton Retour. | Corrigé. |
| Navigation administrateur | Les cinq onglets restaient dans l’état local de la page. | Persistance des onglets de la console dans l’URL et dans l’historique. | Corrigé. |
| Caisse sur mobile | Le panier peut être éloigné du catalogue et les commandes de quantité étaient petites. | Barre de rappel du panier, défilement direct vers celui-ci, commandes ± de 44 px, CTA de validation de 48 px et zones sûres PWA. | Corrigé. |
| Scanner et raccourcis | Le raccourci F2 existait mais n’était pas découvert dans l’interface. | Indication explicite dans la caisse et touche F2 présentée sur desktop. | Corrigé. |
| Chargement et erreur | Certains chargements se limitaient à une icône et les erreurs de caisse n’étaient pas annoncées. | Messages `role="status"`/`role="alert"`, action de reprise du pilotage, message d’accès sécurisé et avertissements de caisse annoncés. | Corrigé. |
| Graphique des ventes | La courbe ne fournissait pas d’alternative complète à la lecture visuelle. | Libellé accessible, résumé chiffré et détail par jour dépliable. | Corrigé. |

## Points forts conservés

La première expérience possède une promesse concrète et cohérente avec le produit : vente, stock, créances, réseau instable et installation PWA. L’inscription suit une progression compréhensible « Boutique → Produit → Vente », les libellés sont reliés aux champs, les mots de passe peuvent être affichés et les états de traitement sont explicites.

L’interface conserve une direction adaptée à EASYSTOR : vert profond pour le cadre opérationnel, surfaces crème pour la lisibilité, accent citron réservé aux actions positives et typographie éditoriale pour les titres. Cette retenue est volontaire : elle rend la caisse plus stable visuellement qu’une superposition de cartes décoratives ou de gradients sans rôle métier.

## Corrections détaillées

### Navigation et continuité des parcours

Les sections de l’espace marchand sont maintenant encodées dans le hash de l’URL. Un utilisateur peut donc revenir de « Produits » à « Caisse », conserver sa position au rechargement et partager une entrée de section. La console de plateforme adopte le même comportement pour Pilotage, Support, Boutiques, Comptes et Journal. Les regroupements de navigation réduisent la charge de choix sans retirer de capacité.

Sur mobile, les entrées secondaires du menu sont désormais groupées par objectif. La zone de navigation et le tiroir inférieur respectent les zones sûres des appareils, ce qui évite une collision avec la barre système d’une PWA installée.

### Vente mobile et prévention des erreurs

La caisse conserve son catalogue complet, mais une barre de rappel mobile apparaît dès que le panier contient un article. Elle affiche le nombre d’articles et le total, puis amène directement au panier. Les commandes de quantité disposent maintenant d’une cible tactile de 44 px et la validation occupe 48 px. Les états de dépassement de paiement, de client obligatoire pour un crédit et d’échec d’encaissement sont annoncés en plus de leur signal visuel.

### Données et accessibilité

La visualisation du rythme des ventes conserve la courbe pour une lecture rapide, mais ajoute une description accessible, un résumé de période et une liste journalière dépliable. Les chargements de l’espace marchand et de l’accès administrateur sont accompagnés d’un texte explicite annoncé aux lecteurs d’écran. Un échec de chargement du pilotage propose également une action « Réessayer » au lieu d’une impasse.

## Validation réalisée

| Contrôle | Résultat |
| --- | --- |
| Tests unitaires et d’accessibilité | 38 fichiers, 82 tests réussis. |
| Tests dédiés | Navigation marchand, navigation administrateur, coque, scanner et console administrateur réussis. |
| Typage TypeScript | Réussi. |
| Build Vercel | Réussi. |
| Prévisualisation mobile | Authentification et accès restreint contrôlés à 390 × 844 px. |

## Priorités restantes

| Priorité | Sujet | Recommandation |
| --- | --- | --- |
| P2 | Performance initiale | Découper le bundle principal, actuellement signalé comme volumineux par le build, en chargeant à la demande les écrans lourds d’import, de reçu et de graphiques. |
| P2 | Validation terrain | Rejouer la caisse, le catalogue et la console avec un compte de démonstration isolé, sur un téléphone réel et un lecteur d’écran, avant une campagne de déploiement. |
| P3 | Mesure produit | Ajouter des événements anonymisés et consentis sur l’abandon d’inscription, le passage catalogue → première vente et la résolution des conflits hors-ligne. |

## Références

[1]: https://github.com/redf0x1/ui-ux-pro-mcp "UI/UX Pro MCP — catalogue de recommandations de conception"
