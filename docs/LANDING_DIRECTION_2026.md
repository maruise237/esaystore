# Direction de la landing EASYSTOR

## Intention

La landing présente **EASYSTOR comme un outil de travail pour les commerces de proximité**, et non comme un SaaS abstrait. Elle doit faire comprendre rapidement le bénéfice quotidien : encaisser sans détour, suivre le stock au fil des ventes et garder une continuité de travail quand le réseau est instable.

## Hiérarchie et contenu

La page porte une seule action dominante : **ouvrir une boutique**. La connexion reste visible, mais secondaire. Le récit s’organise selon le déroulé d’une journée de commerce : vendre, mettre le stock à jour, puis vérifier l’activité et les créances. Les preuves produit prennent la forme d’interfaces illustratives explicitement étiquetées, de reçus et d’états de synchronisation ; elles ne simulent ni témoignages, ni avis, ni chiffres clients.

| Élément | Décision retenue |
| --- | --- |
| Direction visuelle | Utilitaire premium, « marché de proximité » : evergreen profond, crème chaud, lime réservé aux confirmations et CTA. |
| Typographie | Playfair Display pour les titres éditoriaux ; DM Sans pour les actions, libellés et données opérationnelles. |
| Scanning | Une promesse lisible immédiatement, un CTA principal, puis une progression concrète de la caisse au suivi. |
| Preuve | Interfaces CSS/HTML statiques, valeurs d’exemple clairement signalées ; aucune donnée sociale fabriquée. |
| Accès | `/` est public ; `/auth?mode=register` et `/auth?mode=login` conduisent au parcours e-mail/mot de passe et OTP existant ; `/app` reste l’espace marchand. |
| Limites | Aucune offre tarifaire, aucun abonnement, aucune facturation, aucune annonce sponsorisée et aucun flux Google. |

## Critères de finition

Les contenus secondaires restent lisibles sur leurs surfaces, les actions conservent un focus visible et les mouvements sont limités à des retours d’interaction courts, désactivables selon `prefers-reduced-motion`. La composition doit rester efficace sur un téléphone : pas de navigation cachée, pas de texte tronqué et des boutons tactiles suffisamment grands.

## Note de prévisualisation locale

Lors du contrôle initial, l’aperçu géré localement a affiché une surface blanche et le journal navigateur a signalé l’absence de préambule du plugin React. Ce symptôme était déjà observé avant l’ajout de la landing et ne décrit pas la composition HTML/CSS. La version est donc contrôlée par typage, tests et build Vercel, puis devra être recontrôlée sur le domaine de production après publication.

Après désactivation du HMR local incompatible avec ce montage Express/Vite, le contrôle desktop confirme la hiérarchie attendue : marque et CTA visibles, promesse éditoriale dominante, preuve de caisse immédiatement lisible, puis alternance aérée des séquences vente, stock, synchronisation et suivi. La vérification mobile reste à effectuer avant publication.

Le contrôle mobile à 390 px confirme que le contenu passe en une colonne sans texte tronqué ni débordement horizontal observable, avec un accès menu tactile distinct. La route `/auth?mode=login` a aussi été contrôlée visuellement : elle ouvre bien le parcours e-mail/mot de passe existant, sans bouton Google.
