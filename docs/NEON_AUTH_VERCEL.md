# Neon Auth, Google et Vercel

EASYSTOR utilise **Neon Auth** pour les nouveaux comptes e-mail et mot de passe. L’application garde ses données métier, ses rôles plateforme et ses droits de boutiques dans le schéma `public`, tandis que Neon conserve comptes et sessions dans le schéma `neon_auth`.

## Configuration actuellement retenue

| Élément | Configuration |
| --- | --- |
| Fournisseur e-mail | E-mail/mot de passe Neon Auth, avec code OTP à l’inscription |
| Vérification d’e-mail | Requise avant l’accès EASYSTOR |
| Domaine de production autorisé | `https://esaystor.kamtech.online` |
| Domaine de prévisualisation autorisé | Domaine EASYSTOR géré actuel |
| Liaison applicative | `public.neon_auth_identities` relie `neon_auth.user.id` à `public.users.id` |

L’API EASYSTOR ne fait pas confiance au navigateur seul : elle vérifie les jetons Neon Auth via le jeu de clés public JWKS, exige un e-mail vérifié, puis applique les rôles EASYSTOR et l’appartenance à chaque boutique côté serveur.

## Variables Vercel

Saisir ces clés dans **Vercel → Project Settings → Environment Variables**, pour l’environnement **Production**. Ne jamais les inscrire dans Git ni dans un fichier `.env` livré.

| Variable | Visibilité | Usage |
| --- | --- | --- |
| `VITE_NEON_AUTH_URL` | Client public | URL de base Neon Auth utilisée par le navigateur. Elle peut être exposée car ce n’est pas un secret. |
| `NEON_AUTH_BASE_URL` | Serveur | Même URL, utilisée pour valider émetteur, audience et JWKS des jetons. |
| `NEON_DATABASE_URL` | Serveur secret | Connexion PostgreSQL Neon EASYSTOR. |
| `JWT_SECRET` | Serveur secret | Maintien temporaire des sessions locales historiques pendant la transition. |
| `PLATFORM_OWNER_EMAIL` | Serveur privé | Initialisation contrôlée du premier administrateur plateforme. |

> Ne jamais préfixer une URL de base, un mot de passe, un jeton ou une clé privée par `VITE_` sauf `VITE_NEON_AUTH_URL`, qui est une URL publique volontairement utilisée par le navigateur.

## Parcours utilisateur

1. **E-mail** : inscription, réception d’un code OTP, saisie du code, création de la première boutique.
2. **Comptes historiques** : la connexion e-mail locale reste disponible pendant la transition. Aucun utilisateur, rôle, stock ou vente n’est supprimé.

## Actions avant ouverture au public

| Priorité | Action du propriétaire |
| --- | --- |
| Haute | Dans Neon **Settings → Auth**, définir le nom d’application visible : `EASYSTOR`. |
| Haute | Configurer un SMTP personnalisé avant un volume réel d’inscriptions ; le SMTP partagé Neon est adapté aux essais et limité. |
| Haute | Après les derniers essais locaux, désactiver **Allow localhost** dans Neon Auth de production. |
| Moyenne | Créer une branche Neon dédiée aux previews Vercel afin d’isoler comptes et données de test. |

## Contrôles effectués

- L’URL Neon Auth et son JWKS répondent correctement.
- L’origine du domaine EASYSTOR est autorisée par Neon Auth.
- La vérification e-mail OTP est requise à l’inscription.
- La table `public.neon_auth_identities` a été testée en branche Neon isolée puis ajoutée en production sans suppression de données.
- Les tests EASYSTOR, le typage et le build Vercel couvrent la configuration, le refus des identités non vérifiées, le bouton Google et l’étape OTP.


## Références

- [Neon Auth : flux d’authentification](https://neon.com/docs/auth/authentication-flow)
- [Neon Auth : vérification e-mail](https://neon.com/docs/auth/guides/email-verification)
- [Neon Auth : checklist de production](https://neon.com/docs/auth/production-checklist)
