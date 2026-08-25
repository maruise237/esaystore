# Accessibilité et lisibilité EASYSTOR

EASYSTOR utilise **WCAG 2.2 niveau AA** comme niveau de conformité fonctionnelle visé. Les critères AAA sont appliqués de manière pragmatique lorsque cela améliore la lisibilité d’une caisse sans dégrader la vitesse d’utilisation.

| Sujet | Règle appliquée | Référence officielle |
|---|---|---|
| Texte normal | Contraste minimal de **4,5:1** ; les textes importants visent un contraste supérieur lorsque la palette le permet. | [1] |
| Texte renforcé | Un contraste de **7:1** est recherché pour les textes secondaires sur fond clair lorsque cela ne compromet pas la hiérarchie visuelle. | [1] |
| Focus clavier | Chaque contrôle navigable possède un indicateur visible. Les renforcements visent au moins **3:1** de différence de contraste pour l’indicateur. | [2] |
| Cibles tactiles | Les boutons et contrôles denses visent au minimum **24 × 24 px CSS** ; les actions essentielles de caisse visent **44 × 44 px** lorsque l’espace le permet. | [3] |
| Navigation | Les contrôles à icône disposent d’un nom accessible et d’une infobulle ; le menu compact reste exploitable au clavier. | [2] |

Les contrastes sont mesurés sur les couleurs effectivement affichées, y compris les états de focus et de sélection. Les ratios AAA sont un renforcement volontaire et non une affirmation de conformité AAA globale.

## Résultat de l’audit initial

L’audit a relevé trois nuances secondaires sous le seuil AA sur leurs fonds utilisés : `#85877f` sur blanc (**3,64:1**), `#697868` sur vert clair (**4,08:1**) et `#77846f` sur fond variante (**3,78:1**). Elles ont été respectivement remplacées par `#5f665d` (**5,92:1**), `#4d5f4b` (**5,99:1**) et `#52634d` (**6,19:1**). Deux autres nuances de tableau sous le seuil ont été alignées sur la nuance lisible `#5f665d`.

Les textes de navigation sombre (`#cdd6cc` sur `#1e2924`) et l’action principale (`#415b3c` sur blanc) dépassent déjà **7:1** ; ils constituent des renforcements AAA localisés.

## Vérifications automatisées

| Surface contrôlée | Vérification |
|---|---|
| Navigation et barre compacte | Audit axe sans violation structurelle, nom des repères, ouverture clavier et intitulés des icônes. |
| Caisse | Audit axe de la recherche produit et du déclencheur de scanner, avec libellé explicite. |
| Catalogue | Audit axe de la recherche catalogue et des détails progressifs. |
| Migration | Audit axe de la sélection de fichier et des retours d’import. |
| Clôture | Audit axe du montant compté, de son libellé et des annonces de résultat. |
| Crédits | Audit axe d’une créance ouverte : le montant à encaisser est associé au nom du client. |
| Devises | Audit axe du sélecteur d’activation de devise et de son libellé visible. |

L’audit axe structurel ne calcule pas les contrastes dans l’environnement de test sans rendu graphique complet. Les ratios de contraste consignés ci-dessus ont donc été mesurés séparément sur les couleurs et fonds effectivement utilisés.

## Audit complémentaire des écrans métier

Une revue structurelle a couvert les écrans métier qui ne faisaient pas partie du premier lot de tests axe. Elle vérifie les noms accessibles, les champs de formulaire, les retours dynamiques et les actions compactes. Cette revue, combinée aux styles globaux de focus et de taille de cible, ne remplace pas une certification indépendante : elle documente le périmètre réellement contrôlé avant la livraison.

| Écran | Résultat de l’audit | Ajustement appliqué |
|---|---|---|
| Tableau de bord et rapports | Les actions de navigation, la recherche POS et les contenus de rapport restent dans les repères nommés de l’application. | Les styles globaux conservent un focus visible et les contrôles de recherche ont déjà un libellé explicite. |
| Stock | Les sélecteurs, la quantité et le motif sont portés par des libellés visibles. | Les erreurs d’enregistrement sont désormais annoncées avec `role="alert"`. |
| Crédits | Les filtres sont libellés ; le champ de remboursement était le seul contrôle dépendant d’un placeholder. | Ajout d’un libellé invisible mais explicite, contextualisé avec le nom du client, et test axe associé. |
| Ventes | Les deux filtres de période disposent chacun d’un libellé visible (« Du » et « Au »). | Aucune correction supplémentaire nécessaire après revue. |
| Dépenses | Catégorie, montant, note et période sont associés à des libellés visibles. | Les erreurs d’enregistrement sont désormais annoncées avec `role="alert"`. |
| Devises | Le formulaire de taux était déjà libellé ; le sélecteur d’activation utilisait un libellé non lié. | Association `htmlFor`/`id`, annonce de confirmation avec `role="status"` et test axe associé. |
| Équipe | L’e-mail et le rôle sont libellés par le formulaire. | Les erreurs d’ajout de collaborateur sont désormais annoncées avec `role="alert"`. |
| Synchronisation | Les actions textuelles sont explicites ; l’action d’abandon est volontairement compacte. | Ajout d’un nom accessible à l’action iconographique, d’un libellé d’état pendant la synchronisation et d’alertes pour les erreurs de file. |

Les contrôles ont été vérifiés à la fois pour leur nom accessible et pour leur comportement mobile : les boutons et contrôles denses héritent du minimum global de 24 px CSS, tandis que les actions de formulaire occupent généralement toute la largeur disponible sur petit écran. Les exceptions de liens intégrés au texte restent conformes à la règle de taille de cible applicable aux contenus en ligne. [3]

## Références

[1]: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html "W3C — Understanding Success Criterion 1.4.3: Contrast (Minimum)"
[2]: https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html "W3C — Understanding Success Criterion 2.4.13: Focus Appearance"
[3]: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html "W3C — Understanding Success Criterion 2.5.8: Target Size (Minimum)"
