# Coding Standards

## TypeScript

- Strict mode enabled
- No `any` types — use proper typing or `unknown`
- Define interfaces for props, action results and data models
- Use type inference where obvious, explicit types where helpful

## React

- Functional components only
- Hooks for state and side effects; reusable logic goes in `src/hooks/`
- Keep components focused — one job per component

## Next.js

- Server Components by default; `'use client'` only for interactivity, hooks or browser APIs
- Server Components fetch data directly (Prisma, via `src/lib/`)
- Server Actions (`src/actions/`) for every form and mutation
- API routes only for things Server Actions can't do (today: only Auth.js at `src/app/api/auth`)
- Route protection lives in `src/proxy.ts`; every Server Action re-checks the session/role itself (`src/lib/auth/require-session.ts`, `src/lib/auth/require-admin.ts`)
- A Server Component can't pass functions to a Client Component: pass the `locale` string and build the translator (`translate`) in the client
- Client Components must never import a `src/lib` module that imports Prisma (it would bundle `@prisma/client` into the browser). Keep pure logic in Prisma-free files (e.g. `revenue.ts`, `editable-record.ts`)

## Tailwind CSS v4

- **Do not** create `tailwind.config.ts` / `tailwind.config.js` (that's v3)
- Theme and global styles live in `src/app/globals.css` (`@theme`, CSS custom properties)
- Tailwind classes for all styling; no inline styles
- Dark mode first, light mode supported
- Shared UI pieces live in `src/components/ui/` (no component library)

## File Organization

```
src/
  app/                 Pages (App Router); (panel)/ is the signed-in shell
  actions/             Server Actions, one file per feature, tests next to them
  components/[feature]/ComponentName.tsx
    admin/             users, milk-purchases, grain-purchases, stock-purchases (shared), product-pricing
    home/              public home page sections
    sale-records/      Sale Records table, its cells, record forms (also used by home/)
    sales-charts/      charts and the selected-day context
    layout/ ui/ auth/ account/ i18n/
  hooks/               Custom React hooks
  lib/                 Logic and data access
    auth/              password hashing, session/admin guards
    money/             prices, costs, revenue, net profit, seller pay
    i18n/              translations, server locale, error translation
  types/[feature].ts   Shared types
```

## Naming

- Components: PascalCase (`EditButton.tsx`)
- Other files: kebab-case (`seller-pay.ts`)
- Functions: camelCase; constants: SCREAMING_SNAKE_CASE; types/interfaces: PascalCase, no prefix

## Text and Languages

- Every UI string goes through `src/lib/i18n/translations.ts`, in both Spanish (default) and English
- Server Actions return English error messages; the UI shows them in the user's language via `localizeError` (`src/lib/i18n/errors.ts`). Add an `error.*` key for each new message — a test fails otherwise

## Database

- Prisma for all database access (`src/lib/prisma.ts`)
- MongoDB has no Prisma migrations: change `prisma/schema.prisma`, then `npx prisma db push`
- Optional fields or defaults for new fields, so existing documents still read
- Store values that must not change later (e.g. the sale price on a record) on the record itself

## Forms and Errors

- Validate every input with Zod in the Server Action
- `try/catch` in Server Actions; return `{ success, data?, error? }`
- Forms use `useActionState` + `useSubmitWithoutReset` so fields keep their values when validation fails
- Modals show a confirmation toast after save/delete (`useSuccessToast`); other forms show an inline message

## Testing

- **Vitest**, Node environment (no DOM)
- Only Server Actions (`src/actions`) and utilities (`src/lib`) are unit tested; verify components in the browser
- Tests sit next to the code as `*.test.ts`
- Mock Prisma at the module boundary (`vi.mock("@/lib/prisma")`)
- `npm test` must pass before committing, along with `npm run lint` and `npm run build`

## Code Quality

- No commented-out code
- No unused imports, variables, files or translation keys
- Keep functions under ~50 lines when possible
