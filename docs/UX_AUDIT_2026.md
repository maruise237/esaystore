# Audit UX EASYSTOR — 25 août 2026

## Observation du domaine publié

La page d’accueil publiée `https://easystore-gckfmy7r.manus.space/` répond de nouveau après la correction de démarrage JWT. Les parcours de création de boutique et de connexion sont accessibles, avec des libellés de champ et des actions explicites.

## Frictions directement observées

| Parcours | Constat | Conséquence |
| --- | --- | --- |
| Création de boutique desktop | L’invitation PWA s’affiche immédiatement au centre-bas et recouvre partiellement la zone d’action finale. | Elle détourne l’attention de la création de compte, qui est l’action principale pour un nouvel utilisateur. |
| Connexion desktop | La même invitation est affichée pendant la saisie de connexion. | Elle ajoute une décision non prioritaire avant l’accès à l’activité. |
| Accès initial | Les formulaires sont clairs, mais aucune indication ne prépare l’utilisateur aux étapes qui suivent la création : accès à la caisse, ajout de produit et première vente. | La valeur immédiate du produit est moins explicite au moment de l’inscription. |

## Décisions retenues

L’invitation PWA doit rester disponible, car elle est utile au produit mobile, mais devenir **contextuelle et non bloquante** : affichage après l’authentification ou après une interaction volontaire, sans masquer le CTA principal. Le parcours initial bénéficiera d’un repère de progression simple, orienté vers la première vente et non vers des paramètres secondaires.

## Validation après amélioration

Les captures de l’écran d’entrée à 1280 × 720 px et 375 × 812 px confirment que l’invitation PWA ne recouvre plus le formulaire anonyme. Le parcours d’inscription présente désormais la suite concrète « Boutique → Produit → Vente », les champs conservent leurs libellés et leurs aides, et le contrôle d’affichage du mot de passe reste atteignable sur mobile.
