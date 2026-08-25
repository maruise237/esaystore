# Passe de précision d’interface — 25 août 2026

## Périmètre

La passe rapide a ciblé les primitives partagées et la navigation qui déterminent la sensation globale : `Button`, `Input` et `AppShell`. Le projet reste en React, Tailwind et composants existants ; aucune dépendance, route ou logique métier n’a été ajoutée.

## Ajustements appliqués

| Catégorie | Emplacement | Avant | Après |
| --- | --- | --- |
| Transitions | `client/src/components/ui/button.tsx` | Transition générique et comportement pressé non explicite. | Transition ciblée de couleur, bordure, ombre et transformation ; retour pressé à 0,96 ; mouvement réduit respecté. |
| Champ de saisie | `client/src/components/ui/input.tsx` | La bordure ne participait pas à la transition de focus. | Transition explicite de bordure, couleur et ombre ; caret attaché à la couleur primaire ; mouvement réduit respecté. |
| Navigation desktop | `client/src/components/AppShell.tsx` | `transition-all` sur les entrées de barre latérale. | Transition limitée aux propriétés visuelles utiles, en 150 ms. |
| Navigation mobile | `client/src/components/AppShell.tsx` | Transition de couleur implicite. | Transition déclarée de fond et de texte, cohérente avec les états actif/inactif. |

## Candidats rejetés

| Candidat | Décision | Motif |
| --- | --- | --- |
| Animation d’entrée sur chaque panneau | Rejeté. | Les écrans opérationnels sont fréquents ; une animation répétée ralentirait la tâche. |
| Refonte de la primitive `Card` | Rejeté. | L’audit signalait une densité à vérifier, pas un défaut confirmé ; modifier cette primitive aurait dépassé une passe de précision. |
| Nouvelle bibliothèque de motion | Rejeté. | Les transitions CSS existantes satisfont le besoin sans coût de bundle. |

## Vérification

Les surfaces d’authentification et d’accès administrateur ont été visualisées à 390 × 844 px. Les tests de composants et les parcours ciblés ont été joués, puis la suite complète a validé **39 fichiers et 84 tests**. Le typage TypeScript et le build Vercel réussissent. Le build continue de signaler un bundle principal volumineux : ce point n’est pas bloquant pour cette passe, mais reste une amélioration de performance à traiter séparément.

## Verdict

**Approve.** Aucun constat HIGH ou MEDIUM actionnable n’est ouvert sur le périmètre de précision traité.

## Référence

La méthode suit le guide Make Interfaces Feel Better pour les transitions ciblées, le feedback pressé, les états et les surfaces.[1]

[1]: https://github.com/jakubkrehel/make-interfaces-feel-better "Make Interfaces Feel Better"
