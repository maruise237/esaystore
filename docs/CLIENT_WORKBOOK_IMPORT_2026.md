# Compatibilité du classeur de gestion boutique

## Cause observée

Le fichier `gestion_boutique_simple.xlsx` est un classeur de gestion complet, pas un export plat : il comporte seize onglets, trois lignes de préambule avant les en-têtes, des identifiants relationnels (`SKU`, `ID client`, `ID vente`) et des formules Excel dont les résultats ne sont pas enregistrés dans le fichier.

L’ancien import lisait uniquement la première ligne comme en-tête et dépendait des valeurs mises en cache par Excel. Il ignorait donc les tables utiles ou obtenait des totaux et libellés vides.

## Compatibilité ajoutée

| Élément reconnu | Lecture appliquée |
| --- | --- |
| Préambule de feuille | Recherche de la première vraie ligne d’en-têtes dans les 32 premières lignes. |
| Produits | Lecture des alias TTC/HT, des SKU, des catégories, du stock minimum et du stock final reconstitué avec les mouvements signés. |
| Clients | Association `ID client` → nom pour rattacher les ventes importées. |
| Ventes et lignes | Reconstitution des totaux depuis les lignes de vente lorsque les formules ne disposent pas de résultat mis en cache ; association via `ID vente` et `SKU`. |
| Paiements | Les ventes payées par carte, virement ou espèces sont considérées comme encaissées ; Mobile Money reste identifié séparément. |
| Dépenses | Lecture du montant HT lorsqu’un total TTC est uniquement calculé par formule. |

## Validation du fichier fourni

Le parseur détecte désormais **12 produits**, **10 clients**, **38 ventes non annulées**, **76 lignes de vente** et **24 dépenses**. Les neuf autres onglets de synthèse, paramètres, fournisseurs, achats, trésorerie, objectifs et rapport restent explicitement non importés car ils ne correspondent pas encore à une entité EASYSTOR importable.
