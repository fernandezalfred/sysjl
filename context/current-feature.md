# Current Feature

Public landing page, sign in goes to the dashboard

## Status

In Progress

## Goals

- Signing in goes straight to `/dashboard`; a signed-in user opening `/login`, or a non-admin opening `/admin/*`, also lands there.
- `/` is a public, professional, mobile-first landing page that sells the product to the dairy distribution companies that would rent it (multi-branch: a platform admin, a sub-admin per company, its sellers). Hero with a drawn panel preview (made-up figures, labeled "Ejemplo"), features, roles, how it works, and a sign-in / "Ir al panel" call to action.
- No real company data on the page (a first version with the last 3 days' ranking was replaced at the user's request).
- Landing only: multi-company and the sub-admin role aren't built yet.
- The old home (top seller banner, admin quick links, charts, Totals by User with create/edit) is removed along with its now-unused components and keys; recording sales is on `/dashboard`.

## Notes

- Sections in `src/components/landing/`; no contact channel yet (no number/email given), so the call to action is sign in.
