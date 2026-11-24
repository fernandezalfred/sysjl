# Current Feature

PWA launch progress bar

## Status

In Progress

## Goals

- When the installed app (standalone) opens, show a progress bar instead of a logo until the panel has loaded
- Not shown in a normal browser tab, nor on client navigations inside the app

## Notes

- `LaunchProgress` (client) in `src/app/(panel)/layout.tsx`, outside the Suspense so it's in the static shell; hides on `document.readyState === "complete"`; CSS 20s timeout if it never hydrates
- The OS splash (Android: manifest icon + background color) can't be replaced by a web app
