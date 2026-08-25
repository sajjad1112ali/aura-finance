# Plan: Migrate Aura Finance to Turso + Drizzle + Hono

## Goal
Replace localStorage with Turso (SQLite) as the persistent storage backend, add a Hono API layer, secure auth with bcrypt + JWT cookies, and deploy to Vercel.

---

## Architecture Overview

```
Browser (React/Vite)
  ↕ fetch() API calls
Hono API Server (Vercel serverless functions)
  ↕ drizzle-orm/libsql
Turso Cloud (LibSQL/SQLite)
```

---

## Phase 0: Project Scaffolding

### 0.1 — Install dependencies

**Production:**
```
drizzle-orm @libsql/client hono @hono/node-server bcryptjs jsonwebtoken dotenv
```

**Dev:**
```
drizzle-kit @types/bcryptjs @types/jsonwebtoken tsx
```

> `bcryptjs` (pure JS) over `bcrypt` (native) to avoid build issues on Vercel.

### 0.2 — Create server directory structure

```
server/
├── index.ts              # Hono entry, exports `app` for Vercel
├── db/
│   ├── index.ts          # Drizzle client + migrate on cold start
│   └── schema.ts         # All table definitions
├── routes/
│   ├── auth.ts           # POST /api/auth/sign-up, /sign-in, /sign-out, GET /me
│   ├── transactions.ts   # CRUD /api/transactions
│   ├── categories.ts     # CRUD /api/categories
│   ├── recurring.ts      # CRUD /api/recurring
│   └── extra.ts          # CRUD /api/extra-transactions
├── middleware/
│   ├── auth.ts           # JWT verification middleware
│   └── error.ts          # Global error handler
└── lib/
    ├── jwt.ts            # Sign/verify JWT helpers
    └── migration.ts      # localStorage → Turso migration logic
```

### 0.3 — Create `drizzle.config.ts` at project root

```ts
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './server/db/schema.ts',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
});
```

### 0.4 — Add npm scripts to `package.json`

```json
"server:dev": "tsx watch server/index.ts",
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio",
"db:push": "drizzle-kit push"
```

### 0.5 — Create `.env.example`

```
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
JWT_SECRET=generate-a-random-secret
```

### 0.6 — Update `.gitignore`

Add: `local.db`, `.env`, `drizzle/meta/`

### 0.7 — Update `vite.config.ts`

Add dev server proxy so frontend calls to `/api/*` route to the Hono server:

```ts
server: {
  proxy: {
    '/api': 'http://localhost:3001',
  },
}
```

---

## Phase 1: Database Schema (Drizzle)

### File: `server/db/schema.ts`

Map existing TypeScript types (`src/types/index.ts`) to SQLite tables:

| App Type | SQLite Table | Key Columns |
|----------|-------------|-------------|
| `User` | `users` | `id` (text PK), `name`, `email` (unique), `password_hash`, `created_at` |
| `Category` | `categories` | `id` (text PK), `name`, `icon`, `color`, `type`, `is_custom`, `user_id` (FK) |
| `Transaction` | `transactions` | `id` (text PK), `amount`, `type`, `category_id` (FK), `date`, `description`, `created_at`, `recurring_rule_id` (FK, nullable), `user_id` (FK) |
| `RecurringRule` | `recurring_rules` | `id` (text PK), `amount`, `type`, `category_id` (FK), `description`, `frequency`, `start_date`, `last_posted_date`, `created_at`, `user_id` (FK) |
| `ExtraTransaction` | `extra_transactions` | `id` (text PK), `amount`, `date`, `notes`, `created_at`, `user_id` (FK) |

**Design decisions:**
- Keep `id` as `text` (UUID strings) to preserve compatibility with existing `crypto.randomUUID()` calls in the frontend.
- Add `user_id` FK to every data table (enables multi-user properly).
- Use `text` for dates (ISO strings) — same format as current localStorage data.
- Index all `user_id` columns for query performance.
- Index `transactions.date` and `transactions.category_id` for dashboard queries.

### Run `drizzle-kit generate` to create initial migration.

---

## Phase 2: Hono API Server

### 2.1 — Server entry (`server/index.ts`)

```ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';

const app = new Hono().basePath('/api');
app.use('/*', cors({ origin: 'http://localhost:5173', credentials: true }));

// Mount route groups
app.route('/auth', authRoutes);
app.use('/transactions/*', authMiddleware);
app.use('/categories/*', authMiddleware);
app.use('/recurring/*', authMiddleware);
app.use('/extra/*', authMiddleware);
app.route('/transactions', transactionRoutes);
app.route('/categories', categoryRoutes);
app.route('/recurring', recurringRoutes);
app.route('/extra', extraRoutes);

// For Vercel: export the fetch handler
export default app;

// For local dev: start the server
if (process.env.NODE_ENV !== 'production') {
  serve({ fetch: app.fetch, port: 3001 });
}
```

### 2.2 — Auth routes (`server/routes/auth.ts`)

| Endpoint | Method | Body | Response | Notes |
|----------|--------|------|----------|-------|
| `/api/auth/sign-up` | POST | `{ name, email, password }` | `{ user }` | Hash password with bcrypt (12 rounds), set JWT cookie |
| `/api/auth/sign-in` | POST | `{ email, password }` | `{ user }` | Verify bcrypt hash, set JWT cookie |
| `/api/auth/sign-out` | POST | — | `{ ok: true }` | Clear cookie |
| `/api/auth/me` | GET | — | `{ user }` | Read JWT from cookie, return user |

**JWT payload:** `{ sub: userId, email, name }`
**Cookie:** `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, `Max-Age=60*60*24*30` (30 days)

### 2.3 — Data routes pattern

Each resource follows the same pattern:

```
GET    /api/{resource}        → list (filtered by user_id from JWT)
POST   /api/{resource}        → create
PATCH  /api/{resource}/:id    → update
DELETE /api/{resource}/:id    → delete
```

All queries filter by `user_id` from the authenticated JWT.

### 2.4 — Auth middleware (`server/middleware/auth.ts`)

- Read `Authorization` header or cookie
- Verify JWT with `jsonwebtoken`
- Attach `userId` to Hono context (`c.set('userId', ...)`)
- Return 401 if invalid/missing

---

## Phase 3: Frontend Refactor

### 3.1 — Create API client (`src/services/api.ts`)

Replace the `StorageAdapter` with a fetch-based API client:

```ts
const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',  // send cookies
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  auth: {
    me: () => request<{ user: User }>('/auth/me'),
    signUp: (data: { name: string; email: string; password: string }) =>
      request<{ user: User }>('/auth/sign-up', { method: 'POST', body: JSON.stringify(data) }),
    signIn: (data: { email: string; password: string }) =>
      request<{ user: User }>('/auth/sign-in', { method: 'POST', body: JSON.stringify(data) }),
    signOut: () => request<{ ok: true }>('/auth/sign-out', { method: 'POST' }),
  },
  transactions: {
    list: () => request<Transaction[]>('/transactions'),
    create: (t: Omit<Transaction, 'id' | 'createdAt'>) =>
      request<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(t) }),
    update: (id: string, patch: Partial<Transaction>) =>
      request<Transaction>(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
    delete: (id: string) =>
      request<{ ok: true }>(`/transactions/${id}`, { method: 'DELETE' }),
  },
  // ... same pattern for categories, recurring, extra
};
```

### 3.2 — Refactor `src/store/auth.ts`

- Remove `StoredUser` interface (passwords no longer in frontend)
- `init()`: call `api.auth.me()` — if JWT cookie exists, user is restored
- `signIn()`: call `api.auth.signIn()` — server sets JWT cookie
- `signUp()`: call `api.auth.signUp()` — server sets JWT cookie
- `signOut()`: call `api.auth.signOut()` — server clears cookie

### 3.3 — Refactor `src/store/finance.ts`

Replace all `storage.set()` / `storage.get()` calls with `api.transactions.*`, `api.categories.*`, `api.recurring.*`:

```ts
// BEFORE:
await storage.set(txKey(uid), transactions);

// AFTER:
const updated = await api.transactions.create(t);
set({ transactions: [updated, ...get().transactions] });
```

**Key change:** mutations now return the server-confirmed entity (with real ID, timestamps), so optimistic updates can be reconciled.

### 3.4 — Refactor `src/features/extra/extraStore.ts`

- Replace direct `localStorage.getItem/setItem` calls with `api.extra.*`
- Make `load()` async (currently synchronous)

### 3.5 — Remove dead code

- Delete `src/services/storage.ts` (replaced by api.ts)
- Delete `src/App.css` (unused Vite boilerplate)
- Delete `src/components/NavLink.tsx` (never imported)
- Remove `@tanstack/react-query` dependency (unused)
- Remove `react-hook-form`, `zod`, `@hookform/resolvers` (unused)
- Remove the Radix `Toaster` from `App.tsx` (only `Sonner` is actually used)

### 3.6 — Update `src/services/seed.ts`

Default categories are now seeded via the API on user sign-up (server-side), not loaded from localStorage.

---

## Phase 4: Data Migration (localStorage → Turso)

### Strategy: Auto-migrate on first login after update

When a user signs in via the new API, check if they have existing localStorage data under the old `et.*` keys. If yes, push it to Turso and clear localStorage.

### File: `src/services/migrate.ts`

```ts
export async function migrateLocalStorageToTurso(userId: string): Promise<void> {
  const oldTransactions = JSON.parse(localStorage.getItem(`et.transactions.${userId}`) || '[]');
  const oldCategories = JSON.parse(localStorage.getItem(`et.categories.${userId}`) || '[]');
  const oldRecurring = JSON.parse(localStorage.getItem(`et.recurring.${userId}`) || '[]');
  const oldExtra = JSON.parse(localStorage.getItem(`et.extraTransactions.${userId}`) || '[]');

  if (!oldTransactions.length && !oldCategories.length) return; // nothing to migrate

  // Batch-create via API
  await api.categories.migrate(oldCategories);
  await api.transactions.migrate(oldTransactions);
  await api.recurring.migrate(oldRecurring);
  await api.extra.migrate(oldExtra);

  // Clear old localStorage keys
  localStorage.removeItem(`et.transactions.${userId}`);
  localStorage.removeItem(`et.categories.${userId}`);
  localStorage.removeItem(`et.recurring.${userId}`);
  localStorage.removeItem(`et.extraTransactions.${userId}`);
  localStorage.removeItem(`et.auth.user`);
  localStorage.removeItem(`et.auth.users`);
}
```

### Server-side migration endpoints

Add `POST /api/{resource}/migrate` endpoints that accept arrays and bulk-insert (skipping duplicates by `id`).

### When to run

In `src/store/finance.ts` `load()` method — after successful auth, check for old keys and trigger migration once.

---

## Phase 5: Vercel Deployment

### 5.1 — `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api" }
  ]
}
```

### 5.2 — Vercel project settings

- **Framework Preset:** Vite
- **Root Directory:** `./`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### 5.3 — Environment variables (Vercel dashboard)

```
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
JWT_SECRET=...
```

### 5.4 — Server as Vercel serverless

The `server/index.ts` exports `app` as default — Vercel treats this as a serverless function. The `vercel.json` rewrites route `/api/*` to this function.

---

## Phase 6: Cleanup & Hardening

### 6.1 — Remove unused dependencies from `package.json`

Candidates (verify each is truly unused before removing):
```
@tanstack/react-query, react-hook-form, zod, @hookform/resolvers,
lovable-tagger, @tailwindcss/typography, embla-carousel-react,
input-otp, react-resizable-panels, @radix-ui/react-aspect-ratio,
@radix-ui/react-avatar, @radix-ui/react-collapsible,
@radix-ui/react-context-menu, @radix-ui/react-hover-card,
@radix-ui/react-menubar, @radix-ui/react-navigation-menu,
@radix-ui/react-scroll-area, @radix-ui/react-toggle-group
```

### 6.2 — Consolidate duplicated utilities

Move `today()`, `pad()`, `monthRange()` to `src/lib/utils.ts`.

### 6.3 — Remove duplicate lockfiles

Keep only `package-lock.json` (since Vercel uses npm). Delete `bun.lock`, `bun.lockb`, `pnpm-lock.yaml`.

### 6.4 — Add error boundaries

Wrap `<Routes>` in `src/App.tsx` with a React Error Boundary component.

### 6.5 — Update README

- Remove "Your data stays on your device" (no longer true)
- Update tech stack section
- Add Turso setup instructions
- Add local dev instructions (`server:dev` + `dev` in parallel)

---

## File Change Summary

| Action | File | Description |
|--------|------|-------------|
| CREATE | `server/index.ts` | Hono entry point |
| CREATE | `server/db/index.ts` | Drizzle connection |
| CREATE | `server/db/schema.ts` | Table definitions |
| CREATE | `server/routes/auth.ts` | Auth endpoints |
| CREATE | `server/routes/transactions.ts` | Transaction CRUD |
| CREATE | `server/routes/categories.ts` | Category CRUD |
| CREATE | `server/routes/recurring.ts` | Recurring CRUD |
| CREATE | `server/routes/extra.ts` | Extra transaction CRUD |
| CREATE | `server/middleware/auth.ts` | JWT verification |
| CREATE | `server/middleware/error.ts` | Error handler |
| CREATE | `server/lib/jwt.ts` | JWT helpers |
| CREATE | `server/lib/migration.ts` | Migration endpoints |
| CREATE | `drizzle.config.ts` | Drizzle Kit config |
| CREATE | `.env.example` | Env template |
| CREATE | `vercel.json` | Vercel deployment config |
| CREATE | `src/services/api.ts` | Frontend API client |
| CREATE | `src/services/migrate.ts` | localStorage migration |
| MODIFY | `src/store/auth.ts` | Use API instead of localStorage |
| MODIFY | `src/store/finance.ts` | Use API instead of storage adapter |
| MODIFY | `src/features/extra/extraStore.ts` | Use API instead of direct localStorage |
| MODIFY | `src/features/auth/AuthPage.tsx` | Minor: remove "on your device" claim |
| MODIFY | `src/App.tsx` | Add error boundary, remove unused providers |
| MODIFY | `vite.config.ts` | Add API proxy |
| MODIFY | `package.json` | Add deps, scripts |
| MODIFY | `.gitignore` | Add local.db, .env |
| MODIFY | `README.md` | Update docs |
| DELETE | `src/services/storage.ts` | Replaced by api.ts |
| DELETE | `src/App.css` | Dead boilerplate |
| DELETE | `src/components/NavLink.tsx` | Never imported |

---

## Implementation Order

1. **Phase 0** → Scaffolding (do first, unblocks everything)
2. **Phase 1** → Schema + migrations (database foundation)
3. **Phase 2** → API routes (server logic)
4. **Phase 3** → Frontend refactor (connect to API)
5. **Phase 4** → Data migration (existing user onboarding)
6. **Phase 5** → Vercel deployment
7. **Phase 6** → Cleanup

Phases 0-4 can be developed and tested locally. Phase 5 is deploy. Phase 6 is polish.

---

## Testing Strategy

- **Local:** Turso local development with `file:local.db` (no cloud needed for dev)
- **API testing:** Use `curl` or a REST client against `localhost:3001/api/*`
- **Frontend:** Test login flow, CRUD operations, data persistence across page reloads
- **Migration:** Test with sample localStorage data → verify Turso has correct records
- **Production:** Vercel preview deployments for PR testing
