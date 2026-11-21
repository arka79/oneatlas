# OneAtlas

AI model discovery and intelligence — a Full Stack Engineer internship MVP.

**OneAtlas • Freebuff / DeepSeek Prompt Playbook — Page 7**

OneAtlas lets you browse and filter AI models, compare them side by side, follow benchmark standings, explore the labs and inference providers behind the catalog, and estimate token costs. All catalog data is served from PostgreSQL through Prisma; nothing is hardcoded in the frontend.

---

## Problem

Model pricing, context windows, capabilities, and benchmark scores are scattered across vendor websites, leaderboards, and inference providers. There is no single, honest place to:

- Compare list pricing across models in a consistent unit (USD per 1M tokens)
- See verified vs. illustrative provenance for every number
- Compare two to four models on specs, benchmarks, capabilities, and estimated token cost in one view
- Search labs and providers and follow links back to the models they build or serve

OneAtlas solves this with a database-backed catalog where every figure carries a `verificationStatus`, `dataSource`, and `lastUpdated` — so nothing is presented as live vendor data unless it actually is.

---

## What OneAtlas is

- A **Next.js 16 App Router** application (React Server Components)
- A **PostgreSQL** catalog queried through **Prisma 6**
- A **searchable, filterable, sortable, paginated** model catalog (`/models`)
- A **model detail page** with lab info, provider availability, pricing, capabilities, and benchmark scores (`/models/[slug]`)
- A **URL-backed comparison** of 2–4 models with best-value highlighting and a token-cost estimator (`/compare`)
- A **benchmark leaderboard** that ranks models within a single evaluation at a time (`/leaderboard`)
- **Searchable lab and provider directories** with linked profile pages (`/labs`, `/providers`)
- A **JSON API** for every data surface (`/api/*`)
- **Honest about data quality**: the shipped dataset is illustrative seed data, explicitly labeled as such

## What OneAtlas is not

- A live pricing engine — prices are illustrative approximations
- A benchmark verification platform — scores carry `verificationStatus: ILLUSTRATIVE`
- An authenticated or rate-limited platform — no accounts, no API keys required
- A full-text search engine — `q` is case-insensitive substring matching
- A production billing tool — the cost estimator is list-price math only

---

## Features

| Area | Implemented |
|------|-------------|
| **Catalog discovery** | Search by name/lab/license/description; filter by lab, provider, type, capability, modality, open weights, max input price; sort by release date, name, price, or context; paginate at 9 per page |
| **Model detail** | Full record: lab, pricing (input/output per 1M tokens), context window, max output, release date, knowledge cutoff, modalities, capabilities, provider availability and regions, benchmark scores, related models |
| **Compare (2–4 models)** | URL-backed selection (`?ids=`), specification table with best-value badges, benchmark matrix with comparability caveats, capability/modality presence matrix, validated token-cost estimator |
| **Leaderboard** | One benchmark at a time; best-first sorting per `higherIsBetter`; category filter; score bars only for `%` units; coverage and missing-result transparency |
| **Labs directory** | Searchable, paginated; lab profiles link to model portfolios |
| **Providers directory** | Searchable, paginated; provider profiles show availability, regions, listing-specific rates vs. list prices |
| **JSON API** | `/api/health`, `/api/models`, `/api/models/[slug]`, `/api/capabilities`, `/api/providers`, `/api/providers/[slug]`, `/api/labs`, `/api/labs/[slug]`, `/api/leaderboard`, `POST /api/compare` |
| **Data honesty** | Every model and result carries `verificationStatus`, `dataSource`, `sourceUrl`, `lastUpdated`, `isIllustrative`; seeded `sourceUrl` values are `null` (no fabricated citations) |
| **Accessibility** | Skip-to-content link, `sr-only` labels, `aria-label`/`aria-describedby`, `focus-visible` rings, `aria-current` on nav, focus-trapped mobile drawer with Escape handling |

---

## Screenshots

Capture these from your deployed instance for the README:

| # | Suggested screenshot | Where to capture |
|---|----------------------|------------------|
| 1 | Dashboard with stat cards and price/context leaders | `https://oneatlas-five.vercel.app/` |
| 2 | Model catalog with filters, sort, and pagination | `https://oneatlas-five.vercel.app/models` |
| 3 | Model detail page with providers and benchmarks | `https://oneatlas-five.vercel.app/models/gpt-5` |
| 4 | Compare page with best-value badges and cost estimator | `https://oneatlas-five.vercel.app/compare?ids=gpt-5,claude-opus-4-1` |
| 5 | Leaderboard with score bars and coverage panel | `https://oneatlas-five.vercel.app/leaderboard` |
| 6 | Labs directory | `https://oneatlas-five.vercel.app/labs` |
| 7 | Providers directory | `https://oneatlas-five.vercel.app/providers` |
| 8 | API health check JSON | `https://oneatlas-five.vercel.app/api/health` |

Add them here:

```markdown
![Dashboard](docs/screenshots/dashboard.png)
![Catalog](docs/screenshots/catalog.png)
![Model detail](docs/screenshots/model-detail.png)
![Compare](docs/screenshots/compare.png)
![Leaderboard](docs/screenshots/leaderboard.png)
![Labs](docs/screenshots/labs.png)
![Providers](docs/screenshots/providers.png)
```

---

## Architecture

```mermaid
flowchart TD
    subgraph Browser
        UI[Next.js App Router UI]
        MobileNav[Mobile drawer – focus trap, Escape]
    end

    subgraph App["Next.js 16 (App Router)"]
        RSC[Server Components – /, /models, /models/[slug], /compare, /leaderboard, /labs, /providers]
        RH[Route Handlers – /api/*]
    end

    subgraph Query["Query layer (lib/queries)"]
        QM[models.ts]
        QL[leaderboard.ts]
        QLA[labs.ts]
        QP[providers.ts]
        QC[capabilities.ts]
        QD[dashboard.ts]
    end

    subgraph Domain["Domain helpers (lib/)"]
        Pricing[pricing.ts – token cost maths]
        Compare[compare.ts – best-value & matrix helpers]
        Format[format.ts – presentation formatting]
        Serialize[serialize.ts – Decimal → number]
    end

    subgraph Validation["Validation (lib/schemas)"]
        Zod[Zod schemas – shared by pages + API]
    end

    subgraph Persistence
        Prisma[Prisma Client 6]
        DB[(PostgreSQL 17)]
    end

    subgraph Seed
        Seed[prisma/seed.ts – idempotent upsert]
    end

    UI --> RSC
    MobileNav --> UI
    RSC --> QM
    RSC --> QL
    RSC --> QLA
    RSC --> QP
    RH --> Zod
    RH --> QM
    QM --> Prisma
    QL --> Prisma
    QLA --> Prisma
    QP --> Prisma
    QC --> Prisma
    QD --> Prisma
    Pricing -.-> QM
    Compare -.-> QM
    Serialize --> QM
    Prisma --> DB
    Seed --> Prisma
    Seed -.-> DB
```

**Data flow rules:**
- Pages and API handlers share one query layer — they cannot drift apart on filtering or sorting.
- No page imports Prisma directly; all DB access lives in `lib/queries/*`.
- `lib/env.ts` validates `DATABASE_URL` at import time and fails with a readable message.
- Database-backed pages use `export const dynamic = "force-dynamic"`; no static prerendering requires a live DB at build time.

---

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, React Server Components) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL 17 |
| ORM | Prisma 6.19 (`prisma.config.ts`) |
| Validation | Zod |
| Icons | Lucide React |
| Charts/tables | Custom accessible tables + CSS score bars (no chart library) |
| Deployment | Vercel |
| Database host | Neon (managed PostgreSQL) |

---

## Schema overview

```
Lab 1 ───── n Model n ───── n BenchmarkResult n ───── 1 Benchmark
             │
             ├──── n ModelProvider n ───── 1 Provider
             └──── n ModelCapability n ───── 1 Capability
```

| Entity | Purpose | Key constraints |
|--------|---------|-----------------|
| `Lab` | Research organisation that develops models | `slug` unique; delete restricted while models reference it |
| `Provider` | Inference host or marketplace | `slug` unique; GIN index on `regions[]` |
| `Model` | Catalogue record: type, pricing, context, modalities, licence, provenance | `slug` unique; indexes on `labId`, `releaseDate`, `modelType+releaseDate`, `inputPricePerMTokUsd`, GIN `modalities[]` |
| `ModelProvider` | Availability join with optional provider-specific price overrides | Composite PK `(modelId, providerId)`; index `(providerId, isAvailable)`; cascades |
| `Capability` / `ModelCapability` | Normalised feature tags joined to models | Composite PK; index on `capabilityId`; cascades |
| `Benchmark` | Eval definition: category, unit, version, direction, provenance | `slug` unique; index on `category` |
| `BenchmarkResult` | One model's score on one benchmark | Unique `(modelId, benchmarkId)`; index `(benchmarkId, score DESC)`; cascades |

**Pricing units:** `inputPricePerMTokUsd` / `outputPricePerMTokUsd` mean **USD per 1,000,000 tokens**. Provider overrides use the same unit and are `null` when the provider uses the model list price. Embedding models may have an output price of 0.

**Provenance:** every model and benchmark result carries `verificationStatus` (`ILLUSTRATIVE` \| `UNVERIFIED` \| `VERIFIED` \| `STALE`), `dataSource`, optional `sourceUrl`, and `lastUpdated`. Seeded `sourceUrl` values are `null` — no fabricated citations.

---

## API

Full endpoint documentation, curl examples, response envelopes, and error codes live in [`docs/API.md`](docs/API.md).

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Database readiness probe |
| GET | `/api/models` | Search/filter/sort/paginate models |
| GET | `/api/models/[slug]` | Model detail with lab, providers, capabilities, benchmarks |
| GET | `/api/capabilities` | Capability definitions for filter controls |
| GET | `/api/providers` | Provider directory with model counts |
| GET | `/api/providers/[slug]` | Provider detail with served models and price overrides |
| GET | `/api/labs` | Lab directory with model counts |
| GET | `/api/labs/[slug]` | Lab detail with model portfolio |
| GET | `/api/leaderboard` | Benchmark results filtered by benchmark/category |
| POST | `/api/compare` | Compare 2–4 models in request order |

Error codes: `INVALID_QUERY` (400), `INVALID_BODY` (400), `INVALID_JSON` (400), `INVALID_SLUG` (400), `MODEL_NOT_FOUND` (404), `PROVIDER_NOT_FOUND` (404), `LAB_NOT_FOUND` (404), `MODELS_NOT_FOUND` (404), `DATABASE_UNAVAILABLE` (503).

---

## Local setup

### Prerequisites
- Node.js 20.12+ (developed on 24)
- Docker Desktop (or Docker Engine with Compose v2)

### Steps

```bash
# 1. Install dependencies (runs `prisma generate` via postinstall)
npm install

# 2. Create your local env file
cp .env.example .env

# 3. Start PostgreSQL and wait for it to become healthy
npm run db:up

# 4. Create the schema
npm run db:migrate

# 5. Load the illustrative catalog
npm run db:seed

# 6. Run the app
npm run dev
```

Open <http://localhost:3000>. `GET /api/health` reports database connectivity.

### Environment variables

`.env` is git-ignored. `.env.example` contains placeholder values only — never commit real credentials.

```bash
# Copy this file to `.env` and adjust values for your machine.
# `.env` is git-ignored. Never commit real credentials.

# --- PostgreSQL container (read by docker compose) ---
POSTGRES_USER=oneatlas
POSTGRES_PASSWORD=oneatlas_dev_password
POSTGRES_DB=oneatlas
POSTGRES_PORT=5432

# --- Prisma connection string (read by the app and Prisma CLI) ---
DATABASE_URL="postgresql://oneatlas:oneatlas_dev_password@localhost:5432/oneatlas?schema=public"

# --- Direct (non-pooled) connection for Prisma migrations ---
# Required in production when DATABASE_URL points to a pooled/serverless endpoint
# (e.g. Neon pooler). Locally this equals DATABASE_URL.
# DIRECT_URL="postgresql://oneatlas:oneatlas_dev_password@localhost:5432/oneatlas?schema=public"
```

| Variable | Read by | Required | Notes |
|----------|---------|----------|-------|
| `DATABASE_URL` | app + Prisma CLI | yes | Pooled/serverless connection in production; local Docker URL in development |
| `DIRECT_URL` | Prisma CLI (migrations/seed) | production | Direct connection for advisory locks during `migrate deploy` |
| `POSTGRES_*` | `docker-compose.yml` | local only | Container bootstrap values |

---

## Database commands

| Command | What it does |
|---------|--------------|
| `npm run db:up` | Start PostgreSQL in the background and wait for its healthcheck |
| `npm run db:down` | Stop the container (data kept in `oneatlas_pgdata` volume) |
| `npm run db:logs` | Follow database logs |
| `npm run db:reset` | Destructive: delete the volume and recreate an empty database |
| `npm run db:migrate` | Create/apply Prisma migrations (`migrate dev`) |
| `npm run db:deploy` | Apply migrations in production (`migrate deploy`) |
| `npm run db:seed` | Upsert the illustrative catalog (idempotent) |
| `npm run db:studio` | Open Prisma Studio |

Seed is repeatable: every record is upserted by unique slug, child rows are replaced, and records removed from the dataset are deleted. Re-running never creates duplicates.

---

## Checks

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run test        # unit tests (tsx + node:test) for lib/pricing.ts and lib/compare.ts
npm run build       # production build (runs db:deploy first)
npm run verify:api  # HTTP smoke test; requires a running dev server + seeded database
```

---

## Deployment to Vercel (Neon PostgreSQL)

OneAtlas has no local file or secret dependencies — all data comes from PostgreSQL — so it deploys to Vercel as long as `DATABASE_URL` is reachable from the build/runtime environment.

### 1. Provision the database

Create a managed PostgreSQL database (e.g. Neon). You will get two connection strings:

- **Direct** — plain `postgresql://` URL, used by Prisma for migrations/seed (advisory locks).
- **Pooled / serverless** — connection-string variant routed through Neon's pooler, used by the app at runtime in Vercel serverless functions.

Append `?sslmode=require` if your provider does not enable TLS by default.

### 2. Connect the repo to Vercel

1. Import the repository in Vercel.
2. Framework preset: Next.js (auto-detected; `vercel.json` pins the build command).
3. Build command: `npm run db:deploy && next build` (migrations run, then the app builds).
4. Install command: `npm install` (runs `postinstall` → `prisma generate`).

### 3. Add environment variables in Vercel

In **Project Settings → Environment Variables**, add for Production, Preview, and Development:

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | Pooled/serverless PostgreSQL connection string | Yes |
| `DIRECT_URL` | Direct (non-pooled) PostgreSQL connection string | Yes (for migrations) |

Do not commit these values. `.env` is git-ignored; only `.env.example` is tracked.

### 4. Seed production (one-time, after first deploy)

```bash
npx prisma db seed
```

Run from any machine that can reach the production `DATABASE_URL`/`DIRECT_URL`. Idempotent — safe to re-run.

### 5. Verify

- `GET /api/health` → `{ "status": "ok", "database": "connected" }`
- `GET /api/models` → 50 models on page 1

---

## Data caveats

- **All seeded data is illustrative.** Model names reflect publicly announced families, but prices, context windows, release dates, and benchmark scores are hand-entered approximations — not live vendor pricing or published benchmark results.
- **`verificationStatus: ILLUSTRATIVE`** on every seeded model and result.
- **`sourceUrl` is `null`** for the committed seed — no fabricated research or vendor citations are presented as links.
- **`dataSource`** carries a plain-text note: "Illustrative seed dataset — hand-entered approximations; not vendor pricing or published benchmark results."
- **No ingestion pipeline or live sync exists.** Replace `prisma/seed-data.ts` with a real ingestion pipeline (and set `verificationStatus` honestly) before presenting any numbers as fact.

---

## Limitations & future improvements

- **No authentication or rate limiting.** Open read-only API.
- **No full-text search.** `q` is case-insensitive substring matching; Postgres FTS would require a schema/migration change.
- **No unit-test runner originally.** Unit tests for `lib/pricing.ts` and `lib/compare.ts` were added using `node:test` + `tsx`; expanding coverage is a follow-up.
- **Standalone `/calculator`** is a `Coming Soon` placeholder (planned milestone); the compare page already includes a token-cost estimator.
- **No live data ingestion.** Seeded data must be replaced with a verified pipeline before production procurement use.
- **Serverless connection pooling.** On Vercel/Lambda-style hosts, use a pooled connection string (PgBouncer, Prisma Accelerate, or provider pooler) for `DATABASE_URL` and a direct connection for `DIRECT_URL`.
- **No Prisma deploy script.** `prisma migrate deploy` is wired into `vercel.json` via `db:deploy`; no separate npm script wraps it yet.