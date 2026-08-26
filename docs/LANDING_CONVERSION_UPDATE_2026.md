# Mise à jour conversion de la landing — 2026

## Diagnostic retenu

La landing mettait correctement en avant la caisse, le stock, le suivi et le travail hors connexion, mais ne montrait pas assez clairement la continuité avec les données déjà gérées sur Excel ou Google Sheets. La promesse d’une migration contrôlée et d’un export réversible est donc désormais visible dans le parcours principal. Le positionnement gratuit est également explicité sans inventer de prix, de date, d’avantage futur ou de limitation.

| Point | Correction mise en œuvre | Preuve de contrôle |
| --- | --- | --- |
| CTA inscription et connexion | Les routes `/auth?mode=register` et `/auth?mode=login` restent accessibles même pendant la lecture anonyme de session côté client. | Aperçus mobile des deux intentions URL et tests de routage. |
| Accès direct Vercel | Le fallback SPA utilise une syntaxe de réécriture documentée, sans intercepter `/api`. | Test de configuration dédié. |
| Migration de données | Une section explique l’import CSV/XLSX, la vérification des données historiques et l’export global compatible avec Google Sheets. | Test de contenu et aperçu desktop/mobile. |
| Offre actuelle | Le texte confirme le gratuit actuel, l’absence de carte bancaire ou paiement requis, et des tarifs à venir communiqués avant changement. | Test de contenu ; aucune offre de paiement ou de facturation ajoutée. |

## Contrôles visuels

Le rendu desktop conserve la séquence caisse, stock, suivi, migration, gratuité et synchronisation hors connexion sans en faire une grille de cartes génériques. À 390 px, la landing passe en une colonne lisible ; les formulaires de connexion et d’inscription restent directement affichés, avec leurs champs et cibles tactiles visibles.

Après le déploiement du fallback SPA corrigé, l’URL publique `/auth?mode=login` ne renvoie plus de 404. Le contrôle DOM du domaine Vercel confirme le montage du champ `#login-email` et du formulaire e-mail. Le cliché navigateur reste parfois blanc dans cet environnement, mais le titre, le texte et les contrôles réellement montés confirment la disponibilité du parcours.

## Périmètre assumé

Cette mise à jour n’ajoute ni abonnement, ni paiement, ni paywall, ni annonce sponsorisée. La fonction de prix reste une information marketing honnête : gratuit aujourd’hui, tarifs éventuels communiqués avant changement, sans montant ou échéance inventés.
