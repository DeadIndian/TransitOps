<div align="center">

# 🚚 TransitOps — Build Plan

### Smart Transport Operations Platform · Neo-Brutalist × Comic Sans Edition

**A centralized platform to manage the full lifecycle of transport operations — vehicles, drivers, dispatch, maintenance, fuel & expenses — with enforced business rules and live operational insight.**

`Next.js 15` · `TypeScript` · `Tailwind v4` · `Prisma + Neon Postgres` · `Auth.js` · `Recharts`

</div>

---

## 📑 Table of Contents

1. [Product Overview](#-product-overview)
2. [Technology Stack](#technology-stack)
3. [Database Design & Strategy](#database-design--strategy)
4. [Design System — Neo-Brutalist × Comic Sans](#design-system--neo-brutalist--comic-sans)
5. [Screen-by-Screen Specification](#screen-by-screen-specification)
6. [Business Rules, State Machines & RBAC](#business-rules-state-machines--rbac)
7. [Analytics, Reporting & Bonus Features](#analytics-reporting--bonus-features)
8. [8-Hour Build Plan & Delivery](#8-hour-build-plan--delivery)

> **Consistency note.** This plan is the single source of truth. Canonical decisions used throughout: auth route is **`/login`**; fuel & expenses route is **`/expenses`**; the vehicle name column is **`name_model`**; ROI is **stored as a ratio and displayed ×100 as a percent**; fleet-wide maintenance cost comes **only** from `maintenance_logs` (never double-counted via `expenses.maintenance_linked`); fuel efficiency uses the **odometer delta** (`final_odometer − start_odometer`); the demo seed is **4 role users, 6 vehicles, 5 drivers, 4 trips**; CSV export is served from **`/api/export/[dataset]`**. Roles are modeled as a **`user_role` enum**, not a separate table.

---

## 🧭 Product Overview

**The problem.** Many logistics companies still run on spreadsheets and paper logbooks — causing scheduling conflicts, underutilized vehicles, missed maintenance, expired licenses, sloppy expense tracking, and zero operational visibility.

**The build.** TransitOps digitizes the entire transport operation behind a role-gated, rule-enforcing web app that looks like nothing else in the room: a dark ops cockpit rendered in **neo-brutalist blocks** with **Comic-style typography** — playful on the surface, rigorous underneath.

**Four roles, one login (RBAC):**

| Role | Owns | Landing focus |
|---|---|---|
| **Fleet Manager** | Fleet assets, maintenance, vehicle lifecycle, analytics | Fleet + Maintenance |
| **Dispatcher** | Trip creation, vehicle/driver assignment, live delivery monitoring | Dashboard + Trips |
| **Safety Officer** | Driver compliance, license validity, safety scores | Drivers + Compliance |
| **Financial Analyst** | Expenses, fuel, maintenance cost, profitability | Fuel & Expenses + Analytics |

**Eight core entities:** Users · Vehicles · Drivers · Trips · Maintenance Logs · Fuel Logs · Expenses · (Roles → modeled as a `user_role` enum).

**The crown jewel** is the **Trip Dispatcher**: available-only pickers, a live cargo-vs-capacity guard, and a single atomic transaction that flips a trip → *Dispatched* while marking its vehicle **and** driver *On Trip*. Nail this and every other screen orbits it.

---

## Technology Stack

### At a Glance

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15** (App Router, React 19, Server Actions) | RSC + Server Actions collapse the API tier — fewer moving parts in 8h |
| Language | **TypeScript** (`strict: true`) | Catch RBAC/business-rule mistakes at compile time, not demo time |
| Styling | **Tailwind CSS v4** + custom neo-brutalist tokens | Utility speed; v4's CSS-first config makes thick borders/hard shadows trivial |
| Component base | **shadcn/ui** (copy-in, re-skinned brutalist) | Own the code, override styling freely — no fighting a design system |
| Fonts | **Comic Neue** via `next/font` + `'Comic Sans MS'` fallback | The aesthetic mandate, self-hosted with zero layout shift |
| Animation | **Framer Motion** (`motion`) | Chunky hover/press micro-interactions without hand-rolling springs |
| ORM | **Prisma** (+ `@prisma/adapter-neon`) | Best-in-class migrations & Studio; `schema.prisma` is the single readable source of truth |
| Database | **Neon Postgres** (serverless) | Real Postgres, branchable, zero-ops, first-class on Vercel |
| Auth | **Auth.js (NextAuth v5)** — Credentials + JWT | Role-in-token + middleware guards map 1:1 to the 4-role RBAC matrix |
| Validation | **Zod** (shared client + server) | One schema drives forms, Server Actions, and DB writes |
| Server state | **RSC + Server Actions** (TanStack Query only if SPA) | Mutations that enforce rules live server-side by default |
| Charts | **Recharts** | Composable SVG bars/KPIs, easy to restyle brutalist |
| Tables | **TanStack Table** | Headless sort/filter/search for the 6 data grids |
| CSV / PDF | **PapaParse** / **@react-pdf/renderer** | Mandatory CSV cheap; optional PDF as a declarative bonus |
| Email | **Resend** + **Vercel Cron** | Daily license-expiry reminders in a few lines |
| Forms | **React Hook Form** + `zodResolver` | Fast, uncontrolled inputs wired to the shared Zod schemas |
| Deployment | **Vercel** + Neon | Push-to-deploy, cron & env built in |
| Tooling | **pnpm**, **Biome**, **Prisma Migrate + Studio**, seed script | One fast toolchain, versioned migrations, demo-ready data |

### Framework

**Next.js 15** (App Router, React 19, Server Actions) is the primary choice. Server Components fetch fleet/trip data directly, and Server Actions let every mutation enforce the mandatory business rules (uniqueness, capacity, license/status gates, status transitions) server-side — no separate REST layer to build under time pressure. Pick the **alternative — Vite + React + Hono/Express** — only if the team is more fluent in a classic SPA + JSON API split, or wants the lightest possible client; you then trade away the "no API tier" speed win and add TanStack Query for data fetching.

### Language

**TypeScript with `strict: true`.** The RBAC matrix, entity statuses, and pill-color unions are all discriminated types — strict mode turns an illegal `status` or an unassigned driver into a red squiggle instead of a runtime bug on stage.

### Styling

**Tailwind CSS v4** with a small set of brutalist design tokens (thick `border-4 border-black`, hard offset shadows via `shadow-[6px_6px_0_0_#000]`, blocky high-contrast fills over the dark UI + orange accent). Use **shadcn/ui** as an unstyled, copy-in base and re-skin its primitives brutalist — you keep full ownership of the markup rather than overriding an opinionated library. Load **Comic Neue** through `next/font` (or `@fontsource/comic-neue`) with a fallback stack of `'Comic Sans MS', 'Comic Sans', cursive` so the comic-handwritten look holds even before the webfont lands, with no CLS.

### Animation / Interaction

**Framer Motion (`motion`)** for chunky but *subtle* hover-lift and press-depress on buttons/cards — the shadow "presses in" on tap, matching the brutalist physicality. Keep it to transform/opacity only; no gratuitous page transitions.

### Data Layer / ORM

**Prisma** — recommended. `schema.prisma` is the single, highly readable source of truth, and **Prisma Migrate** gives versioned, reviewable migrations (`migrate dev` in development, `migrate deploy` in prod) plus drift detection and **Prisma Studio** for eyeballing seed data — the safest, friendliest schema-evolution loop for a team. On Vercel + Neon, pair it with the **`@prisma/adapter-neon`** driver adapter to keep serverless cold starts low. The one caveat for this app: Prisma has no first-class `SELECT … FOR UPDATE`, so the dispatch/complete row locks are taken with a one-line `$queryRaw` inside the interactive transaction (see §5). **Drizzle ORM** is the tradeoff pick — native `.for('update')` row locking and a lighter client, at the cost of Prisma's migration ergonomics and Studio.

### Database

**Neon Postgres (serverless)** — one real Postgres you can branch per experiment, with connection pooling that suits Vercel's serverless functions and near-zero setup. (Supabase is comparable but its auth/storage extras are wasted here since we own auth.) Fallback for a fully offline/zero-setup start: **SQLite**, which Prisma supports with a one-line `datasource` provider swap.

### Auth

**Auth.js (NextAuth v5)** with the **Credentials provider**: passwords hashed with **bcrypt**, **JWT sessions**, and the user's `role` embedded in the token via the `jwt` callback. A single **`middleware.ts`** reads the role and gates routes to match the RBAC matrix (e.g. Dispatcher → Trips, Safety Officer → Drivers). This also gives the "account locked after 5 failed attempts" and role-scoped nav for free. **Lucia** is the lighter-weight alternative if you want to own the session logic end-to-end.

### Validation

**Zod**, with schemas shared across client and server. Each entity gets one schema that powers the React Hook Form resolver *and* re-runs inside the Server Action, so validation (cargo weight ≤ capacity, unique registration, license not expired) can never be bypassed by the client.

### Server State / Data Fetching

**React Server Components + Server Actions** as the default — reads happen in RSCs, writes in actions that return revalidated data. Only introduce **TanStack Query** if you take the Vite/SPA branch, where you'd need client-side caching and mutations against the Hono/Express API.

### Charts

**Recharts** — recommended for the Vehicle Status bars, Monthly Revenue bar chart, Top Costliest Vehicles ranked bars, and KPI visuals. Its SVG elements accept `stroke`/`fill` directly, so the brutalist black-outline + hard-fill treatment is a styling pass, not a rewrite. **visx** is the alternative when you need fully custom, low-level D3 control — overkill for standard bars here.

### Tables

**TanStack Table** (headless) drives the six grids (Fleet, Drivers, Trips, Service Log, Fuel, Expenses) with sort, global search, and column filters, while you render the chunky bordered rows and status pills yourself.

### Export

**PapaParse** for the mandatory CSV export (analytics + any grid → download in a few lines). **@react-pdf/renderer** for the optional PDF report — declarative React components map cleanly onto the KPI/analytics layout; reach for **pdfmake** only if you prefer an imperative document model.

### Email Reminders (Bonus)

**Resend** for transactional email plus a **Vercel Cron** job hitting a route handler daily that queries drivers whose `license_expiry_date` is within N days and emails the Safety Officer — a small, high-visibility bonus.

### Forms

**React Hook Form** with `@hookform/resolvers/zod`, reusing the same Zod schemas as the server. Uncontrolled inputs keep the dispatch/maintenance/fuel forms fast, and the resolver surfaces the live validation box (e.g. capacity-exceeded → Dispatch disabled) instantly.

### Deployment

**Vercel** (recommended) with **Neon** — git push deploys, environment variables, and Cron all in one place. Ship a **Dockerfile** as the portable escape hatch if the demo must run self-hosted or offline.

### Dev Tooling

**pnpm** for fast installs, **Biome** as a single lint+format tool (skip the ESLint+Prettier config tax; use that pair only if the team already has a shared config), **Prisma Migrate** for versioned migrations (`prisma migrate dev`) plus **Prisma Studio** to inspect data, and a **`prisma/seed.ts`** script (wired to `prisma db seed`) that loads realistic vehicles, drivers, trips, and logs so every screen and KPI is populated for judging on first load.

---

## Database Design & Strategy

### Strategy

TransitOps runs on **PostgreSQL 16** with **Prisma** as the single source of truth for schema and migrations. The `schema.prisma` file describes every model, and **Prisma Migrate** turns edits into versioned, reviewable SQL migrations (with drift detection and a clean history in `_prisma_migrations`). We model every categorical field (statuses, roles, license categories) as **native Postgres enums** (Prisma `enum` blocks) rather than free-text or lookup tables: enums are cheap, self-documenting, and push value validation into the database so an invalid `trip_status` can never be persisted. For a time-boxed hackathon this beats a normalized `roles`/`permissions` schema — see the ERD note below. On Vercel + Neon we register the **`@prisma/adapter-neon`** driver adapter so the client talks to Neon over its serverless driver with minimal cold-start cost.

We adopt a **soft-delete stance for business entities** (`vehicles`, `drivers`, `trips`) via a nullable `deleted_at timestamptz`, because operational history (a retired vehicle's past trips, a suspended driver's record) must survive for analytics and audit. **Log-style tables** (`fuel_logs`, `maintenance_logs`, `expenses`) are effectively append-only and use **hard-delete** only for correcting entry mistakes. Every table carries `created_at timestamptz not null default now()` and `updated_at timestamptz not null default now()` (bumped by the app on write), all stored in UTC.

We push business rules into **DB constraints wherever the rule is a static invariant**: `registration_number` gets a `@unique` constraint (Rule 1), relation fields enforce referential integrity, and `CHECK` constraints guard non-negative money/quantities. Prisma's schema language has no `@check` attribute yet, so these `CHECK`s are added by hand-editing the generated migration SQL (Prisma keeps your edits — `migrate dev` only diffs the schema, and raw SQL in a migration file is preserved). Rules that depend on **cross-row or transient state** — cargo weight ≤ vehicle capacity (Rule 5), "not already On Trip" (Rule 4), license-expiry gating (Rule 3) — are enforced in the **application/service layer inside a transaction**, because they compare values across tables or against `now()` and produce user-facing validation messages. In particular, **`cargo_weight <= max_load_capacity` is validated app-side** (the dispatch form disables the button and shows an error) since a `CHECK` cannot reference another table; we note it here explicitly as an intentional app-level guard.

**Indexing:** we index every **relation/foreign-key field** (`vehicle_id`, `driver_id`, `trip_id`) via `@@index` to keep joins fast, every **`status`** column (dashboards filter heavily on status), and **`registration_number`** (the `@unique` index doubles as the search index for the Vehicle Registry). We add an index on `drivers.license_expiry_date` for the expiring-license reminder job (a partial index can be layered in via raw migration SQL if desired).

### Entity-Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ TRIPS : "creates (dispatcher)"
    VEHICLES ||--o{ TRIPS : "assigned to"
    DRIVERS ||--o{ TRIPS : "assigned to"
    VEHICLES ||--o{ MAINTENANCE_LOGS : "serviced in"
    VEHICLES ||--o{ FUEL_LOGS : "refuelled in"
    VEHICLES ||--o{ EXPENSES : "incurs"
    TRIPS ||--o{ EXPENSES : "itemized by"

    USERS {
        uuid id PK
        text email UK
        text password_hash
        text full_name
        user_role role
        boolean is_active
        int failed_login_attempts
        timestamptz created_at
    }
    VEHICLES {
        uuid id PK
        text registration_number UK
        text name_model
        text type
        numeric max_load_capacity
        int odometer
        numeric acquisition_cost
        vehicle_status status
        text region
        timestamptz deleted_at
    }
    DRIVERS {
        uuid id PK
        text name
        text license_number UK
        license_category license_category
        date license_expiry_date
        text contact_number
        numeric safety_score
        numeric trip_completion
        driver_status status
        timestamptz deleted_at
    }
    TRIPS {
        uuid id PK
        text trip_code UK
        text source
        text destination
        uuid vehicle_id FK
        uuid driver_id FK
        uuid created_by FK
        numeric cargo_weight
        numeric planned_distance
        trip_status status
        int start_odometer
        int final_odometer
        numeric fuel_consumed
        numeric revenue
        timestamptz eta
        timestamptz completed_at
        timestamptz deleted_at
    }
    MAINTENANCE_LOGS {
        uuid id PK
        uuid vehicle_id FK
        text service_type
        numeric cost
        date service_date
        maintenance_status status
    }
    FUEL_LOGS {
        uuid id PK
        uuid vehicle_id FK
        date log_date
        numeric liters
        numeric cost
    }
    EXPENSES {
        uuid id PK
        uuid trip_id FK
        uuid vehicle_id FK
        numeric toll
        numeric other
        numeric maintenance_linked
        numeric total
    }
```

**On `roles`: we recommend a `user_role` enum column on `users`, not a separate `roles` table.** The brief fixes exactly four immutable roles (Fleet Manager, Dispatcher, Safety Officer, Financial Analyst) and a static RBAC matrix. A join-table RBAC model (`roles`, `permissions`, `user_roles`) buys runtime configurability we don't need in an 8-hour build and adds three tables plus joins to every auth check. A single `user_role` enum makes the role a first-class, DB-validated value, keeps middleware checks to one column read, and the RBAC matrix lives as a constant map in code. If multi-role or custom permissions were ever required, migrating the enum to a bridge table is a contained change.

### Per-Table Breakdown

#### `users`

| Column | Type | Constraints / Notes |
|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` |
| email | text | `NOT NULL`, `UNIQUE`, lowercased app-side |
| password_hash | text | `NOT NULL`, bcrypt/argon2 |
| full_name | text | `NOT NULL` (e.g. "Raven K.") |
| role | `user_role` | `NOT NULL` — enum, drives RBAC |
| is_active | boolean | `NOT NULL` default `true` |
| failed_login_attempts | integer | `NOT NULL` default `0`; lock at 5 (auth error card) |
| locked_until | timestamptz | nullable; set when attempts ≥ 5 |
| created_at | timestamptz | `NOT NULL` default `now()` |
| updated_at | timestamptz | `NOT NULL` default `now()` |

#### `vehicles`

| Column | Type | Constraints / Notes |
|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` |
| registration_number | text | `NOT NULL`, **`UNIQUE`** (Rule 1), indexed for search; stored uppercase |
| name_model | text | `NOT NULL` — name / model |
| type | text | `NOT NULL` — Van / Truck / Mini / … (validated against a Zod enum app-side) |
| max_load_capacity | numeric(12,2) | `NOT NULL`, `CHECK (max_load_capacity > 0)` — kg |
| odometer | integer | `NOT NULL` default `0`, `CHECK (odometer >= 0)` — km (current reading) |
| acquisition_cost | numeric(12,2) | `NOT NULL`, `CHECK (acquisition_cost >= 0)` |
| status | `vehicle_status` | `NOT NULL` default `'available'`, **indexed** |
| region | text | `NOT NULL` — dashboard region filter |
| deleted_at | timestamptz | nullable — soft delete |
| created_at | timestamptz | `NOT NULL` default `now()` |
| updated_at | timestamptz | `NOT NULL` default `now()` |

#### `drivers`

| Column | Type | Constraints / Notes |
|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` |
| name | text | `NOT NULL` |
| license_number | text | `NOT NULL`, `UNIQUE` |
| license_category | `license_category` | `NOT NULL` — LMV / HMV |
| license_expiry_date | date | `NOT NULL`; expired → gated (Rule 3), shown orange; indexed for reminders |
| contact_number | text | `NOT NULL` |
| safety_score | numeric(5,2) | `NOT NULL` default `100`, `CHECK (safety_score BETWEEN 0 AND 100)` |
| trip_completion | numeric(5,2) | `NOT NULL` default `0` — completion % `CHECK (0..100)`; recomputed on trip complete/cancel |
| status | `driver_status` | `NOT NULL` default `'available'`, **indexed** |
| deleted_at | timestamptz | nullable — soft delete |
| created_at | timestamptz | `NOT NULL` default `now()` |
| updated_at | timestamptz | `NOT NULL` default `now()` |

#### `trips`

| Column | Type | Constraints / Notes |
|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` |
| trip_code | text | `NOT NULL`, `UNIQUE` — TR001… |
| source | text | `NOT NULL` |
| destination | text | `NOT NULL` |
| vehicle_id | uuid | `NOT NULL`, FK → `vehicles(id)`, **indexed** |
| driver_id | uuid | `NOT NULL`, FK → `drivers(id)`, **indexed** |
| created_by | uuid | FK → `users(id)` — dispatcher who created it |
| cargo_weight | numeric(12,2) | `NOT NULL`, `CHECK (cargo_weight > 0)`; ≤ capacity enforced **app-side** (Rule 5) |
| planned_distance | numeric(10,2) | `NOT NULL` — km |
| status | `trip_status` | `NOT NULL` default `'draft'`, **indexed** |
| start_odometer | integer | nullable — snapshot of `vehicle.odometer` at **dispatch**; enables true trip distance |
| final_odometer | integer | nullable — set at completion; `CHECK (final_odometer >= start_odometer)` |
| fuel_consumed | numeric(10,2) | nullable — litres, entered at completion |
| revenue | numeric(12,2) | nullable — used in ROI / monthly revenue |
| eta | timestamptz | nullable — Recent Trips ETA column |
| completed_at | timestamptz | nullable — set at completion; **authoritative timestamp for Monthly Revenue** |
| deleted_at | timestamptz | nullable — soft delete |
| created_at | timestamptz | `NOT NULL` default `now()` |
| updated_at | timestamptz | `NOT NULL` default `now()` |

#### `maintenance_logs`

| Column | Type | Constraints / Notes |
|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` |
| vehicle_id | uuid | `NOT NULL`, FK → `vehicles(id)`, **indexed** |
| service_type | text | `NOT NULL` |
| cost | numeric(12,2) | `NOT NULL`, `CHECK (cost >= 0)` — **the sole source of maintenance cost for analytics** |
| service_date | date | `NOT NULL` |
| status | `maintenance_status` | `NOT NULL` default `'active'`, **indexed**; active → vehicle In Shop (Rule 9) |
| created_at | timestamptz | `NOT NULL` default `now()` |
| updated_at | timestamptz | `NOT NULL` default `now()` |

#### `fuel_logs`

| Column | Type | Constraints / Notes |
|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` |
| vehicle_id | uuid | `NOT NULL`, FK → `vehicles(id)`, **indexed** |
| log_date | date | `NOT NULL` |
| liters | numeric(10,2) | `NOT NULL`, `CHECK (liters > 0)` |
| cost | numeric(12,2) | `NOT NULL`, `CHECK (cost >= 0)` — fuel cost |
| created_at | timestamptz | `NOT NULL` default `now()` |

#### `expenses`

| Column | Type | Constraints / Notes |
|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` |
| trip_id | uuid | nullable, FK → `trips(id)`, **indexed** |
| vehicle_id | uuid | `NOT NULL`, FK → `vehicles(id)`, **indexed** |
| toll | numeric(12,2) | `NOT NULL` default `0`, `CHECK (toll >= 0)` |
| other | numeric(12,2) | `NOT NULL` default `0`, `CHECK (other >= 0)` |
| maintenance_linked | numeric(12,2) | `NOT NULL` default `0` — **display-only mirror** of a linked maintenance cost, for the Fuel & Expenses table; **never summed into fleet Operational Cost** (that comes from `maintenance_logs`) |
| total | numeric(12,2) | `NOT NULL`; app computes `toll + other + maintenance_linked` |
| created_at | timestamptz | `NOT NULL` default `now()` |

> **Avoiding double-counting.** Maintenance cost lives authoritatively in `maintenance_logs`. The `expenses.maintenance_linked` column exists only so the Fuel & Expenses grid can show maintenance alongside tolls for a trip; every analytics/operational-cost query sums maintenance from `maintenance_logs` and **excludes** `maintenance_linked` to prevent counting the same rupee twice.

### Enums

- **`vehicle_status`** — `available`, `on_trip`, `in_shop`, `retired`
- **`driver_status`** — `available`, `on_trip`, `off_duty`, `suspended`
- **`trip_status`** — `draft`, `dispatched`, `completed`, `cancelled`
- **`maintenance_status`** — `active`, `closed` (surfaced in UI as *In Shop* / *Completed*)
- **`user_role`** — `fleet_manager`, `dispatcher`, `safety_officer`, `financial_analyst`
- **`license_category`** — `lmv`, `hmv`

### Representative Prisma Schema (`prisma/schema.prisma`)

Prisma's schema is compact enough to show the full model set. Enums map to native Postgres enums; `@@map`/`@map` keep DB names snake_case while the client stays camelCase; `@updatedAt` auto-bumps on write.

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]   // enables @prisma/adapter-neon
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums (native Postgres enums) ───────────────────────────────
enum UserRole         { fleet_manager  dispatcher  safety_officer  financial_analyst }
enum VehicleStatus    { available  on_trip  in_shop  retired }
enum DriverStatus     { available  on_trip  off_duty  suspended }
enum TripStatus       { draft  dispatched  completed  cancelled }
enum MaintenanceStatus{ active  closed }
enum LicenseCategory  { lmv  hmv }

// ─── Vehicles ────────────────────────────────────────────────────
model Vehicle {
  id                 String        @id @default(uuid()) @db.Uuid
  registrationNumber String        @unique @map("registration_number")   // Rule 1
  nameModel          String        @map("name_model")
  type               String
  maxLoadCapacity    Decimal       @map("max_load_capacity") @db.Decimal(12, 2)
  odometer           Int           @default(0)
  acquisitionCost    Decimal       @map("acquisition_cost") @db.Decimal(12, 2)
  status             VehicleStatus @default(available)
  region             String
  deletedAt          DateTime?     @map("deleted_at") @db.Timestamptz
  createdAt          DateTime      @default(now()) @map("created_at") @db.Timestamptz
  updatedAt          DateTime      @updatedAt @map("updated_at") @db.Timestamptz

  trips           Trip[]
  maintenanceLogs MaintenanceLog[]
  fuelLogs        FuelLog[]
  expenses        Expense[]

  @@index([status])
  @@map("vehicles")
}

// ─── Trips ───────────────────────────────────────────────────────
model Trip {
  id              String     @id @default(uuid()) @db.Uuid
  tripCode        String     @unique @map("trip_code")            // TR001…
  source          String
  destination     String
  vehicleId       String     @map("vehicle_id") @db.Uuid
  driverId        String     @map("driver_id") @db.Uuid
  createdBy       String?    @map("created_by") @db.Uuid
  cargoWeight     Decimal    @map("cargo_weight") @db.Decimal(12, 2)
  plannedDistance Decimal    @map("planned_distance") @db.Decimal(10, 2)
  status          TripStatus @default(draft)
  startOdometer   Int?       @map("start_odometer")               // snapshot at dispatch
  finalOdometer   Int?       @map("final_odometer")
  fuelConsumed    Decimal?   @map("fuel_consumed") @db.Decimal(10, 2)
  revenue         Decimal?   @db.Decimal(12, 2)
  eta             DateTime?  @db.Timestamptz
  completedAt     DateTime?  @map("completed_at") @db.Timestamptz  // authoritative for Monthly Revenue
  deletedAt       DateTime?  @map("deleted_at") @db.Timestamptz
  createdAt       DateTime   @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime   @updatedAt @map("updated_at") @db.Timestamptz

  vehicle  Vehicle   @relation(fields: [vehicleId], references: [id])
  driver   Driver    @relation(fields: [driverId], references: [id])
  creator  User?     @relation(fields: [createdBy], references: [id])
  expenses Expense[]

  @@index([vehicleId])
  @@index([driverId])
  @@index([status])
  @@map("trips")
}
```

> The remaining models — `User`, `Driver`, `MaintenanceLog`, `FuelLog`, `Expense` — follow the identical pattern (fields from the per-table breakdown above, `@map`/`@@map` for snake_case, `@relation` back-references, `@@index` on FKs + status). The **non-negative `CHECK` constraints** (`max_load_capacity > 0`, `cost >= 0`, `safety_score BETWEEN 0 AND 100`, `final_odometer >= start_odometer`, etc.) and the **partial unique index for Rule 4** (`@@unique` won't express a `WHERE status = 'dispatched'` filter) are appended by hand to the generated migration SQL, e.g.:

```sql
-- inside prisma/migrations/<ts>_init/migration.sql (hand-added below Prisma's output)
ALTER TABLE "vehicles" ADD CONSTRAINT chk_capacity CHECK ("max_load_capacity" > 0);
ALTER TABLE "trips"    ADD CONSTRAINT chk_odo       CHECK ("final_odometer" >= "start_odometer");
-- Rule 4: a vehicle/driver can be on only ONE dispatched trip at a time
CREATE UNIQUE INDEX uniq_active_vehicle ON "trips" ("vehicle_id") WHERE "status" = 'dispatched';
CREATE UNIQUE INDEX uniq_active_driver  ON "trips" ("driver_id")  WHERE "status" = 'dispatched';
```

### Derived & Computed Values

The analytics metrics are **derived, not stored** — persisting them invites drift the moment a fuel log or expense is edited. Our stance:

- **Compute in the app/query layer for the demo.** Fleet Utilization %, Fuel Efficiency (`Σ(final_odometer − start_odometer) / Σ fuel_consumed`), Operational Cost (`Σ fuel_logs.cost + Σ maintenance_logs.cost`), and Vehicle ROI (`(revenue − (maintenance + fuel)) / acquisition_cost`) are all straightforward aggregate SQL joined across `trips`, `fuel_logs`, and `maintenance_logs`. Running them as parameterized queries keeps numbers exact and always fresh, and CSV export just serializes the same result set.
- **ROI is stored/returned as a ratio** (e.g. `0.142`) and multiplied by 100 **only at presentation** ("14.2%"). One definition, formatted once.
- **Why not a stored column or trigger:** triggers to maintain rollups would fight our append-only log tables and add failure modes in an 8-hour build.
- **Optional optimization:** if the Analytics screen feels heavy, wrap the per-vehicle rollup in a **`vehicle_metrics` materialized view** (`total_fuel`, `total_maintenance`, `total_revenue`, `roi`) refreshed on trip completion / after each analytics load. This gives the "Top Costliest Vehicles" and ROI cards a single fast read without denormalizing the source tables. A representative query:

```sql
CREATE MATERIALIZED VIEW vehicle_metrics AS
SELECT v.id AS vehicle_id,
       v.registration_number,
       COALESCE(f.total_fuel, 0)          AS total_fuel,
       COALESCE(m.total_maint, 0)         AS total_maintenance,
       COALESCE(t.total_revenue, 0)       AS total_revenue,
       (COALESCE(t.total_revenue,0) - (COALESCE(m.total_maint,0) + COALESCE(f.total_fuel,0)))
         / NULLIF(v.acquisition_cost, 0)  AS roi   -- ratio; ×100 at display
FROM vehicles v
LEFT JOIN (SELECT vehicle_id, SUM(cost) total_fuel  FROM fuel_logs        GROUP BY vehicle_id) f ON f.vehicle_id = v.id
LEFT JOIN (SELECT vehicle_id, SUM(cost) total_maint FROM maintenance_logs GROUP BY vehicle_id) m ON m.vehicle_id = v.id
LEFT JOIN (SELECT vehicle_id, SUM(revenue) total_revenue FROM trips WHERE status = 'completed' GROUP BY vehicle_id) t ON t.vehicle_id = v.id;
```

### Seed Data Strategy

We ship a deterministic `seed.ts` (idempotent, keyed on unique columns) that reproduces the wireframe rows exactly so every screen renders populated on first run. **Canonical seed volume: 4 role users, 6 vehicles, 5 drivers, 4 trips**, plus supporting logs/expenses.

- **Users (one per role):** `manager@transitops.dev` (Fleet Manager), `raven@transitops.dev` — "Raven K." (Dispatcher, matches the top-bar chip), `safety@transitops.dev` (Safety Officer), `finance@transitops.dev` (Financial Analyst). Shared demo password, `is_active = true`, `failed_login_attempts = 0`.
- **Vehicles (6):** the wireframe core `VAN-05`, `TRUCK-11`, `MINI-03`, `VAN-09` plus two extras for richer analytics — mixed types (Van/Truck/Mini) and regions, with statuses spread across `available`, `on_trip`, `in_shop`, `retired` so the Dashboard status bar chart and dispatch-filtering rules (Rules 2/6) are visible. Registration numbers stored **uppercase** (`VAN-05`).
- **Drivers (5):** **Alex**, **John**, **Priya**, **Suresh** plus one extra — mixed `lmv`/`hmv` categories, varied `safety_score`/`trip_completion`, and at least one with an **expired `license_expiry_date`** (shown orange, gated by Rule 3) plus one `suspended` to demonstrate assignment blocking.
- **Trips (4):** `TR001`, `TR004`, `TR006` plus one completed trip — spanning `dispatched`, `completed`, `draft`/`cancelled` so the Trip Dispatcher live board, lifecycle stepper, and Recent Trips table all show non-empty pills. The `completed` trip carries `start_odometer`, `final_odometer`, `fuel_consumed`, `revenue`, and `completed_at` so Analytics (Fuel Efficiency, ROI, Monthly Revenue) computes real numbers.
- **Logs & expenses:** a few `fuel_logs` and `maintenance_logs` per vehicle (one `active` maintenance row to force a vehicle into `in_shop`), and `expenses` rows linked to the completed trip with `toll`/`other`/`maintenance_linked`/`total` populated so the Fuel & Expenses "Total Operational Cost" highlight and the Top Costliest Vehicles chart have data.

Seeding runs inside a transaction after migrations; re-running upserts by `registration_number` / `license_number` / `trip_code`, so the demo DB can be reset safely between runs.

---

## Design System — Neo-Brutalist × Comic Sans

> The visual soul of TransitOps. Honest, loud, and structurally proud — a control room that grins back at you.

### 1. Design Philosophy

TransitOps wears its structure on the outside: every surface is a real, tangible block with a **thick black border** and a **hard offset shadow** (zero blur, zero apology), so the interface reads like stacked physical cards you could pick up off the screen. We reject rounded-corner mush and soft gradients in favor of **high-contrast slabs, flat fills, and honest edges** — nothing pretends to be glass, nothing floats ambiguously. The wireframes' dark cockpit and hot-orange accent stay intact, but we push them into playful confidence: chunky Comic-style type that says *this is fun to operate*, sitting on top of a rigorous grid that says *this is serious infrastructure*. The result is neo-brutalism with a wink — blocky, legible, tactile, and unmistakably ours.

**Principles**
- **Honest structure** — borders and shadows describe real hierarchy, not decoration.
- **Hard light** — shadows are solid black offsets (`Xpx Ypx 0`), never blurred.
- **Flat color, loud contrast** — fills are solid; text is near-black `#0B0B0B` or paper-white.
- **Tactile feedback** — everything pressable physically *moves* when you press it.
- **Playful, not sloppy** — Comic Neue for warmth, mono for numbers so data never gets goofy.

---

### 2. Typography

Two families do all the work: a **comic display/body face** for personality, and a **monospace** for anything numeric (KPIs, odometers, costs, trip codes) so dashboards stay crisp and columns align.

```css
/* Comic — display + body */
--font-comic: 'Comic Neue', 'Comic Sans MS', 'Chalkboard SE',
              'Segoe Print', system-ui, sans-serif;

/* Mono — numbers, KPIs, codes, tabular data */
--font-mono:  'JetBrains Mono', 'IBM Plex Mono', ui-monospace,
              'SF Mono', 'Cascadia Code', Menlo, monospace;
```

> **Load:** `Comic Neue` (400/700) and `JetBrains Mono` (400/500/700) from Fontsource/self-host. Comic Sans MS is the graceful fallback so the vibe survives even offline.

**Type scale** — tight, chunky, high weight. Line-heights are snug to reinforce the blocky feel.

| Token | Font | Size / Line | Weight | Tracking | Use |
|---|---|---|---|---|---|
| `display` | Comic | 44px / 46px | 700 | -0.5px | Auth hero, big page titles, empty states |
| `h1` | Comic | 30px / 34px | 700 | -0.25px | Screen titles ("Trip Dispatcher") |
| `h2` | Comic | 22px / 26px | 700 | 0 | Card headers, section titles |
| `h3` | Comic | 18px / 22px | 700 | 0 | Sub-sections, form group labels |
| `body` | Comic | 15px / 22px | 400 | 0 | Paragraphs, descriptions, table cells |
| `body-strong` | Comic | 15px / 22px | 700 | 0 | Emphasis, active nav, button labels |
| `label` | Mono | 11px / 14px | 700 | **+1px, UPPERCASE** | Field labels, table headers, pill text, KPI captions |
| `mono-kpi` | Mono | 40px / 40px | 700 | -1px | The big KPI numbers |
| `mono-data` | Mono | 14px / 20px | 500 | 0 | Costs, odometer, km/l, trip codes (TR001) in tables |

**Rules**
- Numbers **never** render in Comic — always `--font-mono`, `font-variant-numeric: tabular-nums`.
- Labels are the connective tissue: mono, uppercase, letter-spaced — they frame every block.
- Body copy caps at ~70ch for readability even on wide analytics screens.

---

### 3. Color Tokens

Two full themes ship: **Dark** (the wireframe cockpit, default) and a **Light neo-brutalist** variant (paper + ink). Status colors are shared across both and map 1:1 to the pills in the brief.

#### Core palette

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#0B0B0B` | True black — all borders, shadows, primary text |
| `--paper` | `#FAF7F0` | Light theme background (warm off-white) |
| `--paper-2` | `#FFFFFF` | Light theme card surface |
| `--panel` | `#15161B` | Dark theme background |
| `--panel-2` | `#1E2029` | Dark theme card surface |
| `--panel-3` | `#2A2D38` | Dark theme raised/zebra rows |
| `--brand` | `#E8811A` | **Brand orange** — primary buttons, active nav, focus accents |
| `--brand-hi` | `#F59E0B` | Brighter orange — highlights, hovers |
| `--brand-ink` | `#0B0B0B` | Text on orange (black, always) |
| `--text` | `#0B0B0B` / `#F4F1E9` | Body text (light / dark) |
| `--text-dim` | `#6B6B6B` / `#9A9EAD` | Secondary text, captions |
| `--line` | `#0B0B0B` | Border color (both themes — black stays black) |

#### Status colors (pills — shared both themes)

| Token | Hex | Mapped statuses |
|---|---|---|
| `--st-green` | `#22C55E` | Available · Completed |
| `--st-blue` | `#3B82F6` | On Trip · Dispatched |
| `--st-orange` | `#F59E0B` | In Shop · Suspended |
| `--st-redpink` | `#F472B6` | Retired *(soft red-pink)* |
| `--st-red` | `#EF4444` | Cancelled |
| `--st-grey` | `#9CA3AF` | Off Duty · Draft |

> **Pill construction is identical for all:** black border, **solid status fill**, **black text**. The color carries meaning; the black keeps it brutalist and legible on any background.

#### Brutalist "pop" accents (charts, badges, callouts)

| Token | Hex | Use |
|---|---|---|
| `--pop-blue` | `#2563EB` | Electric blue — chart series, links |
| `--pop-lime` | `#A3E635` | Lime — positive deltas, "up" ROI |
| `--pop-violet` | `#8B5CF6` | Violet — secondary chart series, accents |
| `--pop-yellow` | `#FDE047` | Highlight sticker / "NEW" flags |

---

### 4. Core Brutalist Primitives

The whole system is three moves: **thick black border**, **hard offset shadow**, **press-to-move**.

```css
:root {
  --bd:        2px;           /* default border */
  --bd-lg:     3px;           /* emphasis: cards, primary buttons */
  --radius:    4px;           /* tiny — or 0px for hard blocks */
  --shadow:    4px 4px 0 var(--ink);
  --shadow-lg: 6px 6px 0 var(--ink);
  --shadow-sm: 2px 2px 0 var(--ink);
  --ease:      cubic-bezier(.2,.9,.25,1);   /* snappy, minimal overshoot */
}

/* ── Reusable card ─────────────────────────── */
.brutal-card {
  background: var(--panel-2);
  border: var(--bd-lg) solid var(--ink);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 16px;
}

/* ── Reusable button (the "press") ─────────── */
.brutal-btn {
  font-family: var(--font-comic);
  font-weight: 700;
  font-size: 15px;
  color: var(--brand-ink);
  background: var(--brand);
  border: var(--bd-lg) solid var(--ink);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 10px 18px;
  cursor: pointer;
  transition: transform .08s var(--ease), box-shadow .08s var(--ease);
}
.brutal-btn:hover  { transform: translate(-1px,-1px); box-shadow: var(--shadow-lg); }
.brutal-btn:active { transform: translate(4px,4px);   box-shadow: 0 0 0 var(--ink); } /* slams flat */
.brutal-btn:focus-visible { outline: 3px solid var(--pop-blue); outline-offset: 3px; }
.brutal-btn:disabled {
  background: var(--st-grey); color: #4B4B4B;
  box-shadow: none; transform: none; cursor: not-allowed;
  border-style: dashed;
}
```

**The press interaction** is the signature: hover lifts the block up-left (shadow grows), active *slams it into the page* (shadow → 0, element translates into where the shadow was). It feels like a real physical button every single time.

---

### 5. Tailwind v4 Theme Snippet

Tailwind v4, CSS-first config via `@theme`. Drop into `app.css`:

```css
@import "tailwindcss";

@theme {
  /* fonts */
  --font-comic: "Comic Neue", "Comic Sans MS", "Chalkboard SE", system-ui, sans-serif;
  --font-mono:  "JetBrains Mono", "IBM Plex Mono", ui-monospace, Menlo, monospace;

  /* core */
  --color-ink:      #0B0B0B;
  --color-paper:    #FAF7F0;
  --color-paper-2:  #FFFFFF;
  --color-panel:    #15161B;
  --color-panel-2:  #1E2029;
  --color-panel-3:  #2A2D38;

  /* brand */
  --color-brand:    #E8811A;
  --color-brand-hi: #F59E0B;

  /* status */
  --color-green:   #22C55E;   /* Available / Completed */
  --color-blue:    #3B82F6;   /* On Trip / Dispatched */
  --color-orange:  #F59E0B;   /* In Shop / Suspended */
  --color-redpink: #F472B6;   /* Retired */
  --color-red:     #EF4444;   /* Cancelled */
  --color-grey:    #9CA3AF;   /* Off Duty / Draft */

  /* pop */
  --color-pop-blue:   #2563EB;
  --color-pop-lime:   #A3E635;
  --color-pop-violet: #8B5CF6;
  --color-pop-yellow: #FDE047;

  /* brutalist shadows */
  --shadow-brutal:    4px 4px 0 #0B0B0B;
  --shadow-brutal-lg: 6px 6px 0 #0B0B0B;
  --shadow-brutal-sm: 2px 2px 0 #0B0B0B;

  /* radius + border */
  --radius-brutal: 4px;
}

/* Dark mode = default cockpit; .light flips to paper */
:root        { --bg: var(--color-panel);  --surface: var(--color-panel-2); --fg: #F4F1E9; }
.light       { --bg: var(--color-paper);  --surface: var(--color-paper-2); --fg: #0B0B0B; }
```

Usage: `class="border-[3px] border-ink shadow-brutal rounded-[4px] bg-brand font-comic"`.

---

### 6. Component Specs

#### Buttons
- **Primary** — `bg-brand` (orange), black text, `border-[3px] border-ink`, `shadow-brutal`, press interaction. Used for Sign In, Dispatch, Save, + Add.
- **Secondary** — `bg-surface`, black text/white text (theme), same border + shadow. For Cancel, Close, filters.
- **Danger** — `bg-red` white text (Cancel Trip, Retire Vehicle).
- **Disabled** — grey fill, **dashed** border, no shadow, no movement (e.g. Dispatch when capacity exceeded).
- Sizes: `sm` 8/14px, `md` 10/18px, `lg` 14/24px.

#### Status Pill
```
border:2px solid #0B0B0B · radius:4px · padding:2px 8px
font: mono 11px/700 UPPERCASE · fill = status color · text = #0B0B0B
```
One component, `status` prop switches fill: green/blue/orange/redpink/red/grey. Optional 6px black-bordered dot before the label.

#### KPI Card
The dashboard hero. Thick-bordered block with a **colored top-strip** (matches wireframe's colored top border) and a hard shadow.
- `border-[3px] border-ink`, `shadow-brutal`, `rounded-[4px]`, `bg-surface`.
- **Top strip:** full-width bar, `height:8px`, colored by metric (blue/green/orange), sits flush under the top border.
- **Caption:** mono label, uppercase, dim. **Value:** `mono-kpi` 40px black. **Delta:** small pill (lime ▲ / red ▼).

#### Data Table
- Wrapper: `border-[3px] border-ink shadow-brutal rounded-[4px]`, overflow-clip.
- **Header:** `bg-ink` (black) with paper text, mono uppercase labels, **4px black bottom rule**.
- **Rows:** 1px black dividers; optional zebra (`panel-3` / transparent). Row hover → `bg-brand/10`.
- Sortable headers show a chunky ▲/▼ glyph. Numeric columns use `mono-data`, right-aligned, tabular.

#### Inputs / Select
- `border-[2px] border-ink`, `rounded-[4px]`, `bg-surface`, padding 10/12px, comic font.
- **Focus = inset brutalist:** `box-shadow: inset 3px 3px 0 var(--brand)` + `border-color:brand` (no glow). It looks *stamped in*.
- Error state: `border-red`, `inset 3px 3px 0 #EF4444`, mono error text below.
- Select uses a black-bordered chevron chip on the right.

#### Sidebar Nav
- Fixed left rail, `bg-ink` (black) full-height, `border-r-[3px] border-ink`.
- Items: comic 15px, icon + label. **Active item = orange fill block** (`bg-brand`, black text) with a `2px` black border and `shadow-brutal-sm` — it juts out of the rail.
- Hover: `bg-panel-3`, translate-x 2px. Role-gated items (per RBAC) render disabled/hidden.

#### Modal
- Backdrop: `bg-ink/60` (flat, no blur). Panel: `bg-surface`, `border-[3px] border-ink`, `shadow-brutal-lg`, `rounded-[4px]`, max-width 520px.
- Header bar `bg-brand` black text with a black-bordered ✕ close chip. Enters with a 120ms scale-from-98% + slam.

#### Toast
- Bottom-right stack. `border-[3px] border-ink`, `shadow-brutal`, `rounded-[4px]`.
- Left `10px` colored strip = intent (green success / red error / orange warn). Auto-dismiss 4s, slides in from right, no fade-mush.

#### Stepper (Trip lifecycle)
`Draft → Dispatched → Completed → Cancelled` as bordered dots joined by a **thick black rule**.
- Dot: `28px`, `border-[3px] border-ink`, `rounded-[4px]` (square-ish). States: **done** = filled status color, **active** = orange fill + `shadow-brutal-sm`, **upcoming** = surface fill. Cancelled branch turns the rule red.
- Label under each dot in mono uppercase.

#### Charts (restyle)
Flat, blocky, brutalist — override Recharts defaults.
- **Bars:** solid fill (`pop-blue` / `brand` / `pop-violet`), **2px black outline**, **hard 4px black offset shadow** per bar. No gradients, no rounded caps.
- **Axes/grid:** black axis lines 2px; grid = sparse dashed grey. Ticks in mono.
- **Vehicle Status** (Dashboard) & **Top Costliest Vehicles** (Analytics): horizontal bars colored by status token. **Monthly Revenue:** vertical bars in brand orange. Tooltips are mini brutal-cards.

---

### 7. Layout — App Shell

```
┌───────────┬──────────────────────────────────────────────┐
│           │  TOPBAR  [🔍 search........]      Raven K. ▸  │  56px, border-b 3px
│  SIDEBAR  ├──────────────────────────────────────────────┤
│  220px    │                                              │
│  fixed    │   CONTENT GRID (max-w 1280, pad 24px)        │
│  bg:ink   │   ┌──────┐ ┌──────┐ ┌──────┐  KPI row        │
│           │   └──────┘ └──────┘ └──────┘  (gap 16)       │
│  Dashboard│   ┌───────────────────────────┐              │
│  Fleet    │   │  table / board / chart     │             │
│  Drivers  │   └───────────────────────────┘              │
│  ...      │                                              │
└───────────┴──────────────────────────────────────────────┘
```

- **Sidebar:** fixed left, `220px`, black, `border-r-[3px]`. Logo block up top (orange square + "TransitOps" comic wordmark).
- **Top bar:** `56px`, `border-b-[3px] border-ink`, contains a bordered search input (inset-focus) + user chip (`bg-surface`, black border, avatar square + "Raven K. / Dispatcher RK", dropdown chevron).
- **Content grid:** 12-col, `gap:16px`, page padding `24px`, max-width `1280px`. KPI cards auto-fit `minmax(200px,1fr)`.

**Spacing scale** (4px base): `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`. Card padding `16`, section gap `24`, page pad `24`.

**Responsive**

| Breakpoint | Behavior |
|---|---|
| `≥1024px` | Full sidebar (220px) + multi-col grids. |
| `768–1023px` | Sidebar **collapses to 64px icon rail** (labels hidden, active still orange). KPI grid → 2-col. |
| `<768px` | Sidebar becomes a **slide-in drawer** (☰ in top bar, backdrop `ink/60`). KPI → 1-col; tables scroll-x inside their bordered wrapper; Trip Dispatcher stacks form-over-board. |

---

### 8. Style Mock — Feel It

```
   KPI CARD                              BUTTONS
 ┌██████████████████┐ ← 8px orange     ┌─────────────────┐
 ┃ FLEET UTILIZATION┃    top-strip     ┃   DISPATCH →    ┃  primary (orange)
 ┃                  ┃                  └─────────────────┘▓  ▓ = 4px black shadow
 ┃    78.4%         ┃ ← mono-kpi 40    ┌─────────────────┐
 ┃    ▲ 3.1%        ┃ ← lime delta     ┃     Cancel      ┃  secondary
 ┗━━━━━━━━━━━━━━━━━━┛▓                 └─────────────────┘▓
   3px black border                    ┌ ─ ─ ─ ─ ─ ─ ─ ─ ┐
   4px hard shadow ▓                   │  DISPATCH →     │   disabled (dashed,
                                       └ ─ ─ ─ ─ ─ ─ ─ ─ ┘   grey, no shadow)

  STATUS PILLS:  [●AVAILABLE](grn) [●ON TRIP](blu) [●IN SHOP](org) [●RETIRED](pnk)
```

---

### 9. Micro-Interactions & Motion

Motion is **chunky and snappy** — short durations, near-linear snap, no floaty easing.

- **Timing:** `80ms` presses, `120ms` panels/toasts, `160ms` drawer. Nothing over `200ms`.
- **Easing:** `cubic-bezier(.2,.9,.25,1)` — a quick move with the faintest settle. No `ease-in-out` mush, no bounce.
- **Press:** hover lifts `-1px,-1px` (shadow grows); active slams `+4px,+4px` to shadow-zero. This is the heartbeat of the UI.
- **Shadows animate, blur never does** — only `transform` + `box-shadow` offset change (GPU-cheap, always sharp).
- **Enter/exit:** panels scale from `98%` + slam to shadow; toasts slide from right edge; drawer slides X. Fades only for backdrops.
- **Feedback:** successful Dispatch/Save → target card does a single `120ms` translate-nudge + green toast. Validation error → input shakes `±3px` twice (`120ms`), border flips red.
- **Loading:** skeleton blocks are flat grey rectangles with black borders (no shimmer) — brutalism even while waiting.
- **Respect `prefers-reduced-motion`:** drop transforms, keep instant state changes and shadows.

> Net effect: a dark, orange-lit ops cockpit built from bordered blocks that physically respond to touch — serious data in Comic Neue's friendly hand, numbers locked in crisp mono. Brutal, bright, and genuinely fun to fly.

---

## Screen-by-Screen Specification

This section maps each of the 9 wireframes to concrete Next.js App Router routes, RBAC gating, brutalist design-system components (`<BrutalCard>`, `<BrutalButton>`, `<BrutalTable>`, `<StatusPill>`, `<BrutalInput>`, `<BrutalSelect>`, `<BrutalModal>`, `<KpiCard>`, `<Stepper>`, `<BarChart>`, `<SidebarNav>`, `<TopBar>`), data reads/writes, and per-screen behavior. Visual styling is defined in the Design System section; here we cover **structure, behavior, and data** only.

### Route Table

| Route | Screen | Roles (access) | Primary actions |
|---|---|---|---|
| `/login` | Auth | Public (all roles authenticate) | Sign in, forgot password |
| `/dashboard` | Dashboard | All authenticated roles | Filter KPIs, view recent trips |
| `/fleet` | Vehicle Registry | Fleet Mgr (CRUD); Dispatcher, Financial (view) | Add/edit/retire vehicle |
| `/drivers` | Drivers & Safety | Safety Officer, Fleet Mgr (CRUD) | Add driver, toggle status |
| `/trips` | Trip Dispatcher | Dispatcher (CRUD); Safety Officer (view) | Create/dispatch/complete/cancel trip |
| `/maintenance` | Maintenance | Fleet Mgr (CRUD) | Log service, close record |
| `/expenses` | Fuel & Expenses | Financial Analyst (CRUD) | Log fuel, add expense |
| `/analytics` | Analytics | Fleet Mgr, Financial Analyst | View KPIs, export CSV/PDF |
| `/settings` | Settings & RBAC | Fleet Mgr (General edit); all roles (RBAC matrix read-only) | Save general config |

> Gating is enforced in `middleware.ts` (route-level) **and** re-checked in every server action (mutation-level). Unauthorized navigation redirects to `/dashboard` with a brutalist toast; unauthorized actions throw and surface an inline error card.

---

### 0. Auth — `/login`

- **Route:** `/login` (public; authenticated users hitting it redirect to `/dashboard`).
- **Access:** Public. All four roles use the same form; the selected **Role dropdown** must match the user's assigned role or sign-in fails.
- **Key components:** Split layout — light `<BrandPanel>` (logo, "One login, four roles"), dark `<BrutalCard>` form with `<BrutalInput>` (Email, Password), `<BrutalSelect>` (Role), `<BrutalCheckbox>` (Remember me), `<BrutalButton variant="orange">` (Sign In), `<TextLink>` (Forgot password), and an `<AccessLegend>` listing each role's scope.
- **Data read:** `getUserByEmail(email)` for credential + role verification.
- **Data write:** `signIn({ email, password, role, remember })` server action → sets session cookie (30-day if Remember me); `incrementFailedAttempts(email)` / `resetFailedAttempts(email)`.
- **Interactions & validations:** Email format + required fields client-side; role in dropdown must equal stored role; password verified server-side. On success → `/dashboard`.
- **Empty/error/loading:** Error card "Invalid credentials. Account locked after 5 failed attempts." **Lockout after 5 failed attempts** (counter persisted per account; locked accounts show a distinct "Account locked — contact admin" state). Submit button shows loading spinner + disabled state; no field values leaked on error.

---

### 1. Dashboard — `/dashboard`

- **Route:** `/dashboard`.
- **Access:** All authenticated roles (read-only overview; cards deep-link only to screens the role can access).
- **Key components:** `<FilterBar>` with `<BrutalSelect>` × 3 (Vehicle Type, Status, Region); 7 `<KpiCard>` with colored top borders (blue/green/orange); `<BrutalTable>` Recent Trips (Trip, Vehicle, Driver, `<StatusPill>`, ETA); horizontal `<BarChart>` Vehicle Status (Available/On Trip/In Shop/Retired).
- **Data read:** `getDashboardKpis(filters)` → Active Vehicles, Available Vehicles, Vehicles in Maintenance, Active Trips, Pending Trips, Drivers On Duty, Fleet Utilization %; `getRecentTrips(filters)`; `getVehicleStatusCounts(filters)`.
- **Data write:** None (dashboard is read-only).
- **Interactions & validations:** Filters are additive and update all KPIs, table, and chart via server-side query params (URL-synced for shareable state). Fleet Utilization % = (On Trip vehicles ÷ non-Retired vehicles) × 100.
- **Empty/error/loading:** Skeleton KPI cards + shimmer table rows on load. Empty Recent Trips → "No trips yet — dispatch one from Trips." Query error → inline `<ErrorCard>` with retry.

---

### 2. Vehicle Registry — `/fleet`

- **Route:** `/fleet`.
- **Access:** **Fleet Manager** full CRUD; **Dispatcher** and **Financial Analyst** view-only (Add/Edit controls hidden); Safety Officer no access.
- **Key components:** `<FilterBar>` (Type, Status selects + `<BrutalInput>` search reg no), `<BrutalButton>` "+ Add Vehicle" (Fleet Mgr only), `<BrutalTable>` (Reg No, Name/Model, Type, Capacity, Odometer, Acq Cost, `<StatusPill>`), `<BrutalModal>` add/edit form, rule footnote text.
- **Data read:** `getVehicles(filters)` with type/status/search; `getVehicleById(id)` for edit.
- **Data write:** `createVehicle(data)`, `updateVehicle(id, data)`, `retireVehicle(id)`.
- **Interactions & validations:** **registration_number UNIQUE** — server rejects duplicates with inline field error (Rule 1). Status defaults to `Available` on create. Retiring sets status `Retired` (excluded from dispatch, Rule 2). Capacity/odometer/cost numeric ≥ 0. Sort by any column.
- **Empty/error/loading:** Empty registry → "No vehicles registered — add your first." Duplicate reg no → red field highlight. Modal save shows button spinner; optimistic row insert with rollback on failure.

---

### 3. Drivers & Safety — `/drivers`

- **Route:** `/drivers`.
- **Access:** **Safety Officer** and **Fleet Manager** full CRUD; all others no access.
- **Key components:** `<BrutalButton>` "+ Add Driver", `<BrutalTable>` (Driver, License No, Category LMV/HMV, Expiry, Contact, Trip Compl %, Safety `<StatusPill>`, Status `<StatusPill>`), inline status toggle `<BrutalButton>` group, `<BrutalModal>` add/edit, rule footnote.
- **Data read:** `getDrivers(filters)`, `getDriverById(id)`.
- **Data write:** `createDriver(data)`, `updateDriver(id, data)`, `setDriverStatus(id, status)` (Available / Off Duty / Suspended — never manually to On Trip).
- **Interactions & validations:** **Expired license** rows highlighted orange (expiry < today) and flagged; expired-license OR Suspended drivers are **blocked from trip assignment** (Rule 3) — enforced here as a visual flag and in the dispatcher as exclusion. Status toggle cannot move a driver who is currently `On Trip` (guarded). Safety score 0–100; license_expiry_date required.
- **Empty/error/loading:** Empty → "No drivers on file." Expired-license banner counts drivers needing renewal (feeds email-reminder bonus). Toggle shows optimistic pill update with revert on error.

---

### 4. Trip Dispatcher — `/trips`

- **Route:** `/trips`.
- **Access:** **Dispatcher** full CRUD; **Safety Officer** view-only (Live Board visible, Create form disabled).
- **Key components:** Left — `<Stepper>` lifecycle (Draft→Dispatched→Completed→Cancelled) + Create Trip `<BrutalCard>` form (`<BrutalInput>` Source, Destination, Cargo Weight, Planned Distance; `<BrutalSelect>` Vehicle available-only, Driver available-only) + live `<ValidationBox>`; right — `<LiveBoard>` of trip `<BrutalCard>`s with `<StatusPill>` + notes.
- **Data read:** `getAvailableVehicles()` (status = Available only — excludes On Trip/In Shop/Retired, Rules 2 & 4); `getAvailableDrivers()` (status = Available AND license not expired — excludes Suspended/On Trip/expired, Rules 3 & 4); `getTrips()` for Live Board.
- **Data write:** `createTrip(data)` (Draft), `dispatchTrip(id)`, `completeTrip(id, {final_odometer, fuel_consumed, revenue, expenses})`, `cancelTrip(id)`.
- **Interactions & validations:**
  - Vehicle & Driver dropdowns are **available-only** (populated from filtered queries).
  - **Live cargo-vs-capacity check:** as Cargo Weight / Vehicle change, compare `cargo_weight` vs selected vehicle `max_load_capacity`; if exceeded, `<ValidationBox>` shows red "Cargo exceeds capacity by N kg" and the **Dispatch button is disabled** (Rule 5).
  - **Dispatch** → sets trip `Dispatched`, snapshots `start_odometer` from the vehicle, and flips vehicle **and** driver → `On Trip` (Rule 6); both drop out of future dropdowns.
  - **Complete** flow: enter final odometer → create fuel log → capture expenses/revenue → vehicle **and** driver back to `Available` (Rule 7); auto-generates `trip_code` (TR001…) on create.
  - **Cancel** a Dispatched trip → restores vehicle **and** driver to `Available` (Rule 8).
- **Empty/error/loading:** Empty Live Board → "No active trips." If no available vehicles/drivers, dropdowns show "None available" and Create is disabled with a hint. Server re-validates all rules atomically (a race that consumes a vehicle mid-form returns a conflict error card).

---

### 5. Maintenance — `/maintenance`

- **Route:** `/maintenance`.
- **Access:** **Fleet Manager** full CRUD; others no access.
- **Key components:** Left — Log Service Record `<BrutalCard>` form (`<BrutalSelect>` Vehicle, `<BrutalInput>` Service Type, Cost, Date; `<BrutalSelect>` Status Active/Closed) + `<BrutalButton>` Save + status-transition `<Diagram>`; right — `<BrutalTable>` Service Log (Vehicle, Service, Cost, `<StatusPill>` In Shop/Completed).
- **Data read:** `getVehiclesForMaintenance()` (excludes Retired + On Trip), `getMaintenanceLogs()`.
- **Data write:** `createMaintenanceLog(data)`, `closeMaintenanceLog(id)`.
- **Interactions & validations:** Saving an **Active** record flips the vehicle to **In Shop** (Rule 9) — reflected immediately in Fleet and dispatch exclusion. **Closing** a record returns the vehicle to `Available` **unless Retired** (Rule 10), and **only when no other Active log remains** for that vehicle. Cost ≥ 0; date defaults to today. Status pill maps Active→"In Shop" (orange), Closed→"Completed" (green).
- **Empty/error/loading:** Empty log → "No service records." Opening maintenance on an On Trip vehicle is rejected (`409`). A vehicle may hold multiple Active logs; the vehicle returns to Available only when the **last** open log is closed (guarded server-side).

---

### 6. Fuel & Expenses — `/expenses`

- **Route:** `/expenses`.
- **Access:** **Financial Analyst** full CRUD; others no access.
- **Key components:** `<BrutalTable>` Fuel Logs (Vehicle, Date, Liters, Fuel Cost) + `<BrutalButton>` "+ Log Fuel" / "+ Add Expense"; `<BrutalTable>` Other Expenses (Trip, Vehicle, Toll, Other, Maint linked, Total); `<TotalBanner>` Total Operational Cost (orange highlight); `<BrutalModal>` forms.
- **Data read:** `getFuelLogs(filters)`, `getExpenses(filters)`, `getOperationalCost()` (Σ fuel_logs.cost + Σ maintenance_logs.cost).
- **Data write:** `createFuelLog(data)`, `createExpense(data)`.
- **Interactions & validations:** Vehicle/Trip selects from existing records. Per-row expense `total` = toll + other + maintenance_linked (the last is a display mirror of a linked maintenance record). **Total Operational Cost = Σ Fuel + Σ Maintenance** — sourced from `fuel_logs` and `maintenance_logs` (**not** from `expenses.maintenance_linked`, to avoid double-counting) — recomputed and shown in the orange banner on every write. Liters/costs numeric > 0. Fuel logs auto-created by trip completion also appear here (read-only origin tag).
- **Empty/error/loading:** Empty tables → "No fuel logs yet" / "No expenses recorded." Total banner shows `0` gracefully. Modal save spinner + optimistic append.

---

### 7. Analytics — `/analytics`

- **Route:** `/analytics`.
- **Access:** **Fleet Manager** and **Financial Analyst**; others no access.
- **Key components:** 4 `<KpiCard>` (Fuel Efficiency km/l, Fleet Utilization %, Operational Cost, Vehicle ROI %) + ROI formula caption; `<BarChart>` Monthly Revenue; horizontal `<BarChart>` Top Costliest Vehicles; `<BrutalButton>` Export CSV (mandatory) / Export PDF (optional).
- **Data read:** `getAnalyticsKpis(range)` — Fuel Efficiency = Σ(final_odometer − start_odometer) / Σ fuel_consumed; Fleet Utilization %; Operational Cost = Fuel + Maintenance; Vehicle ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost (ratio, shown ×100); `getMonthlyRevenue()`, `getTopCostliestVehicles()`.
- **Data write:** `exportAnalyticsCsv(range)` / `exportAnalyticsPdf(range)` (generate + stream download).
- **Interactions & validations:** Date-range / region filters recompute all KPIs and charts. Guard against divide-by-zero (no fuel → Fuel Efficiency shows "—"; zero acquisition cost → ROI "—"). CSV export includes raw KPI + per-vehicle rows.
- **Empty/error/loading:** No data → charts render empty-state placeholders, KPIs show "—". Export disabled while dataset is empty; button shows spinner during generation.

---

### 8. Settings & RBAC — `/settings`

- **Route:** `/settings`.
- **Access:** General settings editable by **Fleet Manager** (the org-admin role for this build); RBAC matrix rendered **read-only** for all roles (source-of-truth reference).
- **Key components:** General `<BrutalCard>` form (`<BrutalInput>` Depot Name, `<BrutalSelect>` Currency, `<BrutalSelect>` Distance Unit) + `<BrutalButton>` Save; `<BrutalTable>` RBAC matrix (rows = 4 roles; columns = Fleet / Drivers / Trips / Fuel & Exp / Analytics; cells = ✓ / view / –).
- **Data read:** `getSettings()`, `getRbacMatrix()` (static config reflecting the matrix: Fleet Mgr → Fleet✓ Drivers✓ Trips– Fuel– Analytics✓; Dispatcher → Fleet view, Trips✓; Safety Officer → Drivers✓, Trips view; Financial → Fleet view, Fuel✓ Analytics✓).
- **Data write:** `updateSettings(data)` (Fleet Manager only).
- **Interactions & validations:** Depot Name required; Currency + Distance Unit from enum (drive display formatting app-wide — the Distance Unit governs whether km/l and odometer render in km or mi). RBAC cells are non-interactive labels — the matrix documents the same gating enforced in middleware/actions.
- **Empty/error/loading:** Save shows spinner → success toast. Load failure → inline error card with retry; RBAC matrix always renders from static config even if settings fetch fails.

---

## Business Rules, State Machines & RBAC

This section is the authoritative specification for TransitOps' domain invariants. It defines the finite-state machines that govern vehicles, trips, and drivers; the exact enforcement point for every mandatory business rule; the transactional boundaries that keep multi-row mutations atomic; and the role-based access-control model that gates every route and action.

The guiding principle throughout: **the database is the last line of defense, not the first.** Client-side Zod schemas give fast feedback, Server Actions re-validate against live state (the client's view is always stale), and DB constraints guarantee that no code path — including future ones — can persist an illegal state.

---

### 1. Vehicle Status State Machine

A vehicle moves between four states. Only the transitions drawn below are legal; any other transition is rejected by the Server Action guard and, where expressible, by a DB `CHECK`/partial index.

```mermaid
stateDiagram-v2
    [*] --> Available: registerVehicle()

    Available --> OnTrip: dispatchTrip() (trip dispatch side-effect)
    OnTrip --> Available: completeTrip() / cancelTrip() (restore on trip close)

    Available --> InShop: openMaintenance() (active maintenance record created)
    InShop --> Available: closeMaintenance() (only if not Retired)

    Available --> Retired: retireVehicle()
    InShop --> Retired: retireVehicle()

    OnTrip --> Retired: BLOCKED (must complete/cancel trip first)

    Retired --> [*]

    note right of OnTrip
        Vehicle is invisible to dispatch
        selection while On Trip, In Shop, or Retired
    end note
    note right of Retired
        Terminal state. closeMaintenance()
        never revives a Retired vehicle.
    end note
```

**Legal transitions**

| From | To | Trigger | Notes |
|---|---|---|---|
| — | `Available` | Vehicle registered | Initial state on create |
| `Available` | `On Trip` | Trip dispatched | Rule 6 side-effect |
| `On Trip` | `Available` | Trip completed / cancelled | Rules 7 & 8 side-effect |
| `Available` | `In Shop` | Active maintenance opened | Rule 9 side-effect |
| `In Shop` | `Available` | Maintenance closed | Rule 10 — **only if not Retired** |
| `Available` / `In Shop` | `Retired` | Manual retire (Fleet Manager) | Terminal |

**Illegal transitions (guard-rejected):** `On Trip → In Shop`, `On Trip → Retired` (the active trip must be closed first), `Retired → *` (terminal), and any direct `In Shop → On Trip` (a vehicle must return to `Available` before it can be dispatched).

---

### 2. Trip Lifecycle State Machine

Trips are the primary transactional entity. Each transition carries **side-effects on the assigned vehicle and driver**, annotated inline below.

```mermaid
stateDiagram-v2
    [*] --> Draft: createTrip()

    Draft --> Dispatched: dispatchTrip()
    note left of Dispatched
        SIDE-EFFECTS (one transaction):
        - trip.status = Dispatched
        - trip.start_odometer = vehicle.odometer
        - vehicle.status = On Trip
        - driver.status = On Trip
        Pre-checks: vehicle and driver Available,
        license valid, cargo <= capacity
    end note

    Dispatched --> Completed: completeTrip()
    note right of Completed
        SIDE-EFFECTS (one transaction):
        - capture final_odometer, fuel_consumed, completed_at
        - write FuelLog (+ Expenses) rows
        - vehicle.status = Available, vehicle.odometer = final_odometer
        - driver.status = Available
    end note

    Dispatched --> Cancelled: cancelTrip()
    note right of Cancelled
        SIDE-EFFECTS (one transaction):
        - trip.status = Cancelled
        - vehicle.status = Available
        - driver.status = Available
    end note

    Draft --> Cancelled: cancelTrip() (no restore — never dispatched)

    Completed --> [*]
    Cancelled --> [*]
```

**Notes**

- A `Draft` trip holds no locks: no vehicle/driver status has been mutated yet, so cancelling a `Draft` performs **no restore**.
- Only a `Dispatched` trip may transition to `Completed`. Completing requires operator input (final odometer, fuel consumed) captured on the same request that writes the child `FuelLog` and `Expenses` rows.
- `Completed` and `Cancelled` are terminal; a closed trip is never re-opened (a new trip is created instead).

---

### 3. Driver Status Transitions

Drivers share the `Available ↔ On Trip` pair with vehicles but add compliance-driven states.

```mermaid
stateDiagram-v2
    [*] --> Available: addDriver()

    Available --> OnTrip: dispatchTrip() (side-effect)
    OnTrip --> Available: completeTrip() / cancelTrip() (side-effect)

    Available --> OffDuty: Safety Officer toggle
    OffDuty --> Available: Safety Officer toggle

    Available --> Suspended: Safety Officer action (compliance / safety)
    Suspended --> Available: Safety Officer reinstates

    OffDuty --> Suspended: Safety Officer action
    Suspended --> OffDuty: Safety Officer action
```

- **`Suspended`** and **expired license** are hard blocks on assignment (Rule 3). Both are evaluated at dispatch time, not just at driver-edit time, because a license can lapse while a driver sits `Available`.
- **`Off Duty`** is an availability toggle (grey pill) — the driver is not eligible for dispatch but is not a compliance violation.
- Only `Available` drivers appear in the dispatch driver picker. `On Trip`, `Off Duty`, and `Suspended` are all excluded from selection; `On Trip` additionally satisfies the "already assigned" block (Rule 4).

---

### 4. Validation Rules

Every mandatory rule is enforced at **defense-in-depth**: a Zod schema for immediate client feedback, a Server Action re-check against live DB state (authoritative), and — where the invariant is expressible declaratively — a DB constraint as the final backstop.

| # | Rule | Where enforced | Failure behavior |
|---|---|---|---|
| 1 | Vehicle registration number unique | **DB constraint** (`UNIQUE(registration_number)`) + Server Action pre-check + Zod format check | Insert rejected; Server Action catches unique-violation → `409` with field error "Registration number already exists". Form highlights the field. |
| 2 | Retired / In Shop vehicles never appear in dispatch selection | **Server Action** query filter (`WHERE status = 'available'`) feeding the picker; **Zod refine** on submit re-asserts selected vehicle is `Available` | Ineligible vehicles are simply not rendered. If a stale client submits one, Server Action returns `422 "Vehicle not available for dispatch"` and dispatch is blocked. |
| 3 | Expired-license OR Suspended drivers cannot be assigned | **Server Action** guard: `driver.status <> 'suspended' AND license_expiry_date >= today` (authoritative); Zod refine mirrors it client-side | Driver excluded from picker; on stale submit, `422 "Driver ineligible: license expired or suspended"`. Dispatch button stays disabled. |
| 4 | Vehicle/driver already `On Trip` cannot be re-assigned | **Server Action** re-read of live status inside the dispatch transaction; **partial unique index** on `driver_id`/`vehicle_id` where `trip.status = 'dispatched'` | Transaction aborts → `409 "Vehicle/Driver already on an active trip"`. No rows mutated. |
| 5 | Cargo weight ≤ vehicle max load capacity | **Zod refine** (client, live validation box disables Dispatch) + **Server Action** authoritative check | Client: Dispatch button disabled, red "Capacity exceeded" banner. Server: `422 "Cargo weight exceeds capacity"`. |
| 6 | Dispatch → vehicle **and** driver become `On Trip` | **Server Action** inside a single transaction | If any of the three updates fail, the whole transaction rolls back — no partial `On Trip`. |
| 7 | Complete → vehicle **and** driver back to `Available` | **Server Action** inside a single transaction (with odometer/fuel/expense writes) | Any failure rolls back; statuses and child rows are all-or-nothing. |
| 8 | Cancel dispatched trip → restore vehicle **and** driver to `Available` | **Server Action** inside a single transaction | Rollback on failure; a `Draft` cancel performs no restore (nothing was locked). |
| 9 | Active maintenance record → vehicle becomes `In Shop` | **Server Action** inside a single transaction (insert log + update vehicle) | Rollback on failure. Guard rejects opening maintenance on an `On Trip` vehicle (`409 "Vehicle is on a trip"`). |
| 10 | Close maintenance → vehicle back to `Available` **unless Retired** | **Server Action** transaction with conditional: `IF vehicle NOT Retired AND no other Active log THEN set Available` | Retired vehicles stay `Retired`; log flips to `Closed`. Rollback on failure. |

Two transversal rules complete the set:

- **License-expiry check.** Any assignment eligibility test compares `license_expiry_date` against the server's `CURRENT_DATE` (never the client clock). A driver whose license lapses today is immediately non-dispatchable even if their record still reads `Available`. The Drivers screen renders lapsed expiry dates in orange, and the license-reminder job (bonus) emails the Safety Officer for licenses expiring within a configurable window.
- **Account lockout.** Auth increments a `failed_login_attempts` counter per user on each bad credential; at **5** consecutive failures the account is locked (`locked_until` timestamp set). Further attempts return "Invalid credentials. Account locked after 5 failed attempts." regardless of correctness until the lock elapses or an admin resets it. A successful login resets the counter to zero.

---

### 5. Transactional Integrity

Dispatch, complete, cancel, and maintenance operations each mutate **two or more rows across different tables** (trip + vehicle + driver, or maintenance log + vehicle, plus child fuel/expense rows). A crash or constraint violation part-way through must never leave the fleet in a half-updated state — e.g. a driver marked `On Trip` for a trip that never dispatched.

**Rule: every multi-row status mutation runs inside one DB transaction.** All reads used for the authoritative eligibility checks happen *inside* that transaction (with row locking) so the decision and the writes are consistent — the client's picker state is treated as a hint only. Prisma has no `.forUpdate()` in its query API, so we take the row lock with a one-line `$queryRaw … FOR UPDATE` at the top of an **interactive transaction** (`prisma.$transaction(async (tx) => …)`); every subsequent write goes through the typed `tx` client and commits/rolls back atomically.

```ts
// app/actions/trips.ts  — Prisma/Postgres, Next.js Server Action
'use server';
import { Prisma } from '@prisma/client';

export async function dispatchTrip(input: DispatchInput) {
  const { tripId } = DispatchSchema.parse(input);   // Zod: shape + cargo>=0
  await requireRole(['dispatcher']);                // RBAC guard (see §6)

  return prisma.$transaction(async (tx) => {
    // 1. Load the trip, then LOCK the vehicle & driver rows we will mutate.
    //    Prisma has no .forUpdate(), so we lock via raw SQL inside the txn.
    const trip = await tx.trip.findUniqueOrThrow({ where: { id: tripId } });
    const [vehicle] = await tx.$queryRaw<Vehicle[]>`
      SELECT * FROM vehicles WHERE id = ${trip.vehicleId}::uuid FOR UPDATE`;
    const [driver] = await tx.$queryRaw<Driver[]>`
      SELECT * FROM drivers  WHERE id = ${trip.driverId}::uuid  FOR UPDATE`;

    // 2. RE-VALIDATE availability against live, locked state (Rules 2,3,4).
    if (trip.status !== 'draft')        throw new DomainError(409, 'Trip already dispatched');
    if (vehicle.status !== 'available') throw new DomainError(422, 'Vehicle not available');
    if (driver.status  !== 'available') throw new DomainError(422, 'Driver not available');
    if (driver.status === 'suspended' || driver.license_expiry_date < today())
      throw new DomainError(422, 'Driver ineligible: license expired or suspended');

    // 3. CAPACITY check (Rule 5). Decimals compared numerically.
    if (Number(trip.cargoWeight) > Number(vehicle.max_load_capacity))
      throw new DomainError(422, 'Cargo weight exceeds vehicle capacity');

    // 4. Atomic side-effects (Rule 6): trip + vehicle + driver all On Trip.
    await tx.trip.update({
      where: { id: trip.id },
      data: { status: 'dispatched', startOdometer: vehicle.odometer },
    });
    await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'on_trip' } });
    await tx.driver.update({  where: { id: trip.driverId },  data: { status: 'on_trip' } });
    // commit — or full rollback on any throw above.
  });
}
```

```ts
export async function completeTrip(input: CompleteInput) {
  const { tripId, finalOdometer, fuelConsumed, fuelCost, revenue, expenses } =
    CompleteSchema.parse(input);
  await requireRole(['dispatcher']);

  return prisma.$transaction(async (tx) => {
    // Lock the trip row for the duration of the mutation.
    const [trip] = await tx.$queryRaw<Trip[]>`
      SELECT * FROM trips WHERE id = ${tripId}::uuid FOR UPDATE`;
    if (trip.status !== 'dispatched') throw new DomainError(409, 'Trip is not active');
    // start_odometer was snapshotted at dispatch; final must not go backwards.
    if (finalOdometer < (trip.start_odometer ?? 0))
      throw new DomainError(422, 'Final odometer below start reading');

    // capture trip metrics
    await tx.trip.update({
      where: { id: trip.id },
      data: { status: 'completed', finalOdometer, fuelConsumed, revenue, completedAt: new Date() },
    });

    // fuel_logs.cost is NOT NULL — always supply both liters and cost.
    await tx.fuelLog.create({
      data: { vehicleId: trip.vehicle_id, logDate: new Date(), liters: fuelConsumed, cost: fuelCost },
    });
    if (expenses) await tx.expense.create({
      data: { tripId: trip.id, vehicleId: trip.vehicle_id, ...expenses },
    });

    // Rule 7: restore both resources; roll the vehicle odometer forward.
    await tx.vehicle.update({
      where: { id: trip.vehicle_id }, data: { status: 'available', odometer: finalOdometer },
    });
    await tx.driver.update({ where: { id: trip.driver_id }, data: { status: 'available' } });
  });
}
```

```ts
export async function openMaintenance(input: MaintenanceInput) {
  const { vehicleId, serviceType, cost, date } = MaintenanceSchema.parse(input);
  await requireRole(['fleet_manager']);

  return prisma.$transaction(async (tx) => {
    const [vehicle] = await tx.$queryRaw<Vehicle[]>`
      SELECT * FROM vehicles WHERE id = ${vehicleId}::uuid FOR UPDATE`;
    if (vehicle.status === 'on_trip') throw new DomainError(409, 'Vehicle is on a trip');
    if (vehicle.status === 'retired') throw new DomainError(409, 'Vehicle is retired');

    await tx.maintenanceLog.create({
      data: { vehicleId, serviceType, cost, serviceDate: date, status: 'active' },
    });
    await tx.vehicle.update({ where: { id: vehicleId }, data: { status: 'in_shop' } });  // Rule 9
  });
}
// closeMaintenance(): set log 'closed'; Rule 10 — if the vehicle is not Retired
//   AND no other 'active' log remains for it, set vehicle 'available'.
```

`cancelTrip` follows the same shape as `completeTrip` minus the metric capture: for a `Dispatched` trip it sets `trip = Cancelled` and restores vehicle + driver to `Available` in one transaction (Rule 8); for a `Draft` trip it only flips the trip status.

**Isolation.** Row-level `FOR UPDATE` locks serialize concurrent dispatch attempts on the same vehicle/driver, so two dispatchers racing for one vehicle cannot both win — the second blocks, re-reads `On Trip`, and fails cleanly. The partial unique index (Rule 4) is the declarative backstop for that race.

---

### 6. RBAC Enforcement Strategy

Authorization is enforced at **four layers**, each independent so that bypassing one still leaves the others intact:

1. **Role on the user / JWT.** On login the user's `role` (one of the four) is embedded in a signed, httpOnly session JWT. The role is never read from client-supplied headers or request bodies — only from the verified token server-side.
2. **Next.js middleware route gate.** `middleware.ts` inspects the session token and maps the requested path to the allowed roles. A Safety Officer hitting `/analytics` is redirected to their landing page before the route renders; unauthenticated requests go to `/login`.
3. **Per-action guard helper.** Every Server Action begins with `await requireRole([...])`, which reads the verified session, throws `403` if the caller's role is absent, and (for `view`-only grants) rejects mutating actions. This is the authoritative check — middleware protects *pages*, `requireRole` protects *operations*.
4. **Render-time hiding.** UI controls (`+ Add Vehicle`, `Dispatch`, status toggles) are conditionally rendered from the session role. This is UX polish only — hiding a button is never treated as security; layers 2 and 3 do the real enforcement.

```ts
// lib/rbac.ts
export async function requireRole(allowed: Role[], mode: 'write' | 'read' = 'write') {
  const { role } = await getVerifiedSession();          // from signed JWT
  const grant = MATRIX[role];                            // resolved permissions
  if (!allowed.includes(role)) throw new DomainError(403, 'Forbidden');
  if (mode === 'write' && grant.readOnly) throw new DomainError(403, 'Read-only access');
}
```

#### RBAC Matrix

Columns are the resource domains; ✓ = full CRUD, `view` = read-only, – = no access.

| Role | Fleet | Drivers | Trips | Fuel & Exp | Analytics |
|---|:---:|:---:|:---:|:---:|:---:|
| **Fleet Manager** | ✓ | ✓ | – | – | ✓ |
| **Dispatcher** | view | – | ✓ | – | – |
| **Safety Officer** | – | ✓ | view | – | – |
| **Financial Analyst** | view | – | – | ✓ | ✓ |

#### Translating `view` into read-only enforcement

A `view` cell grants **read** but not **write**, enforced concretely as:

- **Middleware** allows `GET`/page navigation to the domain's routes but the domain's mutating routes (e.g. `POST /trips/dispatch`) remain closed to that role.
- **Server Actions** for that domain call `requireRole([...], 'write')`; a `view`-only role fails the `grant.readOnly` check and receives `403 "Read-only access"`. Read/query actions call `requireRole([...], 'read')` and pass.
- **Render layer** shows the tables and detail panes but omits every create/edit/delete/toggle control and renders pills and fields as static.

Concretely: a **Dispatcher** sees the Fleet registry (to pick vehicles) but cannot add, edit, retire, or open maintenance on a vehicle; a **Safety Officer** sees the Trips board (to monitor compliance of active trips) but cannot create or dispatch; a **Financial Analyst** sees Fleet read-only for cost attribution but owns Fuel & Expenses and Analytics outright. The two write-heavy operational domains — **Trips** (Dispatcher) and **Fuel & Expenses** (Financial Analyst) — each have exactly one full-CRUD owner, keeping mutation responsibility unambiguous.

---

## Analytics, Reporting & Bonus Features

This section defines the operational-insight layer of TransitOps: the KPIs surfaced on the Dashboard and Analytics screens, the aggregation queries that back them, the chart specifications (neo-brutalist restyled Recharts), and the mandatory + bonus export/automation features.

All queries assume the Prisma/Postgres schema above (`vehicles`, `drivers`, `trips`, `maintenance_logs`, `fuel_logs`, `expenses`). SQL is shown as portable Postgres; in the app these run either as Prisma `groupBy`/aggregate calls or, for the multi-CTE rollups, as `prisma.$queryRaw` returning typed rows.

---

### KPI Definitions

> **Fleet Utilization definition (chosen & fixed):** the share of *dispatchable* vehicles currently on the road.
> `Fleet Utilization % = (vehicles On Trip) / (total vehicles − Retired vehicles) × 100`.
> Retired vehicles are excluded from the denominator because they are permanently out of service and would otherwise permanently depress the metric. In-Shop vehicles remain in the denominator (they are temporarily, not permanently, unavailable), so utilization correctly drops while a vehicle is being serviced.

| KPI | Formula | Source query |
|---|---|---|
| **Active Vehicles** | Count of vehicles that are operational (not Retired) | `SELECT count(*) FROM vehicles WHERE status <> 'retired';` |
| **Available Vehicles** | Count of vehicles ready for dispatch | `SELECT count(*) FROM vehicles WHERE status = 'available';` |
| **Vehicles in Maintenance** | Count of vehicles currently In Shop | `SELECT count(*) FROM vehicles WHERE status = 'in_shop';` |
| **Active Trips** | Count of trips currently on the road | `SELECT count(*) FROM trips WHERE status = 'dispatched';` |
| **Pending Trips** | Count of trips created but not yet dispatched | `SELECT count(*) FROM trips WHERE status = 'draft';` |
| **Drivers On Duty** | Count of drivers currently driving a trip | `SELECT count(*) FROM drivers WHERE status = 'on_trip';` |
| **Fleet Utilization %** | `On Trip vehicles ÷ (total − Retired) × 100` | `SELECT round(100.0 * count(*) FILTER (WHERE status = 'on_trip') / NULLIF(count(*) FILTER (WHERE status <> 'retired'), 0), 1) AS utilization_pct FROM vehicles;` |
| **Fuel Efficiency (km/l)** | `Σ(final_odometer − start_odometer) ÷ Σ fuel_consumed` | `SELECT round(sum(final_odometer - start_odometer)::numeric / NULLIF(sum(fuel_consumed), 0), 2) AS km_per_l FROM trips WHERE status = 'completed';` |
| **Operational Cost** | `total fuel cost + total maintenance cost` | `SELECT (SELECT coalesce(sum(cost),0) FROM fuel_logs) + (SELECT coalesce(sum(cost),0) FROM maintenance_logs) AS operational_cost;` |
| **Vehicle ROI** | `(Revenue − (Maintenance + Fuel)) ÷ Acquisition Cost` (ratio; ×100 at display) | Per-vehicle aggregation — see [ROI query](#2-per-vehicle-operational-cost--roi-top-costliest-vehicles) below |

**Notes on definitions**

- **Fuel Efficiency** uses `Completed` trips only, drawing distance from the odometer delta (`final_odometer − start_odometer`, both captured on the same trip) and fuel from `trips.fuel_consumed`, so distance and fuel come from the same event.
- **Operational Cost** sums fuel from `fuel_logs` and maintenance from `maintenance_logs` — the single authoritative sources. `expenses.maintenance_linked` is display-only and never added here.
- **Drivers On Duty** intentionally maps to driver status `On Trip` (mirrors business rule #6). "Off Duty" and "Suspended" are excluded.

---

### Example Aggregation Queries

#### 1. Fleet Utilization (single row, powers Dashboard + Analytics KPI)

```sql
SELECT
  count(*) FILTER (WHERE status = 'on_trip')                        AS on_trip,
  count(*) FILTER (WHERE status <> 'retired')                      AS dispatchable_total,
  round(
    100.0 * count(*) FILTER (WHERE status = 'on_trip')
          / NULLIF(count(*) FILTER (WHERE status <> 'retired'), 0)
  , 1)                                                              AS utilization_pct
FROM vehicles;
```

#### 2. Per-Vehicle Operational Cost + ROI (Top Costliest Vehicles)

Joins each vehicle to its lifetime maintenance, fuel, and trip-revenue totals, then ranks by operational cost. The same row set feeds both the ROI KPI (fleet average) and the ranked bar chart (per-vehicle).

```sql
WITH maint AS (
  SELECT vehicle_id, coalesce(sum(cost), 0) AS maintenance_cost
  FROM maintenance_logs GROUP BY vehicle_id
),
fuel AS (
  SELECT vehicle_id, coalesce(sum(cost), 0) AS fuel_cost
  FROM fuel_logs GROUP BY vehicle_id
),
rev AS (
  SELECT vehicle_id, coalesce(sum(revenue), 0) AS revenue
  FROM trips WHERE status = 'completed' GROUP BY vehicle_id
)
SELECT
  v.id,
  v.registration_number,
  v.name_model,
  coalesce(m.maintenance_cost, 0)                              AS maintenance_cost,
  coalesce(f.fuel_cost, 0)                                     AS fuel_cost,
  coalesce(m.maintenance_cost, 0) + coalesce(f.fuel_cost, 0)   AS operational_cost,
  coalesce(r.revenue, 0)                                       AS revenue,
  (coalesce(r.revenue, 0)
     - (coalesce(m.maintenance_cost, 0) + coalesce(f.fuel_cost, 0)))
   / NULLIF(v.acquisition_cost, 0)                             AS roi  -- ratio; ×100 at display
FROM vehicles v
LEFT JOIN maint m ON m.vehicle_id = v.id
LEFT JOIN fuel  f ON f.vehicle_id = v.id
LEFT JOIN rev   r ON r.vehicle_id = v.id
WHERE v.status <> 'retired'
ORDER BY operational_cost DESC
LIMIT 10;
```

- **Top Costliest Vehicles** chart consumes this result ordered by `operational_cost DESC`.
- **Vehicle ROI KPI** (Analytics card) = portfolio-level `(Σrevenue − Σopcost) / Σacquisition_cost`, shown ×100 as a percent; per-vehicle `roi` drives table tooltips. Using the portfolio figure on the card avoids small-denominator distortion.

---

### Charts Plan (Recharts, neo-brutalist restyle)

All charts use **Recharts** wrapped in `<ResponsiveContainer>`. A shared brutalist theme is applied so every chart matches the thick-border / hard-shadow / flat-fill aesthetic:

- **Flat fills** — solid palette tokens, no gradients (`fill="var(--color-blue)"` etc.).
- **Black strokes** — every bar/axis/grid uses `stroke="#0B0B0B"` at `strokeWidth={2–3}`.
- **Hard offset shadow** — bars get a non-blurred drop shadow via an SVG `<filter>` (`feOffset dx=4 dy=4` + `feFlood` black, no `feGaussianBlur`); the chart card itself uses CSS `box-shadow: 6px 6px 0 #0B0B0B`.
- **Comic-style type** — axis ticks & tooltip in the app's Comic font token, `fontWeight: 700`; numeric labels in mono.
- **Palette maps to status pill colors:** Available = green, On Trip = blue, In Shop = orange, Retired = red/pink.

#### Dashboard — Vehicle Status (horizontal bars)

- Component: `<BarChart layout="vertical" data={statusCounts}>` with `<XAxis type="number">`, `<YAxis type="category" dataKey="status">`, one `<Bar dataKey="count">`.
- Per-bar color via `<Cell>` mapped to the status pill palette.
- `<CartesianGrid>` horizontal-only, black dashed; `<Tooltip>` restyled to a bordered card (`border: 3px solid #0B0B0B; box-shadow: 4px 4px 0 #0B0B0B`).
- Data source: `SELECT status, count(*) FROM vehicles GROUP BY status;`

#### Analytics — Monthly Revenue (vertical bar chart)

- Component: `<BarChart data={monthlyRevenue}>` with `<XAxis dataKey="month">`, `<YAxis>`, one `<Bar dataKey="revenue" fill="var(--color-brand)">` + black stroke + hard-shadow filter.
- Data source (grouped by the authoritative `completed_at`, not the planned `eta`, so completed revenue lands in the right month and nothing is dropped for null ETAs):
  ```sql
  SELECT to_char(date_trunc('month', completed_at), 'Mon YYYY') AS month,
         sum(revenue) AS revenue
  FROM trips
  WHERE status = 'completed' AND completed_at IS NOT NULL
  GROUP BY date_trunc('month', completed_at)
  ORDER BY date_trunc('month', completed_at);
  ```

#### Analytics — Top Costliest Vehicles (ranked horizontal bars)

- Component: `<BarChart layout="vertical" data={topCostly}>` sorted by `operational_cost DESC`; `<YAxis dataKey="registration_number">`, `<Bar dataKey="operational_cost">`.
- Stacked variant optional: two `<Bar>` (`fuel_cost`, `maintenance_cost`) stacked to show cost composition, each flat-filled with black stroke.
- `<LabelList dataKey="operational_cost">` renders the value at the bar end in Comic bold.
- Data source: the ROI CTE query above.

---

### CSV Export (mandatory)

Every primary dataset is exportable to CSV from its screen's toolbar ("Export CSV" chunky button):

| Dataset | Columns exported |
|---|---|
| **Vehicles** | reg no, name/model, type, capacity, odometer, acquisition cost, status, region |
| **Drivers** | name, license no, category, license expiry, contact, trip completion %, safety score, status |
| **Trips** | trip code, source, destination, vehicle, driver, cargo weight, planned distance, start odometer, final odometer, fuel consumed, revenue, status, completed_at |
| **Fuel Logs** | vehicle, date, liters, cost |
| **Expenses** | trip, vehicle, toll, other, maintenance linked, total |
| **Analytics** | per-vehicle operational cost + ROI (the ROI CTE result), plus monthly revenue series |

**Implementation**

- Serialization via **papaparse** (`Papa.unparse(rows)`), which handles quoting/escaping.
- Exposed through a single **Next.js Route Handler** parameterized by dataset that queries with Prisma, unparses, and streams back with CSV headers:

```ts
// app/api/export/[dataset]/route.ts
import Papa from "papaparse";

export async function GET(_req: Request, { params }: { params: { dataset: string } }) {
  const rows = await loadDataset(params.dataset); // Prisma query, RBAC-checked
  const csv = Papa.unparse(rows);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${params.dataset}.csv"`,
    },
  });
}
```

- **RBAC enforced** in `loadDataset`: e.g. Fuel/Expenses export is restricted to Financial Analyst; Analytics export to Fleet Manager + Financial Analyst, mirroring the Settings RBAC matrix.

---

### PDF Export (optional / bonus)

- Library: **@react-pdf/renderer** — declarative React components rendered to PDF (`<Document>` / `<Page>` / `<View>` / `<Text>`), styled with a brutalist stylesheet (thick borders, black rules, bold headers).
- **Analytics report:** KPI summary (Fuel Efficiency, Fleet Utilization %, Operational Cost, ROI), the Monthly Revenue figures, and the Top Costliest Vehicles table.
- **Trip report:** single-trip sheet — trip code, route, vehicle/driver, distance, fuel consumed, revenue, linked expenses; usable as a delivery record.
- Served from a Route Handler returning `application/pdf` via `renderToStream(<Report data={...} />)`, gated by the same RBAC as CSV.

---

### Email Reminders — Expiring Licenses (bonus)

Automated compliance nudge for the Safety Officer.

- **Query:** drivers whose license expires within the next 30 days (already-expired licenses are handled separately as a hard block on dispatch, rule #3).
  ```sql
  SELECT name, license_number, license_expiry_date, contact_number
  FROM drivers
  WHERE license_expiry_date >= current_date
    AND license_expiry_date <= current_date + INTERVAL '30 days'
  ORDER BY license_expiry_date;
  ```
- **Delivery:** **Resend** (`resend.emails.send(...)`) sends a digest to Safety Officer(s) listing each driver + days remaining.
- **Trigger:** **Vercel Cron** hitting a protected route handler (`app/api/cron/license-reminders/route.ts`), authenticated via `CRON_SECRET`.
- **Schedule:** **daily**, early morning — `vercel.json`:
  ```json
  { "crons": [{ "path": "/api/cron/license-reminders", "schedule": "7 6 * * *" }] }
  ```
  (06:07 UTC daily; off the top-of-hour to avoid platform contention.)

---

### Other Bonus Features & Where They Slot In

- **Vehicle Document Management** — file upload (registration papers, insurance, fitness certificate) on the Vehicle Registry detail view. Uploads go to object storage via **uploadthing** (or S3-compatible bucket); metadata persisted in a new `vehicle_documents` table (`id`, `vehicle_id` FK, `doc_type`, `file_url`, `uploaded_by`, `expiry_date?`, `created_at`). Expiring-document reminders can reuse the same Resend + Vercel Cron pipeline as license reminders.

- **Global Search / Filter / Sort** — the top-bar search plus per-screen filter chips are backed by **TanStack Table** (`@tanstack/react-table`) for column sorting, multi-column filtering, and pagination on Vehicles, Drivers, Trips, Fuel & Expenses tables. Column filters map directly to the wireframe filters (Type/Status/Region/reg-no). Server-side variants push `where`/`orderBy` into Prisma queries for large datasets.

- **Dark Mode** — the wireframes are already dark-first; design tokens are defined as **dual-theme CSS variables** with `light`/`dark` values, toggled via a `data-theme` attribute (persisted in `localStorage`, respecting `prefers-color-scheme`). Because charts, pills, and shadows all reference tokens, theming requires no component changes — the neo-brutalist black strokes and hard shadows hold their contrast in both themes.

---

## 8-Hour Build Plan & Delivery

> **Philosophy:** Ship the crown jewel (Trip Dispatcher with enforced business rules) early and bulletproof. Everything else orbits it. Every hour ends with something demoable. When the clock bites, cut from the bottom of the priority stack — never from the mandatory eight.

### Milestone Table

| Time Block | Goal | Deliverable |
|---|---|---|
| **H0–H1** | Scaffold & foundations | `create-next-app` (App Router, TS), Tailwind **v4** neo-brutalist theme tokens (thick borders, hard offset shadows, orange accent, Comic-style font), **Prisma schema (`schema.prisma`) + Neon connection via `@prisma/adapter-neon`**, Auth.js credentials provider stubbed, `prisma/seed.ts` with **6 vehicles / 5 drivers / 4 trips / 4 role users**. `prisma migrate dev` green, dev server boots. |
| **H1–H2** | Auth + RBAC + shell | Working login (email/password/role), session cookie, `middleware.ts` route guards, RBAC matrix helper (`can(role, resource, action)`). App shell: dark sidebar (Dashboard/Fleet/Drivers/Trips/Maintenance/Fuel & Exp/Analytics/Settings), top bar with search + user chip. Nav items hidden per role. |
| **H2–H3** | Asset CRUD | Vehicle Registry: table + `+ Add Vehicle` modal, unique reg-no validation, status pills. Drivers & Safety: table + `+ Add Driver`, license-expiry orange highlight, safety/status pills, status toggle. Both wired to server actions. |
| **H3–H4** | 🏆 Trip Dispatcher | Create Trip form with **available-only** vehicle & driver pickers (filters out Retired/In Shop/On Trip/Suspended/expired-license), live capacity validation box (over-capacity → Dispatch disabled), single **dispatch transaction** flipping trip→Dispatched + vehicle & driver→On Trip (+ snapshot start_odometer). Live Board of trip cards. |
| **H4–H5** | Status engine + Maintenance | Complete/Cancel transitions (restore Available), all pill transitions centralized in `lib/transitions.ts`. Maintenance screen: Log Service form, active record → vehicle **In Shop**, close → back to Available (unless Retired). Service Log table. |
| **H5–H6** | Fuel & Expenses | Fuel Logs table + `+ Log Fuel`, Expenses table + `+ Add Expense` (toll/other/maint-linked), auto **Total Operational Cost = Fuel + Maintenance** (orange highlight). Trip-complete flow captures final odometer + fuel + expenses. |
| **H6–H7** | Insight layer | Dashboard: 7 KPI cards (colored top borders), Recent Trips table, Vehicle Status bar chart. Analytics: 4 KPI cards (Fuel Eff, Utilization, Op Cost, ROI + formula), Monthly Revenue bars, Top Costliest Vehicles bars. **CSV export** button. |
| **H7–H8** | Polish & deploy | Responsive pass (sidebar → drawer on mobile), status-pill color audit, empty/error states, **seed-demo dry run of the full judge script**, deploy to Vercel + Neon, smoke test on the live URL. |

---

### Definition of Done

The build is done when all **8 mandatory deliverables** are true on the deployed URL:

- [ ] **Responsive UI** — sidebar collapses to a drawer, tables scroll, no horizontal overflow on mobile; neo-brutalist theme intact at every breakpoint.
- [ ] **Auth + RBAC** — login works for all 4 roles; middleware blocks unauthorized routes; sidebar and actions respect the RBAC matrix (Fleet/Drivers/Trips/Fuel/Analytics × ✓/view/–).
- [ ] **Vehicle + Driver CRUD** — create/read/update both entities; reg-no uniqueness enforced; expired licenses flagged.
- [ ] **Trip validations** — over-capacity blocks dispatch; Retired/In Shop vehicles and Suspended/expired/On-Trip drivers never appear as options; no double-assignment.
- [ ] **Auto status transitions** — dispatch → both On Trip; complete → both Available; cancel → both Available; all atomic.
- [ ] **Maintenance workflow** — active record → vehicle In Shop (and hidden from dispatch); close → Available.
- [ ] **Fuel & expense** — logs recorded; Total Operational Cost auto-computes = Fuel + Maintenance.
- [ ] **Dashboard KPIs** — all 7 cards compute from live data; charts render.

---

### Priority Tiers (cut from the bottom)

**P0 — Must-have (the 8 mandatory deliverables).** Non-negotiable. If any P0 is at risk at H6, freeze all P1/P2 work and converge on P0.

- Auth + RBAC middleware
- Vehicle & Driver CRUD (unique reg no, license flags)
- Trip Dispatcher with all 5 validation rules + dispatch transaction
- Auto status transitions (dispatch/complete/cancel)
- Maintenance workflow (In Shop ↔ Available)
- Fuel & Expenses + operational cost auto-calc
- Dashboard KPIs
- Responsive, themed UI

**P1 — Should-have.** Ships if P0 is solid by ~H6:30.

- Analytics charts (Monthly Revenue, Top Costliest) + ROI/Fuel-Efficiency cards
- CSV export
- Dashboard filters (Type/Status/Region)
- Live Board card notes, lifecycle stepper visual
- Safety-score / trip-completion display polish

**P2 — Bonus.** Only if genuinely ahead.

- PDF export
- Email reminders for expiring licenses
- Vehicle document management
- Global search + multi-column sort
- Light/dark mode toggle (dark is default anyway)

**What to cut first, in order:** ① PDF export → ② email reminders → ③ document mgmt → ④ global search/sort → ⑤ Analytics charts (replace with a plain KPI-number grid) → ⑥ Dashboard filters (show unfiltered tables). **Never cut:** any P0. If desperate, render analytics as **static numbers** rather than dropping the numbers entirely.

---

### Risk List & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| **Dispatch/complete transaction bug** (partial status flip, vehicle On Trip but trip Draft) | High | Wrap every state change in a single `prisma.$transaction()` with a `$queryRaw … FOR UPDATE` row lock; centralize in `lib/transitions.ts`; unit-check the happy path at H4 before moving on. |
| **RBAC gaps** (unauthorized user reaches a route via direct URL) | High | Enforce in `middleware.ts` (route-level) **and** re-check inside every server action (`requireRole()`), not just by hiding nav. |
| **Available-only picker leaks** an ineligible vehicle/driver | Medium | Single `getAvailableVehicles()` / `getAvailableDrivers()` query used everywhere; filter in SQL, not the client. |
| **Charts eat the clock** | Medium | Time-box to 30 min. Fallback: swap chart lib for CSS flex **bars from divs** (thick-bordered, on-brand) — no dependency, faster, and looks intentionally brutalist. |
| **Neon connection / migration flakiness** | Medium | Use the pooled connection string + `@prisma/adapter-neon`; for fast schema iteration use `prisma db push` and switch to `prisma migrate dev` once the schema settles; keep seed idempotent. |
| **Prisma has no native `FOR UPDATE`** | Medium | Take the row lock with a single `$queryRaw` at the top of each interactive `$transaction`; keep those raw locks confined to `lib/transitions.ts` so the rest of the app stays fully typed. |
| **Comic-Sans-style font readability / vibe risk** | Low | Use a clean comic-style webfont (Comic Neue) for headings/labels, keep tabular data in a legible mono; thick borders carry the brutalism. |
| **Time overrun → nothing deployed** | Med-High | Deploy a hello-world to Vercel at **H1** so the pipeline is proven; redeploy continuously. |
| **Seed data doesn't match demo script** | Medium | Seed VAN-05 (500kg) and driver Alex explicitly so the judge path works from a clean DB. |

---

### Demo Script (exact judge click-path)

Follow the brief's Example Workflow. Log in as **Fleet Manager** first for setup, then **Dispatcher** for the trip.

1. **Register the vehicle.** Fleet → `+ Add Vehicle` → Reg No **VAN-05**, Type **Van**, Max Load **500 kg**, status **Available** → Save. New green `Available` pill appears in the registry.
2. **Register the driver.** Drivers → `+ Add Driver` → **Alex**, valid (non-expired) license, status **Available** → Save. Green pill in the drivers table.
3. **Show a validation block (optional wow).** Trips → Create Trip → pick VAN-05 → set Cargo Weight **600 kg** → validation box turns red *"Exceeds capacity (500 kg)"*, **Dispatch disabled**.
4. **Create the valid trip.** Set Cargo Weight **450 kg** → validation box green → note VAN-05 and Alex are the **only** eligible options in the pickers → Save as Draft.
5. **Dispatch.** Click **Dispatch** → trip pill flips to blue **Dispatched**; jump to Fleet & Drivers → VAN-05 and Alex both now blue **On Trip** and **gone from the dispatch picker**.
6. **Complete the trip.** Trips → open the card → **Complete** → enter **final odometer**, **fuel consumed**, **expenses (toll/other)** → confirm. Trip pill → green **Completed**; VAN-05 and Alex → green **Available** again.
7. **Send the van to the shop.** Maintenance → Log Service → Vehicle **VAN-05**, Service **Oil Change**, Cost, Status **Active** → Save → VAN-05 pill → orange **In Shop**.
8. **Prove the guard.** Trips → Create Trip → open Vehicle picker → **VAN-05 is absent** (In Shop hidden from dispatch). Close maintenance → VAN-05 → **Available** and reappears.
9. **Show the numbers move.** Dashboard KPIs (Active/Available/In Maintenance, Fleet Utilization) reflect the trip; Analytics shows updated **Operational Cost = Fuel + Maintenance**, **Fuel Efficiency (km/l)** from the odometer delta, Monthly Revenue bar, Top Costliest Vehicles. Click **Export CSV** to close.

**Total runtime:** ~4 minutes. Rehearse it end-to-end during H7–H8 against the seeded DB.

---

### Project Structure

```
transitops/
├─ src/
│  ├─ app/
│  │  ├─ (auth)/
│  │  │  └─ login/page.tsx           # split-screen auth, role dropdown
│  │  ├─ (app)/
│  │  │  ├─ layout.tsx               # sidebar + top bar shell (RBAC-aware nav)
│  │  │  ├─ dashboard/page.tsx       # 7 KPI cards, recent trips, status bars
│  │  │  ├─ fleet/page.tsx           # Vehicle Registry
│  │  │  ├─ drivers/page.tsx         # Drivers & Safety
│  │  │  ├─ trips/page.tsx           # 🏆 Trip Dispatcher + Live Board
│  │  │  ├─ maintenance/page.tsx     # Log Service + Service Log
│  │  │  ├─ expenses/page.tsx        # Fuel & Expenses, op-cost total
│  │  │  ├─ analytics/page.tsx       # 4 KPIs, revenue + costliest bars, CSV
│  │  │  └─ settings/page.tsx        # General + RBAC matrix
│  │  ├─ api/
│  │  │  ├─ auth/[...nextauth]/route.ts
│  │  │  ├─ export/[dataset]/route.ts   # streaming CSV export (parameterized)
│  │  │  └─ cron/license-reminders/route.ts
│  │  ├─ layout.tsx                  # fonts (comic + mono), theme tokens
│  │  └─ globals.css                 # Tailwind v4 @theme: borders, hard shadows
│  ├─ components/
│  │  ├─ ui/                         # neo-brutalist primitives
│  │  │  ├─ button.tsx               # chunky, hard offset shadow
│  │  │  ├─ card.tsx                 # thick border, no-blur shadow
│  │  │  ├─ pill.tsx                 # status colors (green/blue/orange/red/grey)
│  │  │  ├─ modal.tsx  input.tsx  select.tsx  table.tsx
│  │  │  └─ bar-chart.tsx            # Recharts restyle (CSS-div fallback)
│  │  ├─ shell/ sidebar.tsx  topbar.tsx  user-chip.tsx
│  │  ├─ trips/ create-trip-form.tsx  validation-box.tsx  live-board.tsx
│  │  ├─ vehicles/  drivers/  maintenance/  finance/   # feature forms/tables
│  │  └─ kpi-card.tsx
│  ├─ lib/
│  │  ├─ auth.ts                     # Auth.js config, credentials provider
│  │  ├─ db.ts                       # PrismaClient singleton + @prisma/adapter-neon
│  │  ├─ rbac.ts                     # matrix + requireRole()/can()
│  │  ├─ transitions.ts              # dispatch/complete/cancel/maint ($transaction + FOR UPDATE)
│  │  ├─ queries.ts                  # getAvailableVehicles/Drivers, KPIs
│  │  ├─ actions/                    # vehicles.ts drivers.ts trips.ts …
│  │  ├─ analytics.ts                # fuel eff, utilization, op cost, ROI
│  │  └─ constants.ts                # statuses, pill color map
│  └─ middleware.ts                  # session + route-level RBAC guard
├─ prisma/
│  ├─ schema.prisma                  # models + enums (roles = UserRole enum, not a table)
│  ├─ migrations/                    # versioned SQL (+ hand-added CHECK & partial indexes)
│  └─ seed.ts                        # 4 role users, VAN-05, Alex, demo data
├─ vercel.json                       # cron: daily license reminders
├─ .env.local                        # DATABASE_URL, AUTH_SECRET, RESEND_API_KEY
└─ package.json                      # prisma.seed → "tsx prisma/seed.ts"
```

---

### Repo Setup Commands

```bash
# H0 — scaffold
pnpm create next-app@latest transitops \
  --typescript --app --tailwind --eslint --src-dir --import-alias "@/*"
cd transitops

# Tailwind v4 (installed by create-next-app; ensure v4 + PostCSS plugin)
pnpm add tailwindcss@latest @tailwindcss/postcss

# Data layer — Prisma + Neon (serverless driver adapter)
pnpm add @prisma/client @prisma/adapter-neon @neondatabase/serverless
pnpm add -D prisma tsx
pnpm prisma init --datasource-provider postgresql   # scaffolds prisma/schema.prisma + .env

# Auth — Auth.js (NextAuth v5) credentials
pnpm add next-auth@beta bcrypt-ts zod

# Forms, tables, charts, export
pnpm add react-hook-form @hookform/resolvers @tanstack/react-table recharts papaparse
pnpm add motion

# Fonts (comic-style + mono for tabular data)
pnpm add @fontsource/comic-neue @fontsource/jetbrains-mono

# Edit prisma/schema.prisma, then migrate + generate client + seed
pnpm prisma migrate dev --name init     # creates + applies the first migration, runs generate
pnpm prisma db seed                      # runs prisma/seed.ts (configured under "prisma":{"seed"} in package.json)
# (fast-iteration alt while the schema is churning: pnpm prisma db push)

pnpm dev
```

> **Deploy early (H1):** `vercel --prod` once to prove the pipeline, add `DATABASE_URL` + `AUTH_SECRET` to Vercel env, then redeploy after every green milestone.

---

<div align="center">

### 🏁 That's TransitOps.

**Serious fleet infrastructure in a Comic-Sans grin and thick black borders.**
Build the Dispatcher first, keep every status flip in a transaction, gate every action by role, and let the KPIs tell the story.

*Now go dispatch something.* 🚚💨

</div>
