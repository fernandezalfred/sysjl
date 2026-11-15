# Current Feature: Multi-Company Roles and Unlimited Sellers

## Status

In Progress

## Goals

- **Companies (branches)**: a new `Company` model; every seller, admin, sale record, product price and grain purchase belongs to exactly one company
- **Roles**:
  - `SUPER_ADMIN`: exactly one account in the whole app; sees every company, creates/edits/deactivates companies, creates each company's admins and grants their permissions
  - `ADMIN`: sees and manages everything in their own company only (sale records, finance, users, grains, prices); never another company's data
  - `VEHICLE_USER` (seller): unchanged, scoped to their company and their own records
- **Admin permissions** set by the super admin per admin (e.g. Ingresos y egresos, Gestionar usuarios, Granos, Precios y costos); pages, sidebar entries and Server Actions respect them
- **Company scoping enforced on the server**: the company always comes from the session (never from the browser); every query and Server Action filters by it; `src/proxy.ts` and the guards learn the new roles
- **Super admin view**: list of companies with their headline figures, and a company switcher to open any company's panel, finance and grains as that company's admin would see them
- **Unlimited sellers**: no fixed cap anywhere, and the UI stays usable with many sellers:
  - charts don't run out of distinguishable colors (today `UserTrendChart` repeats 8 colors) and stay readable with many lines/bars
  - user lists, seller dropdowns, "Por pagar" dropdown and per-seller finance tables scroll or paginate
- **Existing data migrates** into a first company (the current business), so nothing is lost; the current admin keeps working
- Tests for the guards, company scoping in every Server Action and data loader, and the migration helper; translations in es/en; docs (CLAUDE.md, project-overview) updated, including §3 Roles and §8 Not Built

## Notes

- `project-overview.md` §8 lists "Multiple companies / branches and the sub-administrator role" as not built; the landing page already describes platform admin → one admin per company → its sellers
- Schema changes need `npx prisma db push`; new fields optional or defaulted so existing documents still read, then a one-off script fills `companyId` on existing documents
- Decisions (at `start`): permissions per module (FINANCE, USERS, GRAINS, PRICES; Sale Records always); the current admin is promoted to super admin by the migration script (oldest admin, or `--super email`); the super admin has full access inside the company it opens; the first company's name is passed with `--company` (default "Empresa principal")
- Claims (role, company, permissions) are re-read from the database in the JWT callback on every session check, so permission changes and deactivations apply on the next request
- Only the super admin creates/edits admins and grants permissions; a company admin with USERS manages sellers only
- Large change (schema, auth, every query): implement in steps on one branch, scoping first, UI after
