# Catalogue, variantes et devises

## Catalogue rapide

Le catalogue EASYSTOR accepte une photo de produit au format **PNG**, **JPEG** ou **WebP**, dans la limite de 2 Mo. L’image est enregistrée dans le stockage applicatif et seule son adresse est conservée dans la base de données. Elle n’est donc pas intégrée au dépôt de code ni aux exports de base de données.

Les produits restent utilisables sans photo. La caisse affiche une recherche par nom ou code-barres ; lorsque le produit possède des variantes actives, elle propose ces variantes à la vente à la place du produit parent.

| Élément | Stock | Prix et code-barres | Trace créée |
|---|---|---|---|
| Produit simple | Stock propre du produit | Prix et code-barres propres | Ligne de vente et mouvement `sale` sur le produit |
| Variante | Stock indépendant du produit parent | Prix, code-barres, seuil et attributs propres | Ligne de vente et mouvement `sale` avec la variante référencée |

Les attributs de variante sont libres, avec une interface conçue pour **couleur** et **taille**. Une variante peut donc représenter, par exemple, `Bleu · M`, avec un stock différent de `Noir · L`.

## Devises et taux de conversion

Chaque boutique possède une **devise de référence** définie à sa création. Les prix produits, le stock et les rapports principaux restent exprimés dans cette devise. Un propriétaire ou un manager peut activer des devises complémentaires, puis enregistrer un taux manuel daté.

> Un taux représente toujours : **1 unité de devise de transaction = X unités de devise de référence**.

| Étape | Contrôle appliqué |
|---|---|
| Activation | Seules les devises activées par la boutique peuvent être choisies dans la caisse. |
| Taux | Un taux daté doit exister avant l’encaissement dans une devise étrangère. |
| Vente | Le serveur récupère lui-même le dernier taux valide à la date de vente ; le navigateur ne peut pas imposer un taux. |
| Historique | La devise, le taux, le total transactionnel et le total de référence restent enregistrés avec la vente. |
| Clôture | Les montants de caisse restent agrégés dans la devise de référence, y compris pour une vente encaissée dans une devise étrangère. |

La solution ne consulte pas de taux externes et ne met pas à jour les cours automatiquement. Cette règle évite d’enregistrer une vente avec un cours inconnu ou différent de celui réellement utilisé par le commerçant. Les ventes hors ligne restent disponibles dans la devise de référence ; une vente étrangère exige une connexion afin de verrouiller le taux.

## Exports

L’export XLSX global comprend maintenant les onglets `Variantes`, `Devises` et `Taux de change`, en complément des produits, ventes, lignes de vente, créances, clôtures et mouvements de stock. Le fichier reste compatible avec Google Sheets.
