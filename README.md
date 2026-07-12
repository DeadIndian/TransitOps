# 🚚 TransitOps (Work in progress)

**Smart Transport Operations Platform** — a role-gated, rule-enforcing web app to manage the full lifecycle of transport operations: vehicles, drivers, dispatch, maintenance, fuel & expenses, with live operational insight.

Rendered in a **neo-brutalist** dark cockpit with **Comic Sans** typography — playful on the surface, rigorous underneath.

`Next.js 16` · `React 19` · `TypeScript` · `Tailwind v4` · `Prisma 7 + PostgreSQL` · `Auth.js`

---

## Sources of truth

| Concern | Authority |
|---|---|
| Database schema | `prisma/schema.prisma` — if a doc disagrees, the schema wins |
| UX / layout | wireframes in `wireframe/` |
| Visual language | Neo-Brutalism + Comic Sans (see `plan.md` §4) |
| Full build spec | **`plan.md`** — architecture, rules, RBAC, phase split |

> **Next.js is v16** — APIs differ from older majors. Read the guides in `node_modules/next/dist/docs/` before writing framework code (async `params`, middleware, server actions, caching).

## Four roles, one login

| Role | Owns |
|---|---|
| **Fleet Manager** | Fleet assets, maintenance, vehicle lifecycle, analytics |
| **Driver** | Trip creation, dispatch, live delivery monitoring |
| **Safety Officer** | Driver compliance, license validity, safety scores |
| **Financial Analyst** | Expenses, fuel, maintenance cost, operational cost |

## Local setup

Requires Docker (for Postgres) and Node + pnpm.

```bash
docker compose up -d            # local Postgres 16 on :5432
cp .env.example .env            # then set AUTH_SECRET
pnpm install
pnpm prisma migrate dev         # apply migrations + generate client
pnpm prisma db seed             # load demo data (4 users, 6 vehicles, 5 drivers, 4 trips)
pnpm dev                        # http://localhost:3000
```

Demo logins (shared password, see `prisma/seed.ts`): `manager@transitops.dev`, `driver@transitops.dev`, `safety@transitops.dev`, `finance@transitops.dev`.

## Scripts

| Command | Does |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm db:migrate` | `prisma migrate dev` |
| `pnpm db:seed` | Seed demo data |
| `pnpm db:studio` | Prisma Studio |
| `pnpm db:reset` | Drop, re-migrate, re-seed |

## Project layout

See `plan.md` → *Project Structure*. In short: `src/app` (routes, role route-groups, API), `src/components` (neo-brutalist UI + feature forms), `src/core` (db, security/RBAC, errors, utils), `src/modules` (per-entity service/repository/Zod schema), `prisma/` (schema, migrations, seed).

## Build plan

`plan.md` → *Build Plan* splits the work across **3 people**: Person A front-loads the shared foundation (DB, auth, RBAC, design system, app shell), then three parallel vertical tracks — A: Dashboard + CSV export; B: Fleet + Trips + Maintenance (the crown-jewel dispatcher); C: Drivers + Fuel & Expenses + Analytics.
