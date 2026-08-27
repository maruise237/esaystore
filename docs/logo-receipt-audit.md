# Audit — logo de boutique et documents de vente

Le panneau `ProfilePanel` expose déjà les réglages réservés au propriétaire et s’appuie sur `profile.settings` / `profile.update`. Il doit recevoir un contrôle de téléversement d’image avec aperçu local instantané, état de chargement et suppression/réinitialisation explicite.

Le catalogue fournit le modèle de sécurité à réemployer : données URL PNG/JPEG/WebP, limite binaire de 2 Mo, clé S3 dédiée par boutique et persistance de l’URL retournée. Le logo sera enregistré au niveau de `shops`, jamais dans la base en tant que contenu binaire.

Les reçus sont actuellement construits côté client pour l’aperçu, l’impression, le téléchargement et le partage. Les quatre voies devront recevoir la même référence de logo et la même hiérarchie visuelle : marque de boutique, référence de vente, date, lignes, total et règlement. Les ventes hors ligne conservent un statut provisoire explicitement distingué.

## Décisions retenues

- Le propriétaire seul peut ajouter, remplacer ou retirer le logo ; il s’agit d’un réglage de boutique.
- Les formats admis sont PNG, JPEG et WebP, avec une limite de 2 Mo et une image carrée recommandée pour un rendu net dans les reçus.
- L’interface affiche le brouillon local immédiatement, mais l’envoi vers le stockage n’a lieu qu’au clic sur « Enregistrer les réglages ».
- Le reçu reste au format compact A6, avec une bande de marque evergreen, le logo optionnel et une information de vente structurée. L’impression, le PDF, le téléchargement et le partage utilisent la même identité.

## Vérification visuelle

L’aperçu de développement atteint correctement la route `#profile`, mais la session de navigateur disponible ne correspond à aucune boutique et l’application redirige vers l’inscription. Le panneau protégé n’a donc pas été vérifié en session réelle ; son rendu et son interaction sont couverts par le test de composant dédié.

Le domaine externe `esaystor.kamtech.online` ne retourne actuellement aucun contenu rendu dans la session de contrôle. La capture transmise par le propriétaire reste la preuve du blocage rencontré : une base liée au déploiement ne contient pas la colonne `users.phone` demandée par l’application publiée.

Après correction, l’aperçu de développement montre une inscription réduite au nom de boutique, e-mail, mot de passe et pays/devise. Le téléphone n’y apparaît plus ; une note le renvoie explicitement vers le profil après connexion.
