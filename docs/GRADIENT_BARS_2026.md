# Gradient Bars — 2026

## Source et principe

Le composant de référence provient de la documentation [Mvpblocks Gradient Bars](https://blocks.mvp-subha.me/docs/backgrounds/gradient-bars). Il produit des barres verticales, chacune animée sur l’échelle verticale et l’opacité avec une phase décalée. La source recommande `motion/react`; EASYSTOR réutilise `framer-motion`, déjà présent dans le projet, pour éviter une dépendance supplémentaire.

## Adaptation EASYSTOR

| Paramètre | Valeur retenue | Rôle |
| --- | --- | --- |
| Nombre de barres | 9 | Texture structurée sans densité décorative excessive. |
| Couleurs | Vert marché discret, vert structurel transparent, transparent | Respecte le hero evergreen et laisse le lime aux CTA. |
| Durée | 5,4 secondes | Mouvement lent, secondaire par rapport au contenu. |
| Décalage | 160 ms par barre | Vague lisible sans effet d’oscillation rapide. |
| Mouvement réduit | Animation retirée | Les barres deviennent une texture statique. |

Le fond est décoratif et ne capte aucune interaction. Le fond evergreen CSS du hero reste la base visuelle en toutes circonstances.

La vérification visuelle confirme que les barres restent derrière le texte et la preuve produit à 1440 × 900 et 390 × 844. Les CTA lime, le texte crème et le menu mobile conservent une lisibilité nette.
