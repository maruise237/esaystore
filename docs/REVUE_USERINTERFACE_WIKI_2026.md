# Revue User Interface Wiki — 25 août 2026

## Mode et périmètre

**Mode : quick.** La revue porte sur le parcours public d’ouverture de boutique et l’accès administrateur, avec un contrôle des composants qui conditionnent l’espace marchand connecté. L’interface est construite en **React + Tailwind**, avec les primitives locales `Button`, `Input` et `AppShell`.

Les rendus ont été contrôlés à **1280 × 800 px** et **390 × 844 px**. Les interactions authentifiées, hover et focus visuels dans un navigateur connecté restent **Not verified** ; leurs états structurels sont néanmoins couverts par les tests existants.

## Constats et corrections

| Sévérité | Localisation | Avant | Après | Pourquoi |
| --- | --- | --- | --- | --- |
| MEDIUM | `client/src/components/AppShell.tsx:183` | Ombre active noire générique. | Ombre verdie `rgba(15,28,21,0.22)`. | L’élévation s’intègre à la direction lumineuse de la navigation au lieu de produire un contour artificiel. |
| MEDIUM | `client/src/components/ui/button.tsx:8` | Transition générique et retour pressé non explicite. | Transition ciblée à 150 ms, pressé réversible à 0,96 et préférence de mouvement réduit. | Le feedback reste rapide et prévisible sans animer des propriétés inutiles. |
| MEDIUM | `client/src/components/ui/input.tsx:57` | Focus sans transition de bordure et caret navigateur par défaut. | Bordure, couleur et ombre explicitement transitives ; caret primaire. | La saisie paraît plus stable et rattachée au système visuel. |
| LOW | `client/src/components/AppShell.tsx:180,259,274` | Transitions générales ou implicites de navigation. | Propriétés de couleur, fond et ombre limitées, avec 150 ms et reduced motion. | Les états fréquents restent sobres et cohérents sur desktop/mobile. |
| LOW | `client/src/index.css:121` | Chiffres proportionnels par défaut. | Chiffres tabulaires sur le corps de l’application. | Les montants, compteurs et tableaux restent visuellement stables. |

## Candidats rejetés

| Candidat | Décision | Justification |
| --- | --- | --- |
| Animation d’entrée de menu ou de formulaire | Rejeté. | Les interactions principales sont répétées ; aucun besoin de motion additionnelle n’a été confirmé. |
| Préchargement de toutes les destinations | Rejeté. | Le préchargement doit suivre une intention observable et nécessiterait des mesures de latence distinctes. |
| Refonte des cartes métier | Rejeté. | Aucune surface inspectée ne présentait un défaut confirmé qui justifie une modification large de la primitive. |

## Vérification et verdict

La prévisualisation desktop et mobile ne présente pas de débordement ou de rupture de hiérarchie sur les routes contrôlées. La suite complète réussit avec **39 fichiers et 84 tests**, ainsi que le typage et le build Vercel. Le build signale toujours un bundle principal volumineux ; ce sujet reste indépendant de la revue visuelle.

**Verdict : Approve.** Aucun constat HIGH ou MEDIUM actionnable n’est ouvert dans le périmètre contrôlé.

## Référence

La revue s’appuie sur les règles User Interface Wiki concernant les cibles, les transitions, les chiffres tabulaires et les ombres.[1]

[1]: https://github.com/raphaelsalaja/userinterface-wiki "User Interface Wiki"
