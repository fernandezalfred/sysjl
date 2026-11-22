# Current Feature: Install App Button

## Status

In Progress

## Goals

- "Instalar app" button at the bottom of the panel sidebar (also in the phone drawer), above the language switcher
- Chrome / Edge / Android: opens the browser's install prompt (`beforeinstallprompt`, caught when the page loads)
- iPhone / iPad: a popup with the Safari steps (Compartir → "Agregar a pantalla de inicio")
- Hidden once the app runs installed, and where it can't be installed (e.g. Firefox desktop)

## Notes

- `src/lib/pwa/install-prompt.ts` (listener added at module load, imported by `ServiceWorkerRegister`; pure `installMode` unit tested), `useInstallMode` (`useSyncExternalStore`, hidden on the server), `InstallAppButton`, `infoAlert`
- The browser only offers the prompt in production (needs the service worker), so on Chrome the button doesn't show with `npm run dev`
