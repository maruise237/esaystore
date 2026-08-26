# Incident Vercel — Neon Auth

## Constat du 26 août 2026

Le domaine Vercel EASYSTOR sert désormais une CSP qui autorise l’origine Neon Auth attendue dans `connect-src`. Malgré cela, l’appel public `GET /api/trpc/auth.me` retourne encore `500 FUNCTION_INVOCATION_FAILED` avec une réponse texte Vercel, avant que tRPC puisse produire du JSON.

Le même appel anonyme est couvert localement par un test HTTP et répond correctement en JSON. La fonction Vercel doit donc être examinée dans les **Runtime Logs** du déploiement concerné, qui donnent la pile d’erreur précise au démarrage ou à l’invocation.

## Accès requis

Le navigateur de diagnostic n’est pas connecté à Vercel. Le propriétaire peut soit ouvrir une session Vercel dans le navigateur, soit fournir le message complet du Runtime Log associé à l’identifiant d’invocation figurant dans la réponse `FUNCTION_INVOCATION_FAILED`.

Les variables `VITE_NEON_AUTH_URL` et `NEON_AUTH_BASE_URL` doivent toutes deux pointer vers l’Auth Base URL de la branche `main` du projet Neon EASYSTOR ; elles ne doivent pas utiliser une autre instance Neon Auth.
