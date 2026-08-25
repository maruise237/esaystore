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

Au premier contrôle du domaine publié après le checkpoint, l’ancienne version d’authentification restait servie malgré un rechargement avec paramètre de cache. La validation locale, les tests et le build sont concluants ; une nouvelle vérification du domaine sera effectuée après la propagation de la révision publiée.

Un second contrôle après attente confirme que le domaine géré sert encore cette même révision antérieure. Les améliorations UX sont donc validées dans l’environnement de développement et dans la suite automatisée, mais la vérification du dernier déploiement demeure bloquée par la propagation de l’hébergement géré, et non par une erreur applicative visible.

Après la nouvelle publication confirmée, le domaine publié sert bien la révision améliorée : l’aide « Boutique → Produit → Vente », les onglets accessibles, les identifiants de champ et l’action d’affichage du mot de passe sont présents. L’invitation PWA ne s’affiche plus avant authentification, de sorte qu’elle ne peut plus recouvrir l’inscription ou la connexion.
