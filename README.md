# OneAtlas

AI model discovery and intelligence platform — a Full Stack Engineer internship MVP.

OneAtlas lets you browse and filter AI models, compare them side by side, follow benchmark
standings, explore the labs and inference providers behind the catalog, and estimate token
costs. All catalog data is served from PostgreSQL through Prisma; nothing is hardcoded in the
frontend.

> **Data honesty:** the catalog ships with an **illustrative seed dataset** of 50 models, 12 labs,
> 12 providers, 7 benchmarks, and 251 benchmark results. Model names reflect publicly announced
> families, but prices, context windows, and benchmark scores are hand-entered approximations —
> not live vendor data and not verified results. Every seeded model and result carries
> `verificationStatus: ILLUSTRATIVE`, a `dataSource` note, an optional `sourceUrl` (null for the
> committed seed), and `lastUpdated`; the UI labels it as such.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, React Server Components) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL 17 (Docker Compose) |
| ORM | Prisma 6.19 (`prisma.config.ts`) |
| Validation | Zod |
| Icons | Lucide |
| UI tables / charts | Custom accessible tables and CSS score bars (no chart library) |

## Prerequisites

- Node.js 20.12+ (developed on 24)
- Docker Desktop (or another Docker Engine with Compose v2)

## Data model

The schema lives in `prisma/schema.prisma` and is configured for **Prisma 6.19** through
`prisma.config.ts` (the Prisma 6 config file). Do not paste a Prisma 7 setup over it without
following the Prisma 7 migration guide.

| Entity | Purpose |
|---|---|
| `Lab` | Research organisation that develops models. Slug is unique; deleting a lab is restricted while models reference it. |
| `Provider` | Inference host or marketplace. Slug is unique. |
| `Model` | Catalogue record: `modelType`, description, release date, context window, max output, token pricing, modalities, licence, open-weights flag, and provenance. |
| `ModelProvider` | Many-to-many availability join with optional provider-specific price overrides, regional coverage, notes, and `isAvailable`. |
| `Capability` / `ModelCapability` | Normalised feature tags (tool use, prompt caching, extended thinking, …) joined to models. |
| `Benchmark` | Eval definition with category, unit, version, score direction, and provenance. |
| `BenchmarkResult` | One model's score on one benchmark (unique per model/benchmark) with provenance and verification status. |

**Pricing units:** `inputPricePerMTokUsd` and `outputPricePerMTokUsd` mean **USD per 1,000,000
tokens**. Provider overrides use the same unit. Embedding models may have an output price of 0;
there is no per-image or per-request pricing in this schema.

Every entity has `createdAt`/`updatedAt`. Indexes cover unique slugs, lab, release date, model
type, input price, verification status, GIN arrays for modalities and provider regions, and
benchmark leaderboard ordering. `ModelProvider` and the capability/result joins cascade on
delete; `Model.lab` is restricted so a lab cannot be removed while its models exist.

## Setup

```bash
# 1. Install dependencies (runs `prisma generate`)
npm install

# 2. Create your local env file
cp .env.example .env

# 3. Start PostgreSQL and wait for it to become healthy
npm run db:up

# 4. Create the schema (generates a migration on first run)
npm run db:migrate

# 5. Load the illustrative catalog
npm run db:seed

# 6. Run the app
npm run dev
```

Open <http://localhost:3000>. `GET /api/health` reports database connectivity.

## Database commands

| Command | What it does |
|---|---|
| `npm run db:up` | Start PostgreSQL in the background and wait for its healthcheck |
| `npm run db:down` | Stop the container (data is kept in the `oneatlas_pgdata` volume) |
| `npm run db:logs` | Follow database logs |
| `npm run db:reset` | **Destructive:** delete the volume and recreate an empty database |
| `npm run db:migrate` | Create/apply Prisma migrations |
| `npm run db:seed` | Upsert the illustrative catalog (idempotent) |
| `npm run db:studio` | Open Prisma Studio |

### Creating and applying migrations

```bash
npx prisma migrate dev --name describe_change   # create + apply in development
npx prisma migrate deploy                       # apply committed migrations in CI/production
npm run db:seed                                 # upsert the illustrative catalog
```

`prisma.config.ts` points Prisma at the schema and the seed command. The seed is repeatable: it
upserts by slug, replaces child rows, and removes records no longer present in
`prisma/seed-data.ts`.

**If database credentials are unavailable**, migrations and seed cannot be applied. Start
Postgres with `npm run db:up` (or point `DATABASE_URL` at an accessible PostgreSQL database),
then run `npm run db:migrate` and `npm run db:seed`. A connection failure is not a successful
migration — check `npx prisma migrate status` and `GET /api/health` before relying on the data.

`DATABASE_URL` and the container's `POSTGRES_*` values live in `.env`, which is git-ignored.
`.env.example` contains placeholders only; the committed values are local-development defaults,
not secrets. Never commit a real `DATABASE_URL`.

## API

See [`docs/API.md`](docs/API.md) for the full contract, curl examples, and response envelopes.
All endpoints read PostgreSQL through `lib/queries/*`:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/models` | Search/filter/sort/paginate models by lab, provider, type, capability, modality, weights, and price |
| GET | `/api/models/[slug]` | Model detail with lab, provider availability, capabilities, and benchmarks |
| GET | `/api/capabilities` | Capability definitions used by the catalogue filter |
| GET | `/api/providers`, `/api/providers/[slug]` | Provider directory and served models |
| GET | `/api/labs`, `/api/labs/[slug]` | Lab directory and model portfolio |
| GET | `/api/leaderboard` | Benchmark results filtered by benchmark/category |
| POST | `/api/compare` | Compare 2–4 models in request order |

With the dev server running, `npm run verify:api` exercises every endpoint and its error paths.

## Compare workflow

`/compare` puts two to four models side by side. The selection is stored in the URL as
`?ids=slug-a,slug-b` — there is no account, cookie, or local-storage state. Invalid or duplicate
slugs are ignored, and only the first four valid slugs are used.

From discovery, tick the comparison checkboxes on `/models` and choose **Compare selected** (the
explorer keeps `?compare=…` in the URL while you filter). From a model detail page, choose
**Compare this model**, then add another with the picker. **Browse catalogue** on `/compare`
returns to `/models` with the same selection pre-filled.

The page shows model names, labs, and available providers; input and output list prices; context
windows and max output; licence/weights and modalities; a capability presence matrix; and a
benchmark matrix grouped by benchmark. "Lowest", "Largest", and "Top score" badges appear only
when at least two selected models have a comparable value. Missing results are shown as `—` with
caveats, and benchmark wins are never highlighted across different benchmarks.

The token cost estimator accepts whole, non-negative input and output token counts (commas are
allowed) and calculates `tokens ÷ 1,000,000 × price` per model. It highlights the cheapest total
only when two or more list prices are usable, reports unavailable prices explicitly, and labels
every figure as an estimate. It uses model list prices only; provider-specific overrides, caching
and batch discounts, volume agreements, minimum charges, taxes, and other fees are excluded.

### Try it manually

1. Start PostgreSQL, migrate, seed, and run the dev server as described in [Setup](#setup).
2. Open <http://localhost:3000/models>, tick two to four models, and choose **Compare selected**.
3. Confirm the specification, benchmark, capability, and estimator sections render, and that
   **Browse catalogue** preserves the selection.
4. On `/compare`, add and remove models with the picker/chips. The URL should update each time and
   a refresh should keep the selection. At four models the picker is disabled.
5. Enter `1,000,000` input tokens and `500,000` output tokens, then **Calculate estimate**. For a
   model priced at $1.25/1M input and $10/1M output, the estimate should be $6.25 (plus a
   **Cheapest** badge on the lowest total).
6. Check validation with a blank field, `1.5`, `-1`, and `abc`; each should show an inline error and
   no results. `0` in both fields is rejected because it produces no meaningful workload.
7. Check edge cases: `/compare` (picker plus empty state), `/compare?ids=gpt-5` (asks for one more
   model), `/compare?ids=gpt-5,not-a-model` (warning lists the unknown slug), and a link with five
   ids (first four are compared).

## Leaderboard and ecosystem directories

`/leaderboard` ranks models within **one benchmark at a time**. The page resolves a benchmark from
the URL (`?benchmark=mmlu`), optionally narrowed by category (`?category=Coding`), and always sorts
best-first using that benchmark's recorded `higherIsBetter` direction. A benchmark context panel
shows its name, description, category, version, unit, direction, result coverage, and provenance.
Model rows show rank, lab, type, context window, and score; percentage benchmarks also get a
0–100% bar. Missing results are never treated as zero and are never filled with a synthetic score.
There is no combined universal ranking across benchmarks.

`/labs` and `/providers` are searchable, paginated directories backed by the real `Lab` and
`Provider` tables. Search matches the same fields as the public API (lab name/description/country;
provider name/description). Lab profiles at `/labs/[slug]` list that lab's models; provider
profiles at `/providers/[slug]` use the `ModelProvider` join to show availability, regions, notes,
and provider-specific rates alongside each model. Model, lab, and provider links connect the
sections; model detail also links back to its lab and provider profiles.

### Try it manually

1. Open <http://localhost:3000/leaderboard>. Confirm the default benchmark has a context card, the
   ranked rows are ordered best-first, percentage scores have bars, and pagination preserves the
   benchmark.
2. Change **Category** to `Coding` and apply; the benchmark list should narrow and the page should
   select a benchmark with recorded results. Switch to `MMLU`, then page forward. Confirm the URL
   contains the benchmark and page, and that every row is from that benchmark.
3. Try `/leaderboard?benchmark=not-real` and `/leaderboard?category=not-real`; both should show a
   visible warning and fall back to a valid benchmark. Confirm the context card shows how many
   catalogue models have no recorded result — those models must not appear as zero scores.
4. Open <http://localhost:3000/labs>, search `openai`, clear the search, and page to page 2. Open a
   lab profile and confirm its model rows link to `/models/[slug]`. Try `/labs/not-a-lab`.
5. Open <http://localhost:3000/providers>, search `groq`, and page through the directory. Open
   `/providers/amazon-bedrock` and confirm the table shows availability, regions, and provider-rate
   overrides alongside list prices. Try `/providers/not-a-provider`.
6. On a model detail page, follow the lab name to its profile and the provider name to its provider
   profile. Confirm the sidebar links to Leaderboard, Labs, and Providers all resolve.

## Checks

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run test        # unit tests (tsx + node:test)
npm run build       # production build (needs the database running)
npm run verify:api  # HTTP smoke test; requires a running dev server
```

## Deploy to Vercel (Neon PostgreSQL)

OneAtlas is a Next.js App Router app backed by PostgreSQL through Prisma. It has no
local file or secret dependencies — all data comes from the database — so it deploys
to Vercel as long as `DATABASE_URL` is reachable from the build/runtime environment.

### 1. Provision the database

Create a managed PostgreSQL database (e.g. Neon). You will get two connection strings:

- **Direct** — a plain `postgresql://` URL, used by Prisma for migrations/seed.
- **Pooled / serverless** — a connection-string variant that Neon routes through its
  connection pooler, used by the app at runtime in Vercel serverless functions.

Append `?sslmode=require` to either string if your provider does not enable TLS by default.

### 2. Connect the Git repo to Vercel

- Import the repository in Vercel.
- Framework preset: Next.js (auto-detected; `vercel.json` pins the build command).
- Build command: `npm run db:deploy && next build` (runs Prisma migrations, then builds).
- Install command: `npm install` (runs `postinstall` → `prisma generate`).

### 3. Add environment variables in Vercel

In **Project Settings → Environment Variables**, add (Production, Preview, Development):

| Variable | Value | Required |
|---|---|---|
| `DATABASE_URL` | Pooled/serverless PostgreSQL connection string | Yes |
| `DIRECT_URL` | Direct (non-pooled) PostgreSQL connection string | Yes (for migrations) |

Do not commit these values. `.env` is git-ignored; only `.env.example` (placeholders) is tracked.

Prisma uses `DIRECT_URL` automatically for `prisma migrate deploy` when `DATABASE_URL`
is a pooled connection, so migrations run safely on a single direct connection during build.

### 4. Run the seed (one-time, after first deploy)

The seed (`prisma/seed.ts`) is idempotent: every record is upserted by its unique slug,
so re-running it never creates duplicates. After the first successful deployment, run:

```bash
npx prisma db seed
```

You can run this from the Vercel CLI against your production database, or from any
machine that can reach the production `DATABASE_URL`/`DIRECT_URL`. Re-running later is
safe and will refresh the catalog to match `prisma/seed-data.ts`.

### 5. Verify

- `GET /api/health` should return `{ "status": "ok", "database": "connected" }`.
- `GET /api/models` should return 50 models on the first page.
- Open the production URL and confirm the dashboard, catalog, compare, leaderboard, labs,
  and providers pages load.

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Build fails at `prisma migrate deploy` | `DATABASE_URL` is a pooled connection and Prisma needs a direct one | Set `DIRECT_URL` to the direct endpoint in Vercel |
| `DATABASE_URL is required` at build | Env var not set in Vercel | Add `DATABASE_URL` (and `DIRECT_URL`) to project settings |
| 503 on `/api/health` | Database unreachable from Vercel / wrong password | Verify the connection string and that Neon allows connections from Vercel IPs |
| Migrations "already applied" errors | `prisma migrate deploy` re-run on a migrated DB | Expected — it is idempotent and no-ops when migrations are current |
| Seed creates duplicates | Seed is not idempotent | It is idempotent by design; duplicates indicate an older seed version |

## Project layout

```
app/                 routes, layout, API handlers
  api/health/        database readiness probe
components/          reusable UI (layout/, catalog/, …)
lib/                 db client, env validation, query layer, domain helpers
prisma/              schema, migrations, seed script + illustrative dataset
docs/                API contract, architecture, and context map
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and
[`docs/CONTEXT_MAP.md`](docs/CONTEXT_MAP.md) for entities, routes, and dependency relationships.

## Milestones

0. **Foundation** — scaffold, Docker Postgres, Prisma schema, seed, health check, docs ✅
1. **Model catalogue** — discovery (search, filter, sort, pagination), model detail pages, `/api/models` and `/api/models/[slug]` ✅
2. **Read API surface** — models, providers, labs, leaderboard, and compare endpoints over PostgreSQL ✅
3. **Compare experience** — URL-backed selection from discovery and detail, best-value highlighting, benchmark comparability caveats, and an interactive token-cost estimator ✅
4. **Leaderboard and ecosystem directories** — benchmark/category-filtered rankings with score bars and coverage caveats; searchable lab and provider directories with linked profile pages and model listings ✅
5. Standalone `/calculator`, accessibility/responsive polish, live playground (stretch)
