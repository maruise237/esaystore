# Synthèse — directives landing EASYSTOR

Source : `/home/ubuntu/upload/DIRECTIVES-landing-EASYSTOR.pdf` (pages 1 à 5 consultées visuellement le 2026-08-27).

## Promesse centrale

La landing doit vendre la promesse suivante : **EASYSTOR reprend l’activité telle qu’elle est, sans tout recommencer, sans enfermer les données**.

## Positionnement à faire ressortir

1. Reprise des fichiers existants Excel ou Google Sheets.
2. Fonctionnement hors connexion par conception, puis synchronisation au retour du réseau.
3. Suivi des créances, dépenses et clôture de caisse jusqu’au résumé du soir.
4. Multi-devises réelles, sans conversion forcée.

## Ce qu’il ne faut pas dire

- Ne pas présenter EASYSTOR comme un abonnement.
- Ne pas laisser entendre que les données seront bloquées.
- Ne pas parler comme une solution pour grandes surfaces.
- Ne pas mettre les tarifs au centre ; indiquer seulement la gratuité actuelle, sans carte bancaire, avec annonce claire si cela change.

## Audience et ton

- Commerçants de proximité et proches qui les aident.
- Français simple, concret, sans jargon technique.
- Utiliser des exemples d’objets, montants et scènes de comptoir.
- Préférer les exemples et preuves produit aux promesses abstraites.

## Architecture imposée de page

1. Header.
2. Hero.
3. Bandeau preuve.
4. Section migration.
5. Section caisse / rythme de vente.
6. Section stock / catalogue / alertes.
7. Section suivi quotidien et clôture.
8. Section hors connexion.
9. Section tarifs courte.
10. FAQ.
11. CTA final + footer.

## Directives de copy clés

- Hero : titre = promesse, pas liste de produit.
- CTA principal : `Ouvrir ma boutique`.
- CTA secondaire : `Voir l’application`.
- Micro-preuve sous CTA : gratuit aujourd’hui, sans carte bancaire, données conservées.
- Section migration : insister sur import CSV/XLSX, vérification avant ajout, export global compatible Google Sheets.
- Section hors connexion : expliquer attente locale puis synchronisation au retour.
- FAQ : réponses courtes, honnêtes, sans urgence artificielle.

## Directives design lues

- Bleu KAMTECH `#232ac3` à conserver comme accent principal.
- Fonds clairs alternés autour de `#F7F7F8`.
- Texte sombre `#111827` et gris moyen `#4B5563`.
- Accent secondaire vert sobre `#059669`.
- Alerte orange `#D97706`.
- Titres serrés mais lisibles ; montants en tabular/monospace ; une seule famille sans décoratif.
- Un seul CTA primaire par écran.

## Directives complémentaires (pages 6 à 8)

- Les aperçus doivent évoquer l’interface réelle avec montants FCFA et badges d’état explicites, sans faux produits ou témoignages.
- Sur mobile, l’ordre est : hero, preuve, migration, caisse, clôture, tarifs et FAQ ; les CTA pleine largeur font au moins 44 px de haut et les aperçus restent lisibles.
- La navigation mobile se réduit au logo et à `Ouvrir ma boutique` ; les autres liens rejoignent le menu.
- Conserver un H1 unique, une hiérarchie de titres correcte, les URLs françaises existantes et l’image de partage d’interface.
- Éviter toute mention de prix, forfait, abonnement, urgence artificielle, concurrent ou technologie interne dans la landing.
- Ne pas employer les termes techniques `sync`, `dashboard`, `PWA` ou `mobile money` dans la copy publique ; expliquer les comportements en français courant.
- Les CTA doivent exprimer une action commerçant et être suivis d’une micro-réassurance. Éviter les modales ou popups qui bloquent la lecture.
- Priorité haute : hero, section migration, section tarifs, CTA mobile et FAQ migration/export.
- Vérifier l’utilisation d’images WebP/AVIF avec chargement différé et l’uniformité des badges d’état.

## Vérification visuelle desktop après implémentation

Contrôle réalisé sur la landing locale au format 1440 × 960 :

- Le premier écran porte désormais la promesse de reprise d’activité et expose immédiatement l’action `Ouvrir ma boutique`, l’action secondaire et la micro-réassurance de réversibilité.
- La section de migration se trouve avant les usages caisse, stock et suivi ; son parcours à trois étapes est visible sans faire défiler vers une documentation séparée.
- La palette privilégie le bleu KAMTECH pour les actions et le marine pour le fonctionnement hors connexion. Le vert reste réservé aux états prêts ou sûrs, l’orange aux alertes de stock.
- Les aperçus utilisent des montants concrets en FCFA et sont étiquetés comme illustratifs. Aucun avis, note, offre tarifaire inventée ou urgence artificielle n’est présent.
- L’inspection visuelle recommande de conserver le langage visuel transactionnel et de ne pas multiplier les cartes génériques au-delà des aperçus qui représentent directement l’interface.
