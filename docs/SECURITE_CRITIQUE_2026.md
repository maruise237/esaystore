# Durcissement de sécurité — 25 août 2026

## Périmètre contrôlé

L’audit a couvert les procédures tRPC publiques et protégées, les sessions, la limitation anti-abus, les routes serverless Vercel, le proxy de stockage, les en-têtes HTTP, les constructions SQL dynamiques et les dépendances de production.

## Corrections livrées

| Risque confirmé | Correction appliquée | Vérification |
| --- | --- | --- |
| Contournement possible des cookies sécurisés et de la limitation par en-têtes proxy forgés | La confiance proxy est centralisée : un seul proxy géré est accepté en production, aucun en-tête proxy ne l’est en développement. Les cookies reposent sur `req.secure` et le rate limit sur `req.ip`. | Tests unitaires dédiés aux en-têtes forgés et à la clé anti-bruteforce. |
| Vulnérabilités critiques ou élevées dans les dépendances | Retrait du SDK AWS inutilisé ; mises à jour d’Express, Axios, Streamdown, Drizzle ORM et Nano ID ; résolution forcée de Lodash corrigé. | L’audit de production ne remonte plus aucune vulnérabilité critique ou élevée. |
| Encadrement navigateur incomplet hors configuration Vercel | Politique uniforme sur les serveurs Express et les fonctions : anti-iframe, `nosniff`, referrer policy, permissions de caméra minimales, isolation d’ouverture et CSP minimale. Vercel reçoit la même protection renforcée. | Test des en-têtes ; build Vercel réussi. |
| Migration Express majeure | Les routes de stockage et les replis SPA utilisent désormais les jokers nommés d’Express 5. | La route invalide `/manus-storage/...` répond 404 et ne retombe pas sur la SPA. |

## Contrôles confirmés

Les seules procédures publiques sont la lecture de session, l’inscription, la connexion, la déconnexion et un état de santé minimal. Les opérations métier restent protégées par identité, contrôle d’appartenance de boutique ou rôle administrateur. La recherche de constructions SQL dynamiques dangereuses n’a pas trouvé de `sql.identifier()`, d’exécution dynamique ou de rendu HTML applicatif avec données utilisateur.

## Risque résiduel

L’audit de dépendances conserve une alerte **modérée** transitivement apportée par ExcelJS (`uuid` v8), concernant les écritures dans un tampon fourni aux variantes UUID v3/v5/v6. EASYSTOR n’utilise pas ce chemin d’API ; l’import et l’export continuent d’être couverts par les tests. Cette dépendance devra être mise à jour lorsque le mainteneur publiera une chaîne compatible sans alerte.

## Contrôle des en-têtes de déploiement

L’instance Express locale émet les six en-têtes applicatifs attendus. La prévisualisation gérée conserve la CSP, les permissions, la politique de référent et l’isolation d’ouverture. Le domaine géré courant conserve HTTPS/HSTS et `X-Content-Type-Options`, mais ne restitue pas l’intégralité des en-têtes applicatifs : il s’agit d’un comportement de son proxy d’hébergement, distinct du routage Vercel prévu par le projet. Le fichier `vercel.json` déclare les en-têtes complets pour le déploiement Vercel cible ; ils devront être contrôlés sur le domaine Vercel réel avant toute mise en service ou bascule DNS.
