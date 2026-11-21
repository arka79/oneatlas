# Architecture

OneAtlas is a server-rendered Next.js App Router application backed by PostgreSQL through Prisma.
Catalog pages and JSON endpoints share one typed query layer in `lib/`, so they cannot drift apart
in filtering or sorting behaviour.

Status: **M0 foundation, M1 catalogue, M1.5 workspace shell, the M2 compare experience, and the M3
leaderboard + ecosystem directories complete.** Database-backed JSON endpoints for models,
providers, labs, leaderboard, and compare are live, along with the `/compare` UI, token-cost
estimator, benchmark-filtered `/leaderboard`, searchable `/labs` and `/providers` directories, and
their profile pages. Only the standalone `/calculator` remains a placeholder.

## Context-mapping status

**Graphify was not available in this environment**, so no graph was generated and no Graphify
command was run. Discovery performed on 2026-11-21:

| Check | Result |
|---|---|
| `command -v graphify` (PATH) | not found |
| `ls node_modules/.bin \| grep -i graph` | none |
| `npm ls -g --depth=0` | no graph package |
| `npx --no-install graphify --help` | "could not determine executable to run" |
| repo files matching `*graphif*` | none |
| `.agents/skills` | directory does not exist |
| Homebrew / pipx package lists | no graph package |

This document and [`CONTEXT_MAP.md`](CONTEXT_MAP.md) are therefore the map of record. They are
hand-maintained and should be updated at the end of every milestone.

## Runtime shape

```
Browser
  │
  ├── App Router pages (React Server Components)
  │      └── lib/queries/* ──► lib/db.ts (Prisma singleton) ──► PostgreSQL
  │
  └── fetch() to Route Handlers (/api/*)
         └── Zod validation ──► lib/queries/* ──► lib/db.ts ──► PostgreSQL

prisma/seed.ts ──► @prisma/client ──► PostgreSQL   (offline, run by a developer)
docker-compose.yml ──► local PostgreSQL 17 container (development only)
```

- **Server Components** query through `lib/queries/*`. The database client and `DATABASE_URL` never
  reach the browser.
- **Route Handlers** exist for machine-readable JSON, health checks, and future interactive features.
  They validate input with Zod and reuse the same query functions as pages.
- **`lib/env.ts`** validates `DATABASE_URL` once at import time and fails with a readable message,
  so a missing env var does not surface as a Prisma stack trace mid-request.

## Request and data flow

### Page request (current, `/` dashboard)

```
GET /
  → app/page.tsx (RSC, force-dynamic) inside components/layout/app-shell.tsx
  → lib/queries/dashboard.ts#getDashboardData()
      → one Promise.all: counts, newest 5, cheapest 3, largest-context 3,
        and model-type groupBy
      → DB error: logged, returns null (page renders setup commands, never crashes)
  → HTML: stat cards, recent releases, type mix, price/context leaders, discovery form,
    provenance note
```

### API request (database-backed surface)

```
GET /api/models?q=&lab=&provider=&type=&capability=&modality=&openWeights=&maxPrice=&sort=&page=&pageSize=
  → lib/schemas/model-search.ts (Zod + legacy sort alias canonicalisation)
  → lib/queries/models.ts: count → clamp page → Prisma where / orderBy / skip / take
  → 200 { data: ModelSummary[], meta: { page, pageSize, total, totalPages } }
  → 400 { error: { code: "INVALID_QUERY", message, details: { issues } } }
  → 503 { error: { code: "DATABASE_UNAVAILABLE", … } }

GET /api/models/[slug] → { data: ModelDetail } | 404 MODEL_NOT_FOUND
GET /api/capabilities → { data: CapabilityOption[] }
GET /api/providers?q=&page=&pageSize= → { data: ProviderSummary[], meta }
GET /api/providers/[slug] → { data: ProviderDetail } | 404 PROVIDER_NOT_FOUND
GET /api/labs?q=&page=&pageSize= → { data: LabSummary[], meta }
GET /api/labs/[slug] → { data: LabDetail } | 404 LAB_NOT_FOUND
GET /api/leaderboard?benchmark=&category=&sort=&page=&pageSize= → { data: LeaderboardRow[], meta }
POST /api/compare { slugs: [2–4] } → { data: { models }, meta: { requested, returned } }
```

- `lib/api/response.ts` owns the success/collection/error envelopes and the 503 logger.
- `lib/schemas/api-query.ts` owns page/pageSize/slug validation and safe `URLSearchParams` parsing;
  `lib/schemas/{directory-search,leaderboard-search,compare}.ts` define each endpoint's contract.
- Handlers contain no Prisma calls and no filter logic. Query modules use `select`/nested `select`,
  so list endpoints do not hydrate full model graphs.
- `POST /api/compare` validates 2–4 unique slugs, fetches them in one `slug IN (...)` query, returns
  them in request order, and reports missing slugs in `error.details.missing`.
- The `/models` explorer parses the same `parseModelSearchParams()` contract, builds `/api/models`
  requests, and shows validation issues in an alert instead of leaving a broken view.
- `/compare` parses `?ids=` with `parseCompareIds()`, loads detail payloads through
  `getModelsBySlugs()`, and loads picker options through `listModels()`. Every add/remove rewrites
  the URL, so the server re-renders the comparison and links stay shareable. No cookie, account, or
  local storage is involved.
- Model detail combines the cached `getModelBySlug()` read with `getRelatedModels()`: same lab
  first, then the same model type sharing at least one capability. Benchmark bars are drawn only
  when the unit is `%`, so no chart scale is invented for other units.
- `/api/health` remains a separate probe shape (`{status,database,latencyMs,timestamp}`).

## Layers

| Layer | Location | Responsibility |
|---|---|---|
| Routes / UI | `app/`, `components/` | Rendering, navigation, accessible markup |
| Query layer | `lib/queries/` | Prisma reads, filtering, pagination, Decimal→number serialization |
| Domain helpers | `lib/*.ts` | Pure functions (pricing maths, comparison metrics, formatting) |
| Persistence | `prisma/` | Schema, migrations, seed |
| Infra | `docker-compose.yml`, `.env.example` | Reproducible local PostgreSQL |

## App routes and page relationships

```
/  (dashboard: DB counts, recent releases, price/context leaders, discovery)
├── /models ──────────────► /models/[slug] ──► /compare            discover → detail → compare
│      (API explorer, M1.6)   (shipped, M1)      (URL-backed selection)
├── /compare ◄──────────── /models (selection bar)                  compare → detail/catalogue
├── /leaderboard ─────────► /models/[slug]                        leaderboard → detail
├── /labs ────────────────► /labs/[slug] ────► /models/[slug]     directory → portfolio
├── /providers ───────────► /providers/[slug] ► /models/[slug]    directory → offerings
├── /calculator ──────────► model selection from catalog          cost estimate
└── /api/health (JSON, not navigable)
```

All data sections except `/calculator` are real pages. `/calculator` still renders a `ComingSoon`
shell so the shared navigation never 404s, and is the only remaining placeholder. Unknown model,
lab, and provider slugs render their local `not-found.tsx` with a link back to the matching
directory.

## Interface shell and design tokens (M1.5)

The UI is a dark workspace: a persistent sidebar, a sticky top bar, and one content column. It is
built from semantic tokens in `app/globals.css` (surfaces, hairlines, text, one accent, four status
colours), Geist Sans for UI, and Geist Mono for prices and token counts. There are no gradients, hero
sections, decorative animation, or second accent colour; loading uses skeletons and the
`prefers-reduced-motion` override disables transitions.

| Concern | Implementation |
|---|---|
| Layout | `AppShell`: 240px sidebar at `lg+`, sticky 56px top bar, `max-w-6xl` content, footer |
| Navigation | `NAV_GROUPS` feeds both desktop and mobile nav; `NavLink` is the only active-route state |
| Active route | `usePathname` + `aria-current="page"`; prefix match keeps model detail under Models |
| Mobile | modal drawer: `role="dialog"`, `aria-modal`, Escape, focus trap, scroll lock, focus return |
| Search | `GET /models` form labelled “Search models”; it does not claim to search labs/providers |
| Primitives | `components/ui/*`: button, badge, card, alert, page header, empty state, stat card, skeleton |
| States | route-level `loading.tsx` for models, leaderboard, labs, and providers; local `not-found.tsx` for model/lab/provider detail; streamed missing detail pages use `noindex` |
| Provenance | sidebar/footer status plus `IllustrativeDataNote` on every data surface |

Icons are passed to primitives as rendered elements, not component references, so server components
can compose the client-boundary primitives without serializing functions. Client JavaScript covers
active-route detection, the mobile drawer, and the `/models` explorer; the dashboard and detail pages
stay server-rendered. URL query parameters remain the source of truth for catalogue state.

## Shared UI components

| Component | Used by | State |
|---|---|---|
| `components/layout/app-shell.tsx` | root layout | shipped M1.5 |
| `components/layout/sidebar.tsx` + `nav-items.ts` | desktop shell | shipped M1.5 |
| `components/layout/topbar.tsx` | app shell | shipped M1.5 (global model search) |
| `components/layout/mobile-nav.tsx` | top bar (`<lg`) | shipped M1.5 (focus-trapped drawer) |
| `components/layout/nav-link.tsx` | sidebar, drawer | shipped M1.5 (only client nav state) |
| `components/layout/brand.tsx` | sidebar, drawer | shipped M1.5 |
| `components/layout/site-footer.tsx` | app shell (data-provenance disclosure) | shipped |
| `components/coming-soon.tsx` | calculator | shipped (temporary; only placeholder left) |
| `components/ui/*` | shell, dashboard, catalogue, directories | shipped M1.5 |
| `components/ui/collection-pagination.tsx` | leaderboard, labs, providers | shipped M3 (preserves active filters) |
| `components/models/model-card.tsx` | `/models` grid | shipped M1; provider/capability cards + optional compare checkbox |
| `components/models/model-table.tsx` | `/models` table view | shipped M1.6 |
| `components/models/model-explorer.tsx` | `/models` | shipped M1.6 (client API explorer) |
| `components/models/tag.tsx` | card, detail header | shipped M1 |
| `components/models/provenance-note.tsx` | `/models`, `/models/[slug]` | shipped M1 |
| `components/models/provider-availability.tsx` | `/models/[slug]` | shipped M1/M3; availability, regions, prices, provider-profile links |
| `components/models/benchmark-table.tsx` | `/models/[slug]` | shipped M1; responsive score chart, `%`-only bars |
| `components/compare/compare-toolbar.tsx` | `/compare` | shipped M2 (client: URL-backed add/remove) |
| `components/compare/compare-table.tsx` | `/compare` | shipped M2 (specs + best-value badges) |
| `components/compare/benchmark-compare.tsx` | `/compare` | shipped M2 (matrix + comparability caveats) |
| `components/compare/capability-compare.tsx` | `/compare` | shipped M2 (modality/capability matrices) |
| `components/compare/cost-estimator.tsx` | `/compare` | shipped M2 (client: validated list-price estimate) |
| `components/leaderboard/leaderboard-filters.tsx` | `/leaderboard` | shipped M3 (GET form; category narrows one benchmark) |
| `components/leaderboard/leaderboard-table.tsx` | `/leaderboard` | shipped M3 (ranked rows; bars only for `%` scores) |
| `components/directory/directory-search.tsx` | `/labs`, `/providers` | shipped M3 (GET search form, URL-backed) |
| `components/directory/directory-card.tsx` | `/labs`, `/providers` | shipped M3 (shared card, real model count) |
| `components/directory/model-table.tsx` | lab/provider profiles | shipped M3 (shared rows; provider listing fields) |
| `components/calculator/*` | standalone calculator | planned M4 |

Primitives are added only when a real consumer exists; there is no speculative form library and no
theme toggle yet.

## API routes

| Route | Method | Status | Input | Output |
|---|---|---|---|---|
| `/api/health` | GET | shipped | none | 200/503 health JSON |
| `/api/models` | GET | shipped / expanded | `q,lab,provider,type,capability,modality,openWeights,maxPrice,sort,page,pageSize` | `{data,meta}`; 400 invalid query; 503 database |
| `/api/models/[slug]` | GET | shipped | slug | `{data: ModelDetail}`; 400 invalid slug; 404; 503 |
| `/api/capabilities` | GET | shipped API | none | `{data: CapabilityOption[]}` |
| `/api/providers` | GET | shipped API | `q,page,pageSize` | `{data: ProviderSummary[],meta}` |
| `/api/providers/[slug]` | GET | shipped API | slug | `{data: ProviderDetail}`; 404; 503 |
| `/api/labs` | GET | shipped API | `q,page,pageSize` | `{data: LabSummary[],meta}` |
| `/api/labs/[slug]` | GET | shipped API | slug | `{data: LabDetail}`; 404; 503 |
| `/api/leaderboard` | GET | shipped API | `benchmark,category,sort,page,pageSize` | `{data: LeaderboardRow[],meta:{…,filters}}` |
| `/api/compare` | POST | shipped API | `{slugs:[2–4 unique]}` | `{data:{models},meta:{requested,returned}}`; 400; 404 |
| `/api/playground` | POST | stretch | prompt + model id | streamed completion, needs a vendor key |

No authentication, rate limiting, or third-party AI calls exist in M0; nothing in the current app
requires an API key other than the database connection.

## Catalogue query contract (M1)

| Param | Values | Default | Behaviour |
|---|---|---|---|
| `q` | ≤80 chars | — | case-insensitive `contains` on model name, description, licence, and lab name |
| `lab` | lab slug | — | exact slug; an unknown slug returns an empty result set, not an error |
| `provider` | provider slug | — | models with a `ModelProvider` listing for that provider |
| `type` | `GENERAL REASONING CODING MULTIMODAL EMBEDDING` | — | exact `modelType` |
| `capability` | capability slug | — | `capabilities.some.capability.slug` |
| `modality` | `TEXT IMAGE AUDIO VIDEO CODE` | — | Postgres enum array `has` |
| `openWeights` | `true` / `false` | any | filters `isOpenWeights` |
| `maxPrice` | 0–10000 | — | `inputPricePerMTokUsd <= value` (first-party input price per 1M tokens) |
| `sort` | `release-date-desc/asc`, `name-asc`, `input-price-asc/desc`, `output-price-asc/desc`, `context-desc` | `release-date-desc` | name tie-breaker; legacy `newest`, `price-asc`, `price-desc` canonicalised |
| `page` | integer ≥ 1 | `1` | clamped to the last real page before the query runs |
| `pageSize` | 1–50 | `9` | catalogue grid defaults to nine; max 50 |

Blank values are treated as absent and unknown params are ignored, so campaign links do not break
the catalogue. The seeded 50-model catalogue paginates into six pages at the default 9-card size.

Filtering is intentionally unranked: `q` is substring matching, so the default order is labelled
"Newest release" rather than pretending it is relevance. Postgres full-text search would be a schema
and migration change, not a UI tweak.

Server pages do not import Prisma directly. Dashboard reads use `lib/queries/dashboard.ts`; model
detail reads use `lib/queries/models.ts`; `/models` reaches the database only through
`lib/api/client.ts` → route handlers. Every Prisma call stays in `lib/queries/*`.

## Prisma models and relation graph

```
Lab 1 ───── n Model n ───── n BenchmarkResult n ───── 1 Benchmark
                 │
                 ├──── n ModelProvider n ───── 1 Provider
                 └──── n ModelCapability n ───── 1 Capability
```

| Model | Key fields | Constraints |
|---|---|---|
| `Lab` | `slug` (unique), `name`, `description`, `websiteUrl`, `country`, `foundedYear` | index on `name`; deleting a lab with models is restricted |
| `Provider` | `slug` (unique), `name`, `description`, `websiteUrl`, `regions[]` | index on `name`, GIN on `regions` |
| `Model` | `slug` (unique), `labId`, `modelType`, `contextWindow`, `maxOutputTokens`, token prices, `modalities[]`, `isOpenWeights`, `license`, `dataSource`, `sourceUrl`, `lastUpdated`, `verificationStatus` | indexes on lab, release date, type+release date, input price, verification status, GIN modalities |
| `ModelProvider` | `modelId`, `providerId`, `isAvailable`, `availableRegions[]`, `notes`, optional price overrides | composite PK; index `(providerId,isAvailable)`; cascades from both sides |
| `Capability` | `slug` (unique), `name`, `description`, `category` | index on `category` |
| `ModelCapability` | `modelId`, `capabilityId`, optional `notes` | composite PK; index on `capabilityId`; cascades with model/capability |
| `Benchmark` | `slug` (unique), `category`, `unit`, `higherIsBetter`, `version`, `dataSource`, `sourceUrl`, `lastUpdated` | index on `category` |
| `BenchmarkResult` | `modelId`, `benchmarkId`, `score`, `dataSource`, `sourceUrl`, `lastUpdated`, `verificationStatus` | unique `(modelId,benchmarkId)`; index `(benchmarkId, score DESC)`, `modelId`, verification status; cascades |

Design notes:

- **Lab vs provider is intentional.** A lab *builds* a model; a provider *serves* it. Open-weight
  models are typically hosted by several providers, which is why `ModelProvider` is a join table.
- Prices are `Decimal(10, 4)` USD per 1M tokens. Components must receive plain numbers; conversion
  belongs in `lib/queries/*`.
- `ModelProvider` price overrides allow a host to differ from first-party pricing without
  duplicating the model row.
- `verificationStatus`, `dataSource`, `sourceUrl`, and `lastUpdated` are the provenance contract;
  the UI and API must surface them instead of implying live data. Seeded `sourceUrl` values are
  `null` rather than fabricated citations.
- `isIllustrative` is derived from `verificationStatus === "ILLUSTRATIVE"` for the existing API/UI
  shape, not stored twice.

## Data seeding and data-source assumptions

- `prisma/seed.ts` is **idempotent**: every record is upserted by unique slug, so re-running it
  refreshes the catalog without duplicates. Provider listings for each model are replaced, so
  removing a provider from a seed model is reflected.
- Dataset: 12 labs, 12 providers, 50 models, 7 benchmarks, 251 benchmark results, 9 capabilities.
- **All of it is illustrative.** Model names reflect publicly announced families, but prices,
  context windows, and benchmark scores are hand-entered approximations, not vendor or leaderboard
  data. `SEED_META` in `prisma/seed-data.ts` records the revision date (2026-11-01) and a warning.
- Seeded `sourceUrl` values are `null`; benchmark and model provenance is carried by `dataSource`
  and `verificationStatus`, so no fake research links are presented as citations.
- There is **no ingestion pipeline and no live sync**. The UI discloses seeded status in the footer
  and on the landing page. Any future live data needs a source, fetch timestamp, and confidence
  label before it replaces the seed.

## Core user flows

| Flow | Route path | Data required | Status |
|---|---|---|---|
| Discover | `/models` → `/models/[slug]` | paginated models filtered by lab/provider/type/capability/modality/weights/price, plus detail providers, benchmark chart, related models, and compare handoff | shipped (M1.6) |
| Compare | `/compare?ids=…` | selected models with pricing, context, providers, capabilities, benchmark scores, and a list-price token estimate | shipped M2 (URL-only selection) |
| Leaderboard | `/leaderboard?benchmark=…&category=…` | one benchmark's results ranked best-first, model + lab, coverage, direction and provenance | shipped M3 |
| Labs directory | `/labs` → `/labs/[slug]` → `/models/[slug]` | labs with search, model counts, and model portfolios | shipped M3 |
| Provider directory | `/providers` → `/providers/[slug]` → `/models/[slug]` | providers with search, model counts, availability, regions, and provider rates | shipped M3 |
| Cost calculation | `/compare` estimator; standalone `/calculator` planned | input/output token volumes × per-1M list pricing | estimator shipped; standalone page M4 |
| Live playground | `/playground` | external model API key, streaming | stretch, not committed |

## Environment variables

| Variable | Read by | Required | Notes |
|---|---|---|---|
| `DATABASE_URL` | app, Prisma CLI | yes | `postgresql://user:pass@host:5432/db?schema=public` |
| `POSTGRES_USER` | `docker-compose.yml` | local only | container bootstrap |
| `POSTGRES_PASSWORD` | `docker-compose.yml` | local only | dev-only default, not a secret |
| `POSTGRES_DB` | `docker-compose.yml` | local only | container bootstrap |
| `POSTGRES_PORT` | `docker-compose.yml` | local only | host port mapping |

`.env` is git-ignored (verified with `git check-ignore`); `.env.example` holds placeholders and is
not git-ignored, so it can ship with the repo. No vendor API keys are needed for the required MVP
features.

## Deployment dependencies

- **Node.js 20+** (developed on Node 24) and npm.
- **PostgreSQL reachable from the app runtime.** Local development uses Docker Compose
  (`postgres:17-alpine`); production must supply a managed Postgres URL in `DATABASE_URL`.
- **Build:** `npm install` runs `prisma generate` via `postinstall`; `npm run build` does not need a
  live database because catalog pages are dynamic. `prisma migrate deploy` is required in a deploy
  pipeline — no npm script wraps it yet (gap to close before first deploy).
- **Serverless note:** Prisma opens a pool per function instance. A pooled connection string
  (PgBouncer, Prisma Accelerate, or a provider pooler) is advisable on Vercel/Lambda-style hosts;
  plain `next start` on a long-lived server needs no extra layer.
- Docker is a **local-development** dependency only; production does not run the Compose file.
- No object storage, cache, queue, or email service is required for the MVP.

## Rendering and caching

Database-backed pages opt out of static prerendering (`export const dynamic = "force-dynamic"`)
because the catalog changes with migrations and seeding, and a build should not require a live
database. Next 16's `cacheComponents` / `partialPrefetching` defaults are disabled until there is an
explicit, tested caching strategy. The catalog is small; correctness is worth more than caching now.

## Decisions and trade-offs

- **Prisma 6.19 pinned** over 7 for the stable `prisma-client-js` generator and `migrate dev`
  workflow. `prisma.config.ts` owns the schema/seed paths and loads `.env` explicitly because Prisma
  6 config files skip automatic env loading.
- **PostgreSQL 17 image** rather than 18 for the conventional volume path.
- **Placeholder route only where honest.** `/calculator` names its milestone; every other nav
  destination is backed by real data.
- **Dark single theme.** Tokens are semantic, so a light theme needs a token override rather than
  component rewrites; a toggle is not in the brief and is deferred.
- **URL-driven filtering.** The `/models` explorer treats the query string as the source of truth
  for search, filters, sort, page, view, and comparison selection. It fetches the JSON API for
  results, so the browser and external clients share one contract. The trade-off is that the
  interactive catalogue requires JavaScript; the initial skeleton is server-rendered.
- **Selection lives in the URL.** `/compare?ids=…` is the source of truth for the two-to-four-model
  comparison; add/remove controls rewrite it, and `/models?compare=…` rehydrates the same selection
  in the explorer. There is no cookie, account, or local storage. The trade-off is that a selection
  is preserved only when a link carries it (for example compare → catalogue); opening an unrelated
  model detail page starts a fresh comparison.
- **Out-of-range pages are clamped** to the last real page before fetching, so deep links never show
  a confusing empty grid; the API reports the page it actually served.
- **Server-rendered directories, URL-backed state.** `/leaderboard`, `/labs`, and `/providers` read
  the query layer on the server; search forms and pagination are plain GET links/forms, so filtering
  works without client JavaScript. The interactive `/models` explorer remains client-side because
  it fetches the JSON API. The trade-off is two rendering strategies, but both share validation and
  query modules.
- **One benchmark at a time.** `/leaderboard` always resolves exactly one benchmark and ranks it
  using its declared `higherIsBetter` direction; category narrows the benchmark list. The page never
  adds scores from different benchmarks into a universal ranking. Scores are visualized with bars
  only for `%` units; other units stay numeric rather than inventing a scale. Missing results are
  reported as coverage and excluded from the ranking, never replaced with zero.
- **Detail loading accepts a soft 404.** `app/models/[slug]/loading.tsx` gives immediate feedback
  while the slug query resolves. Because Next starts streaming the fallback before `notFound()`,
  a missing model renders the not-found UI with `noindex` instead of a 404 HTTP status. The trade-off
  is explicit: the richer loading state wins for this internal catalogue, and crawlers are still told
  not to index the missing URL. Lab and provider detail routes follow the same pattern.
- **One serializer for every number.** `lib/serialize.ts` is the only place `Prisma.Decimal` becomes a
  number, and provider overrides keep their `null` case so "use list price" stays distinguishable
  from "free".
- **No unit-test runner yet.** Checks are `tsc --noEmit`, ESLint, a production build, and the
  repeatable `npm run verify:api` HTTP smoke test (filters, sorts, pagination, directories,
  leaderboard, compare, 400s, 404s). The token-cost maths and best-value helpers are pure in
  `lib/pricing.ts` and `lib/compare.ts`; they were checked with ad-hoc `tsx` assertions, and adding
  Vitest remains a follow-up where those unit tests have real value.
