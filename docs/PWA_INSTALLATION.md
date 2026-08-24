# Installation mobile d’EASYSTOR

EASYSTOR est fournie comme PWA installable. Sur **Chrome Android**, le navigateur expose l’événement `beforeinstallprompt` lorsque le manifeste, les icônes PNG, le contexte HTTPS et le service worker sont valides. L’application affiche alors le bouton **Installer l’application**, qui déclenche l’invite native du navigateur.

Sur **Safari iOS/iPadOS**, le navigateur ne fournit pas cet événement. L’application affiche donc l’instruction alternative : ouvrez **Partager**, puis choisissez **Sur l’écran d’accueil**. L’invitation disparaît automatiquement lorsqu’EASYSTOR est déjà exécutée en mode autonome ou après une installation confirmée.

| Élément | Vérification |
|---|---|
| Manifeste | `/manifest.webmanifest` répond avec un statut HTTP 200 et contient `display: standalone`, une portée et des icônes PNG 192/512. |
| Service worker | `/sw.js` est chargé uniquement en production afin de préserver la PWA sans gêner l’aperçu de développement. |
| Android | Ouvrez le site en HTTPS, attendez le bouton d’installation, puis acceptez la boîte de dialogue native. |
| iOS | Utilisez Safari, touchez Partager, puis « Sur l’écran d’accueil ». |

Les tests unitaires du module `client/src/lib/pwa.test.ts` couvrent l’invite native Android, le parcours iOS et les états déjà installés ou masqués.
