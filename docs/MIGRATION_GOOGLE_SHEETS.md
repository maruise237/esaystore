# Migration Google Sheets et Excel

## Objet et périmètre

EASYSTOR permet de migrer les données d’une boutique à partir d’un **fichier exporté** depuis Google Sheets ou Microsoft Excel. Les formats acceptés sont `.xlsx` et `.csv`. L’application ne demande aucun accès OAuth à Google, ne crée pas de document distant et ne synchronise pas automatiquement des données avec un tableur. Le commerçant conserve donc la maîtrise du fichier qu’il choisit d’importer.

> L’import est toujours réalisé dans la boutique active et requiert le rôle **propriétaire** ou **manager**.

| Étape | Garantie apportée |
|---|---|
| Lecture locale | Le classeur est analysé dans le navigateur avant toute écriture. |
| Prévisualisation | Les volumes détectés, les onglets ignorés et les collisions sont visibles avant confirmation. |
| Validation serveur | Les données sont revalidées côté serveur avec l’isolation de la boutique et les règles métier. |
| Application | Les écritures sont envoyées en un lot transactionnel Neon. Un échec annule le lot entier. |
| Audit | Une empreinte SHA-256 du contenu est conservée par boutique afin de refuser un réimport identique. |

## Onglets et colonnes reconnus

Les titres d’onglets peuvent être en français ou en anglais. La détection accepte notamment `Produits`, `Clients`, `Ventes`, `Lignes de vente` et `Dépenses`. Le tableau suivant donne les en-têtes conseillés pour une migration sans ambiguïté.

| Onglet | En-têtes principaux acceptés | Résultat |
|---|---|---|
| `Produits` | `Nom`, `Code-barres`, `Référence`, `Catégorie`, `Unité`, `Prix de vente`, `Prix d’achat`, `Stock`, `Seuil alerte` | Création ou traitement explicite des produits ; le stock fournit est enregistré comme mouvement d’ouverture. |
| `Clients` | `Nom`, `Téléphone`, `Note` | Création ou traitement explicite des clients. |
| `Ventes` | `Référence`, `Date`, `Client`, `Total`, `Espèces`, `Mobile money`, `Remise`, `Échéance` | Création d’une vente historique à sa date source ; un solde non encaissé ouvre une créance si un client est résolu. |
| `Lignes de vente` | `Référence vente`, `Produit`, `Code-barres`, `Quantité`, `Prix unitaire`, `Prix d’achat` | Conservation du détail des articles dans chaque vente. Les lignes doivent référencer une vente et un produit présents dans le fichier ou dans la boutique. |
| `Dépenses` | `Date`, `Catégorie`, `Montant`, `Note` | Création d’une dépense historique à sa date source. |

Les dates Excel sérialisées, ISO (`2026-08-24`) et françaises (`24/08/2026`) sont converties en dates UTC. Les dates sont conservées pour les ventes, dépenses et échéances. Les lignes sans date obligatoire, montant positif ou référence nécessaire sont écartées de l’aperçu plutôt que devinées.

## Collisions et choix disponibles

EASYSTOR détecte les noms et codes-barres de produits, les noms et téléphones de clients, les références de ventes, les journées clôturées et le contenu déjà importé. **Aucune valeur n’est écrasée silencieusement.**

| Choix | Produits et clients en collision | Ventes en collision | Journée clôturée ou fichier identique |
|---|---|---|---|
| Bloquer | L’import est refusé tant qu’une collision existe. | L’import est refusé. | L’import est refusé ou signalé comme déjà traité. |
| Ignorer | La ligne concernée est sautée. | La vente est sautée. | L’import est refusé afin de préserver le rapport de caisse. |
| Mettre à jour | Prix, seuils, catégorie, unité ou coordonnées sont actualisés sans modifier le stock existant. | La vente est sautée ; si elle contient des lignes détaillées sur un produit existant, choisissez plutôt une copie. | L’import est refusé. |
| Créer une copie | Une nouvelle entrée est créée avec le suffixe `import <id>` ; le code-barres ou téléphone en conflit n’est pas recopié. | La vente est sautée. | L’import est refusé. |

Une vente ou dépense historique visant une date déjà présente dans `cash_closures` est bloquée avant toute écriture. Cette protection évite de changer le cash attendu et le snapshot d’une journée déjà clôturée.

## Politique de stock historique

Le champ `Stock` du produit est traité comme le **stock final actuel** figurant dans le fichier. Lorsqu’un onglet `Lignes de vente` est présent, EASYSTOR reconstitue un mouvement d’ouverture égal au stock final augmenté des quantités vendues, puis crée les mouvements `sale` historiques dans l’ordre des dates de vente. Le dernier mouvement retrouve ainsi exactement le stock final fourni, sans modifier le stock actuel de la boutique.

Chaque ligne détaillée doit correspondre à un produit présent dans l’onglet `Produits` et à une référence existante de l’onglet `Ventes`. Cette contrainte évite de deviner le stock d’ouverture d’un produit déjà enregistré ou absent du fichier. Si un stock n’est pas fiable, corrigez-le après import avec un ajustement de stock motivé dans l’application.

## Export global

Le bouton **Exporter le classeur** génère un seul fichier `.xlsx`, compatible avec l’import de Google Sheets, comprenant les onglets suivants : `Guide`, `Produits`, `Variantes`, `Clients`, `Ventes`, `Lignes de vente`, `Dépenses`, `Créances`, `Remboursements`, `Clôtures`, `Mouvements stock`, `Devises` et `Taux de change`.

Le fichier sert de sauvegarde et de transfert. Pour l’ouvrir dans Google Sheets, utilisez **Fichier → Importer → Importer** puis sélectionnez le classeur téléchargé. L’export ne remplace ni ne met à jour automatiquement un document Google existant.

## Limites opérationnelles

L’interface accepte un fichier de **12 Mo maximum**. La validation serveur limite chaque catégorie principale à 1 000 lignes et les lignes de vente à 5 000 lignes afin de maintenir une expérience fluide sur mobile et l’exécution serverless. Les grandes archives doivent être séparées en fichiers plus petits, par période si nécessaire.

## Références

[1] [SheetJS — documentation XLSX](https://docs.sheetjs.com/)
