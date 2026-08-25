# Revue de design produit — 25 août 2026

## Méthode retenue

La revue s’appuie sur la compétence **Heuristic Evaluation** de Designer Skills, adaptée lorsqu’une interface existante doit être évaluée sans recruter de participants. Le périmètre couvre le parcours d’accès à la console de plateforme pour un administrateur non connecté, complété par une vérification de l’onboarding marchand. La décision est fondée sur l’heuristique de visibilité du statut, de contrôle utilisateur et de récupération après un refus d’accès.[1]

## Constat prioritaire et correction

| Gravité | Heuristique | Preuve | Avant | Correction livrée |
| --- | --- | --- | --- | --- |
| 3 — majeure | Contrôle et liberté utilisateur ; récupération après erreur | `client/src/pages/PlatformAdminPage.tsx:85-97` | La route restreinte demande à l’administrateur de se connecter, mais ne lui propose qu’un retour général à EASYSTOR. | Ajout d’une action primaire **Se connecter** qui rejoint directement `/?mode=login`, avec une action secondaire de retour. |
| 2 — mineure | Efficacité et flexibilité | `client/src/pages/AuthPage.tsx:9-13` | L’écran d’authentification ouvrait systématiquement la création de compte. | L’intention `mode=login` sélectionne le bon onglet dès l’arrivée. |

## Décision de design

La route privée continue de ne pas exposer la console ni ses données à un marchand. Elle explique le statut de protection, propose l’issue la plus probable pour l’administrateur et conserve une sortie sûre vers l’espace EASYSTOR. Les deux actions sont placées ensemble, avec la connexion comme choix primaire ; l’utilisateur ne doit plus mémoriser qu’il doit d’abord revenir à l’écran d’accueil avant de se connecter.

## États, preuves et limites

| Contrôle | Résultat |
| --- | --- |
| Compte marchand sur `/platform-admin` | Carte restreinte, message explicite et deux actions contrôlés en tests. |
| Intention `/?mode=login` | Onglet de connexion actif et CTA de connexion contrôlés en tests. |
| Rendu desktop | Carte et actions vérifiées à 1280 × 800 px. |
| Rendu mobile | Carte, hiérarchie et boutons vérifiés à 390 × 844 px. |
| Compte administrateur authentifié | Not verified dans cette revue ; la protection serveur et les tests existants restent inchangés. |

La validation automatisée réussit avec **39 fichiers et 85 tests**, ainsi que le typage TypeScript et le build Vercel. Le build continue de signaler un bundle principal volumineux, sans lien direct avec ce correctif de parcours.

## Verdict

**Approuvé.** Aucun problème heuristique de gravité 3 ou 4 ne reste ouvert sur le périmètre contrôlé. Une session courte avec de vrais opérateurs administrateurs est recommandée avant de conclure sur la compréhension en conditions réelles.

## Référence

[1]: https://github.com/Owl-Listener/designer-skills "Designer Skills — Heuristic Evaluation"
