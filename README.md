# SysJL

Daily sales and net profit tracker for a small distribution business in Bolivia selling **Queso** (cheese), **Yogurt**, **Milk**, and **Mote**.

Each seller takes Queso and Yogurt from the deposit, sells them with Milk and Mote, and records what was left over and their total sales. The app works out sales, unsold value, the daily winner and each seller's pay; admins also see net profit after Milk and grain costs. The full description of rules and calculations is in [`context/project-overview.md`](context/project-overview.md).

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

Then seed one admin and one seller:

```bash
npx prisma db seed
```

This creates:

| Role         | Email                | Password      |
| ------------ | --------------------- | -------------- |
| Admin        | `admin@sysjl.local`   | `ChangeMe123!` |
| Seller       | `carla@sysjl.local`   | `ChangeMe123!` |

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

- **Admin** — manages users, Queso/Yogurt sale prices and purchase costs, Milk and grain purchases; sees and edits every sale record, costs and net profit.
- **Seller** (`VEHICLE_USER`) — records and edits their own daily sale records and sees their own pay. The acting user always comes from the server-side session, never from the client.
- **Guest** — sees the public home page `/` (sales by user, no costs, profit or pay).

`src/proxy.ts` requires sign-in everywhere except `/` and `/login`, and the admin role for `/admin/*`; every Server Action checks again.

## Project Structure

```
src/
  app/
    page.tsx              # Public home: top seller, sales charts, totals by user
    login/
    (panel)/              # Signed-in shell: sidebar, header, breadcrumbs
      dashboard/          # Sales charts, prices & costs (admin), sale records
      account/            # Change own password
      admin/users/        # Admin: user management
      admin/milk/         # Admin: Milk purchases per seller per day
      admin/grains/       # Admin: grain purchases
  actions/                # Server Actions, one file per feature (+ tests)
  components/
    home/                 # Public home sections
    sale-records/         # Sale Records table, cells, record forms
    sales-charts/         # Charts, selected-day context
    admin/                # users/, milk-purchases/, grain-purchases/, stock-purchases/, product-pricing/
    layout/ ui/ auth/ account/ i18n/
  hooks/                  # Custom React hooks
  lib/
    daily-records.ts      # Builds sale record rows and the daily winner
    money/                # Prices, costs, revenue, net profit, seller pay
    auth/                 # Password hashing, session/admin guards
    i18n/                 # Translations (Spanish default, English)
  types/
prisma/
  schema.prisma
  seed.ts                 # Idempotent seed script
context/                  # Spec, coding standards, workflow, current feature, history
```

## Data Model

- **User** — admin or seller role, active/inactive.
- **DailyWorkRecord** — one per user per day: Queso/Yogurt taken and left over, user-entered total sold (all four products), and the sale prices snapshotted at creation so later price changes never rewrite past records.
- **ProductPrice** — current sale price and purchase cost for Queso and Yogurt; one row per product, updated in place.
- **StockPurchase** — a Milk purchase (for one seller) or grain purchase (Maíz pelado, Maíz con cáscara, Haba): quantity and unit cost. Feeds net profit.

## Internationalization

The app is bilingual — Spanish by default, English optional — via a cookie-backed language switcher; see `src/lib/i18n/`.

## Testing

Vitest covers Server Actions (`src/actions/`) and business logic (`src/lib/`) only — React components are verified in the browser, not unit-tested (see `context/coding-standards.md`). Run `npm test` before committing.
