# SysJL

Daily sales, vehicle inventory, and revenue tracker for a small distribution business selling **Queso** (cheese), **Yogurt**, **Milk**, and **Mote**, plus raw grain inputs purchased into a central deposit.

A vehicle user takes products from the deposit each day, sells them, and reports what's left. Admins manage users, product pricing, and deposit stock purchases, and see business-wide revenue and inventory.

## Tech Stack

- **Next.js 16** (App Router, Turbopack, Partial Prerendering) + **React 19** + **TypeScript**
- **Prisma 6** on **MongoDB** (requires a replica set — see [Database](#database))
- **Auth.js v5** (Credentials provider, JWT sessions, bcrypt password hashing)
- **Tailwind CSS v4** (CSS-based `@theme` config — no `tailwind.config.ts`)
- **Zod** for input validation, **Vitest** for unit tests

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

- `DATABASE_URL` — a MongoDB connection string. Prisma's MongoDB connector requires a **replica set**; a standalone `mongod` will fail with "Transactions are not supported." A free-tier MongoDB Atlas cluster works out of the box.
- `AUTH_SECRET` — random secret for encrypting session JWTs. Generate one with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```

### 3. Set up the database

This project uses `prisma db push` rather than `prisma migrate` (there is no `prisma/migrations` folder — MongoDB's Prisma connector doesn't support migrations the same way SQL databases do):

```bash
npx prisma generate
npx prisma db push
```

Then seed one admin and one vehicle user:

```bash
npx prisma db seed
```

This creates:

| Role         | Email                | Password      |
| ------------ | --------------------- | -------------- |
| Admin        | `admin@sysjl.local`   | `ChangeMe123!` |
| Vehicle user | `carla@sysjl.local`   | `ChangeMe123!` |

The seed is idempotent — re-running it won't duplicate users or overwrite an admin-set product price.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command               | Description                                  |
| ---------------------- | --------------------------------------------- |
| `npm run dev`          | Start the dev server (Turbopack)              |
| `npm run build`        | Production build                              |
| `npm start`            | Run the production build                      |
| `npm run lint`         | ESLint                                        |
| `npm test`             | Run the Vitest suite once                     |
| `npm run test:watch`   | Run Vitest in watch mode                      |

## Roles & Access

- **Admin** — manages user accounts, product sale prices, central-deposit stock purchases, and sees business-wide revenue, inventory, and sale records across all users.
- **Vehicle user** — records their own daily sales (quantities taken from the deposit and left over at day's end) and views their own history. The acting user is always resolved from the server-side session, never trusted from the client.

Route access is enforced centrally in `src/proxy.ts`: every route requires sign-in except `/` and `/login`, and everything under `/admin/*` additionally requires the admin role.

## Project Structure

```
src/
  app/                    # Next.js App Router pages
    (panel)/              # Signed-in shell: sidebar, breadcrumbs, quick stats
      dashboard/          # Summary cards, sale records, admin-only sale pricing
      admin/
        users/            # Admin: user CRUD
        cheese/           # Admin: cheese stock purchases
        yogurt/           # Admin: yogurt stock purchases
        milk/             # Admin: milk stock purchases
        grains/           # Admin: grain stock purchases (item picked per purchase)
    page.tsx              # Public home page (totals by user, no login required)
    login/
  actions/                # Server Actions (one file per feature), return { success, error }
  components/
    admin/                # users/, stock-purchases/, grain-purchases/, product-pricing/
    landing/              # Public home + dashboard sections
    layout/               # PanelShell, Footer, etc.
    records/              # Sale record create/edit forms
  lib/                    # Business logic, Prisma client, i18n, pricing helpers
  types/                  # Shared TypeScript types
prisma/
  schema.prisma           # Data model (see below)
  seed.ts                 # Idempotent seed script
context/                  # Project spec, coding standards, and feature-workflow docs
  current-feature.md      # Active feature tracker (see context/ai-interaction.md)
```

## Data Model

- **User** — admin or vehicle-user role, active/inactive.
- **DailyWorkRecord** — one per user per day: Queso/Yogurt quantities taken and left over, snapshotted sale prices (so a later price change never rewrites past revenue), and a user-entered total-sold figure covering all four products.
- **ProductPrice** — current sale price per product (Queso/Yogurt only); one row per product, updated in place.
- **StockPurchase** — a batch of product purchased into the central deposit (quantity + unit cost), covering Queso, Yogurt, Milk, and three grain items (Maíz Pelado, Maíz con Cáscara, Haba). Current deposit stock for Queso/Yogurt is *derived* — total purchased minus taken-minus-remaining across `DailyWorkRecord` — not a separately maintained counter.

## Internationalization

The app is fully bilingual (English/Spanish) via a cookie-backed locale switcher; see `src/lib/i18n/`.

## Testing

Vitest covers Server Actions (`src/actions/`) and business logic (`src/lib/`) only — React components are verified in the browser, not unit-tested (see `context/coding-standards.md`). Run `npm test` before committing.
