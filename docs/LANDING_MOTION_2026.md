# Motion de la landing — 2026

## Direction retenue

La landing ajoute une **motion de preuve**, pas des effets décoratifs continus. La preuve produit du hero entre une seule fois au chargement. Les sections migration, tarifs et travail hors connexion se révèlent lorsqu’elles atteignent le viewport, avec opacité, léger déplacement et flou court. Les animations s’exécutent une fois, ne bloquent pas les CTA et ne s’appliquent pas aux interactions fréquentes.

| Décision | Implémentation | Raison |
| --- | --- | --- |
| Registre React Bits | `@react-bits` est déclaré dans `components.json`. | Le projet peut désormais découvrir les composants du registre demandé. |
| Révélation de contenu | `client/src/components/landing/FadeContent.tsx`. | Reprend l’intention du composant Fade Content de React Bits avec Framer Motion déjà installé. |
| Entrée hero | `HeroMotion`. | Offre un seul moment d’entrée éditorial fort pour la preuve caisse/stock. |
| Mouvement réduit | Préférence navigateur lue au montage et écoutée ensuite. | Le contenu reste visible et statique lorsque le mouvement réduit est demandé. |
| Fallback technique | Absence d’`IntersectionObserver` : contenu visible sans animation. | Compatibilité avec environnements réduits et tests. |

## Composants considérés mais écartés

Les arrière-plans animés, curseurs spéciaux, glitchs, particules, cartes inclinées et effets de texte sont écartés : ils ne renforcent pas une tâche de caisse ou d’import de données et alourdiraient une surface destinée à des commerçants en activité.

## Vérifications

La landing est rendue à 1440 px et 390 px après redémarrage de l’aperçu. Les sections restent lisibles, la pile mobile ne déborde pas et les CTA restent visibles. Les tests ciblés de landing et de motion passent ; la suite complète et le build Vercel restent à exécuter avant publication.
