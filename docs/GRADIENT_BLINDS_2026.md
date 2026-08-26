# Fond Gradient Blinds — 2026

## Adaptation EASYSTOR

Le fond fourni est intégré uniquement dans le hero. Les couleurs sont adaptées à l’identité existante : evergreen profond `#1e2924`, vert structurel `#263a30`, vert marché `#36513a` et signal discret `#6f954e`. Le lime reste réservé à l’action principale et aux signaux opérationnels ; il n’est pas utilisé comme fond mouvant dominant.

| Paramètre | Valeur EASYSTOR | Raison |
| --- | --- | --- |
| Bandes | 10, largeur minimale 108 px | Donne une texture de profondeur sans produire une grille dense. |
| Transparence du fond | 55 % | Conserve le contraste du titre crème et du texte secondaire. |
| Réflexion souris | Rayon 0,70 ; opacité 0,16 | Réaction lente et discrète, sans détourner l’attention des CTA. |
| DPR maximal | 1,5 | Limite le coût GPU sur écrans à forte densité. |
| Déformation | 0,045 | Évite les effets de vague perceptibles dans une surface métier. |

## Accessibilité et fallback

Le hero conserve son fond evergreen CSS statique. Le canvas WebGL ne se monte que lorsque WebGL est disponible et que la préférence `prefers-reduced-motion` n’est pas activée. Il est décoratif, ignoré par les lecteurs d’écran, ne capte pas les interactions et est entièrement nettoyé au démontage.

## Vérification

Le hero est contrôlé après rechargement des dépendances à 1440 × 900 et 390 × 844. La zone de texte, les CTA et l’aperçu produit restent lisibles. Le premier rendu blanc observé correspondait à l’optimisation Vite après ajout d’OGL ; une seconde capture, après optimisation, confirme le fond WebGL actif et stable.

Le déploiement Vercel associé au commit GitHub est terminé avec succès. L’inspection DOM publique confirme la landing montée, un conteneur Gradient Blinds, un canvas WebGL actif et le CTA d’ouverture de boutique. La capture blanche du navigateur reste un artefact connu de cet environnement de contrôle, distinct du rendu DOM réellement chargé.
