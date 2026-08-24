# Installation autonome d’EASYSTOR

EASYSTOR est fournie comme PWA installable. Une fois installée depuis un site HTTPS, elle démarre en mode **standalone**, sans la barre d’adresse du navigateur. Le manifeste définit ce mode, les icônes PNG et la portée de l’application ; le service worker met à disposition le shell de l’application et le fonctionnement hors connexion. Sur **Chrome Android**, le navigateur expose l’événement `beforeinstallprompt` lorsque ces critères sont valides. L’application affiche alors le bouton **Installer l’application**, qui déclenche l’invite native du navigateur.

Sur **Safari iOS/iPadOS**, le navigateur ne fournit pas cet événement. L’application affiche donc l’instruction alternative : ouvrez **Partager**, puis choisissez **Sur l’écran d’accueil**. Ouvrez ensuite l’icône EASYSTOR depuis l’écran d’accueil pour utiliser le mode autonome. L’invitation disparaît automatiquement lorsqu’EASYSTOR est déjà exécutée en mode autonome ou après une installation confirmée.

| Élément | Vérification |
|---|---|
| Manifeste | `/manifest.webmanifest` répond avec un statut HTTP 200 et contient `display: standalone`, une portée et des icônes PNG 192/512. |
| Service worker | `/sw.js` est chargé uniquement en production afin de préserver la PWA sans gêner l’aperçu de développement. |
| Android | Ouvrez le site en HTTPS, attendez le bouton d’installation, puis acceptez la boîte de dialogue native. |
| iOS | Utilisez Safari, touchez Partager, puis « Sur l’écran d’accueil ». |

Les tests unitaires du module `client/src/lib/pwa.test.ts` couvrent l’invite native Android, le parcours iOS et les états déjà installés ou masqués.

## Validation finale sur HTTPS

1. Déployez la version sur une URL HTTPS, puis ouvrez `/manifest.webmanifest` et `/sw.js` : les deux ressources doivent répondre avec un statut HTTP 200.
2. Sur Android Chrome, utilisez **Installer l’application**, fermez le navigateur, puis lancez EASYSTOR depuis l’icône ajoutée au lanceur. L’application doit occuper sa propre fenêtre, sans barre d’adresse.
3. Sur iPhone/iPad, utilisez Safari, choisissez **Partager** puis **Sur l’écran d’accueil**, et ouvrez l’icône créée. L’indication **Mode application actif** confirme l’exécution autonome.
