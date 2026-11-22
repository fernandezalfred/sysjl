# Current Feature: PWA

## Status

In Progress

## Goals

- The whole app installs as a PWA (Android, iOS "Add to Home Screen", desktop): `src/app/manifest.ts` (SysJL, standalone, start at `/dashboard`), icons from the "JL" brand mark (192, 512, maskable 512, Apple touch 180)
- Service worker `public/sw.js`, registered in production only: cache-first for hashed `/_next/static/*` and the icons; pages and data always from the network (signed-in, per-company data is never cached); with no connection a page navigation shows a static offline page (`public/offline.html`, es/en)
- `sw.js` served with no-cache headers; the PWA files are public (left out of `src/proxy.ts`)
- Theme color and Apple web app metadata in the root layout

## Notes

- No extra dependency (follows the Next.js PWA guide)
- No offline data entry: Server Actions need the network
