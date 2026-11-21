# Context map

Compact orientation map for OneAtlas. Companion to [`ARCHITECTURE.md`](ARCHITECTURE.md).

> **Graphify was not available in this environment.** No graph tool was installed (checked PATH,
> local and global npm, `npx --no-install`, repo files, project skills, Homebrew, pipx), so no
> Graphify command was run and no generated graph exists. This map is hand-maintained from the
> source tree and must be updated after each milestone. Details in `ARCHITECTURE.md`.

Current state: **M0 foundation, M1 catalogue, M1.5 workspace shell, M1.6 API-backed discovery, the
M2 compare experience, and the M3 leaderboard + ecosystem directories complete.** The dashboard,
model discovery, enriched model detail, side-by-side comparison with a token-cost estimator,
benchmark-filtered rankings, searchable lab/provider directories with profile pages, and JSON APIs
are live. Only the standalone calculator remains an honest in-progress placeholder.

## Reading order

1. `README.md` — setup, database commands, data-honesty note
2. `prisma/schema.prisma` — entities everything else derives from
3. `prisma/seed-data.ts` — what is actually in the database (illustrative)
4. `lib/env.ts` → `lib/db.ts` → `lib/queries/models.ts` — the data path
5. `lib/schemas/model-search.ts` — the URL contract shared by page and API
6. `app/models/(list)/page.tsx` → `app/models/[slug]/page.tsx` — the shipped flows
7. `docs/API.md` — endpoint contracts, envelopes, curl examples
8. `app/api/*` — typed route handlers over `lib/queries/*`
9. `docs/ARCHITECTURE.md` — decisions, flows, deployment

## Route → files → data

| Route | Page file | Shared components | Data dependency | State |
|---|---|---|---|---|
| `/` | `app/page.tsx` | app shell, stat cards, recent-release list, type mix, price/context leaders | `getDashboardData()`; degrades to setup guidance | shipped (dashboard) |
| `/api/health` | `app/api/health/route.ts` | — | `prisma.$queryRaw\`SELECT 1\`` | shipped |
| `/models` | `app/models/(list)/page.tsx` | client explorer, cards/table, comparison bar, provenance note | `GET /api/models`, `/api/labs`, `/api/providers`, `/api/capabilities`; selection hands off to `/compare?ids=` | shipped M1.6 |
| `/models/[slug]` | `app/models/[slug]/page.tsx` (+ `loading.tsx`, `not-found.tsx`) | capability list, provider availability, benchmark chart, related model cards, compare link, provenance note | `getModelBySlug(slug)` + `getRelatedModels()` | shipped M1, enriched |
| `/api/models` | `app/api/models/route.ts` | — | `parseModelSearchParams()` → `listModels()` | shipped M1, expanded API |
| `/api/models/[slug]` | `app/api/models/[slug]/route.ts` | — | `getModelBySlug()` | shipped M1, envelope update |
| `/api/capabilities` | `app/api/capabilities/route.ts` | — | `listCapabilities()` | shipped API |
| `/api/providers` | `app/api/providers/route.ts` | — | `listProviders()` | shipped API |
| `/api/providers/[slug]` | `app/api/providers/[slug]/route.ts` | — | `getProviderBySlug()` | shipped API |
| `/api/labs` | `app/api/labs/route.ts` | — | `listLabs()` | shipped API |
| `/api/labs/[slug]` | `app/api/labs/[slug]/route.ts` | — | `getLabBySlug()` | shipped API |
| `/api/leaderboard` | `app/api/leaderboard/route.ts` | — | `listLeaderboard()` | shipped API |
| `/api/compare` | `app/api/compare/route.ts` | — | `getModelsBySlugs()` | shipped POST API (the page uses the query layer directly) |
| `/compare` | `app/compare/page.tsx` | `components/compare/*`, provenance note | `getModelsBySlugs(?ids=)` + `listModels()` for the picker | shipped (URL-backed 2–4 model selection) |
| `/leaderboard` | `app/leaderboard/page.tsx` (+ `loading.tsx`) | `components/leaderboard/{leaderboard-filters,leaderboard-table}.tsx`, pagination, provenance note | `getBenchmarkCatalog()` + `listLeaderboard()`; one resolved benchmark | shipped M3 |
| `/labs` | `app/labs/page.tsx` (+ `loading.tsx`) | `components/directory/{directory-card,directory-search}.tsx`, pagination | `listLabs(q,page)` | shipped M3 |
| `/labs/[slug]` | `app/labs/[slug]/page.tsx` (+ `loading.tsx`, `not-found.tsx`) | `components/directory/model-table.tsx` | `getLabBySlug(slug)` | shipped M3 |
| `/providers` | `app/providers/page.tsx` (+ `loading.tsx`) | `components/directory/{directory-card,directory-search}.tsx`, pagination | `listProviders(q,page)` | shipped M3 |
| `/providers/[slug]` | `app/providers/[slug]/page.tsx` (+ `loading.tsx`, `not-found.tsx`) | `components/directory/model-table.tsx` | `getProviderBySlug(slug)` + `ModelProvider` listing fields | shipped M3 |
| `/calculator` | `app/calculator/page.tsx` | `ComingSoon` | planned: standalone model pricing | placeholder (M4) |

Page relationships:

```
home ──► models list ──► model detail ──► /compare (URL-backed selection)
  │           │                ▲
  ├──► leaderboard ────────────┘
  ├──► labs ──► lab detail ────┘
  ├──► providers ──► provider detail ──► model detail
  └──► calculator (select models from catalog)
```

## Shared component inventory

| Component | Consumers | Notes |
|---|---|---|
| `components/layout/app-shell.tsx` | root layout | sidebar + top bar + content column + footer |
| `components/layout/sidebar.tsx` | desktop shell | grouped nav, dataset status, version |
| `components/layout/topbar.tsx` | shell | sticky, global model search form |
| `components/layout/mobile-nav.tsx` | top bar (<lg) | client drawer: focus trap, Escape, scroll lock |
| `components/layout/nav-link.tsx` | sidebar + drawer | client active-route state via `usePathname` |
| `components/layout/nav-items.ts` | shell | single source for nav groups |
| `components/layout/brand.tsx` | sidebar + drawer | logo/wordmark |
| `components/layout/site-footer.tsx` | shell | seeded-data disclosure |
| `components/ui/{button,badge,card,alert,page-header,empty-state,stat-card,skeleton}.tsx` | shell, dashboard, catalogue, directories | shared primitives |
| `components/ui/collection-pagination.tsx` | leaderboard, labs, providers | shared Previous/Next pagination; preserves filters |
| `components/coming-soon.tsx` | calculator | temporary shell |
| `components/models/model-card.tsx` | `/models` | card + optional comparison checkbox; whole card links to detail |
| `components/models/model-table.tsx` | `/models` | responsive table + comparison checkboxes |
| `components/models/model-explorer.tsx` | `/models` | client explorer; URL-backed filters, sort, page, view, and compare selection |
| `components/models/tag.tsx` | card, detail header | modality / weights / provider chips |
| `components/models/provenance-note.tsx` | list, detail | required illustrative-data disclosure |
| `components/models/provider-availability.tsx` | detail | availability, listing-specific regions, applicable prices, provider-profile links |
| `components/models/benchmark-table.tsx` | detail | responsive score chart; bars only for `%` units |
| `components/compare/compare-toolbar.tsx` | `/compare` | client: add/remove models by rewriting the URL |
| `components/compare/compare-table.tsx` | `/compare` | specifications + best-value badges |
| `components/compare/benchmark-compare.tsx` | `/compare` | benchmark matrix + comparability caveats |
| `components/compare/capability-compare.tsx` | `/compare` | modality/capability presence matrices |
| `components/compare/cost-estimator.tsx` | `/compare` | client: validated token-cost estimate |
| `components/leaderboard/leaderboard-filters.tsx` | `/leaderboard` | GET filter form; category narrows one benchmark |
| `components/leaderboard/leaderboard-table.tsx` | `/leaderboard` | ranked rows, score bars only for `%`, lab/model links |
| `components/directory/directory-search.tsx` | `/labs`, `/providers` | GET search form; URL-backed term |
| `components/directory/directory-card.tsx` | `/labs`, `/providers` | shared lab/provider card with real model count |
| `components/directory/model-table.tsx` | lab + provider profiles | shared model rows; provider mode adds listing availability/rates |
| `components/calculator/*` | standalone calculator | planned M4 |

The dashboard and model detail pages remain server-rendered. `/models` is a client explorer that
fetches the JSON API; filters, sort, page, view, and comparison selection live in the URL. Client
JavaScript also covers active nav and the mobile drawer. `components/ui/*` primitives are shared by
the shell, dashboard, and catalogue; icons are passed as elements to avoid RSC function serialization.

## Import / dependency graph (current)

```
app/layout.tsx
├── app/globals.css                       dark-first @theme tokens + base layer
└── components/layout/app-shell.tsx
    ├── components/layout/sidebar.tsx
    │   ├── components/layout/brand.tsx
    │   ├── components/layout/nav-items.ts
    │   └── components/layout/nav-link.tsx       (client: usePathname)
    ├── components/layout/topbar.tsx
    │   └── components/layout/mobile-nav.tsx     (client: drawer + focus trap)
    └── components/layout/site-footer.tsx

app/models/(list)/page.tsx
├── components/models/model-explorer.tsx        (client)
│   ├── components/models/{model-card,model-table}.tsx
│   ├── lib/api/client.ts → /api/models, /api/labs, /api/providers,
│   │                         /api/capabilities; compare hands off via ?ids=
│   └── lib/schemas/model-search.ts             Zod schema + URL builders
└── components/ui/* + lib/format.ts

app/models/[slug]/page.tsx                (+ generateMetadata, loading.tsx, not-found.tsx)
├── components/models/{provider-availability,benchmark-table,provenance-note,tag,model-card}.tsx
└── lib/queries/models.ts → getModelBySlug() (React cache) + getRelatedModels()
    (same lab first, then same type + shared capability)

app/api/models/route.ts
├── lib/api/response.ts
├── lib/schemas/model-search.ts
└── lib/queries/models.ts

app/api/models/[slug]/route.ts
├── lib/api/response.ts
├── lib/schemas/api-query.ts
└── lib/queries/models.ts

app/api/capabilities/route.ts
├── lib/api/response.ts
└── lib/queries/capabilities.ts

app/api/providers/route.ts + app/api/providers/[slug]/route.ts
├── lib/api/response.ts
├── lib/schemas/{api-query,directory-search}.ts
└── lib/queries/providers.ts

app/api/labs/route.ts + app/api/labs/[slug]/route.ts
├── lib/api/response.ts
├── lib/schemas/{api-query,directory-search}.ts
└── lib/queries/labs.ts

app/api/leaderboard/route.ts
├── lib/api/response.ts
├── lib/schemas/{api-query,leaderboard-search}.ts
└── lib/queries/leaderboard.ts

app/api/compare/route.ts
├── lib/api/response.ts
├── lib/schemas/{api-query,compare}.ts
└── lib/queries/models.ts#getModelsBySlugs

app/compare/page.tsx
├── components/compare/{compare-toolbar,compare-table,benchmark-compare,capability-compare,cost-estimator}.tsx
├── lib/queries/models.ts → getModelsBySlugs() + listModels() (picker)
└── lib/{compare,pricing,format}.ts + lib/schemas/compare.ts

app/leaderboard/page.tsx
├── components/leaderboard/{leaderboard-filters,leaderboard-table}.tsx
├── components/ui/{alert,badge,button,collection-pagination,empty-state,page-header}
└── lib/queries/leaderboard.ts → getBenchmarkCatalog() + listLeaderboard()

app/labs/page.tsx — components/directory/{directory-card,directory-search}.tsx → listLabs()
app/labs/[slug]/page.tsx — components/directory/model-table.tsx → getLabBySlug()
app/providers/page.tsx — components/directory/{directory-card,directory-search}.tsx → listProviders()
app/providers/[slug]/page.tsx — components/directory/model-table.tsx → getProviderBySlug()

app/calculator/page.tsx
└── components/coming-soon.tsx

prisma/seed.ts
├── prisma/seed-data.ts
└── @prisma/client → PostgreSQL

prisma/schema.prisma → migration → tables read by lib/queries/*
docker-compose.yml → postgres:17-alpine, volume oneatlas_pgdata
```

No page imports another page; navigation is via `next/link` only. No page or component imports
Prisma or `lib/db` — that boundary is what keeps page and API behaviour identical.

## API routes and request/response flow

| Route | Method | Status | Request | Response |
|---|---|---|---|---|
| `/api/health` | GET | shipped | — | 200 `{status:"ok",database:"connected",latencyMs,timestamp}` or 503 `{status:"degraded",database:"unreachable",…}` |
| `/api/models` | GET | shipped / expanded | `q, lab, provider, type, capability, modality, openWeights, maxPrice, sort, page, pageSize` | 200 `{data: ModelSummary[], meta:{page,pageSize,total,totalPages}}`; 400 `{error:{code,message,details}}`; 503 `{error:{code:"DATABASE_UNAVAILABLE"}}` |
| `/api/models/[slug]` | GET | shipped / envelope update | slug | 200 `{data: ModelDetail}`; 400 `INVALID_SLUG`; 404 `MODEL_NOT_FOUND`; 503 |
| `/api/capabilities` | GET | shipped API | — | 200 `{data: CapabilityOption[]}` |
| `/api/providers` | GET | shipped API | `q, page, pageSize` | 200 `{data: ProviderSummary[], meta}` |
| `/api/providers/[slug]` | GET | shipped API | slug | 200 `{data: ProviderDetail}`; 404 `PROVIDER_NOT_FOUND` |
| `/api/labs` | GET | shipped API | `q, page, pageSize` | 200 `{data: LabSummary[], meta}` |
| `/api/labs/[slug]` | GET | shipped API | slug | 200 `{data: LabDetail}`; 404 `LAB_NOT_FOUND` |
| `/api/leaderboard` | GET | shipped API | `benchmark, category, sort, page, pageSize` | 200 `{data: LeaderboardRow[], meta:{…,filters}}` |
| `/api/compare` | POST | shipped API | `{slugs:[2–4 unique slugs]}` | 200 `{data:{models},meta:{requested,returned}}`; 400; 404 `MODELS_NOT_FOUND` |
| `/api/playground` | POST | stretch | prompt + model | streamed completion (needs external key) |

Server pages and JSON handlers share the same query layer below validation. The interactive
catalogue always enters through `/api/models`, so the browser and API use one filter, sort, and
pagination contract. The leaderboard, lab, and provider pages are server-rendered and read through
`lib/queries/*` directly; their GET forms and pagination links keep state in the URL. Handlers
contain no Prisma calls and no filter logic. Invalid URL filters are shown in an alert, with the
page falling back to a valid default instead of leaving a broken view.

## Catalogue query rules (M1)

| Param | Allowed | Default | Note |
|---|---|---|---|
| `q` | ≤80 chars | — | substring match on model, description, licence, lab name |
| `lab` / `provider` | slug | — | unknown slug → empty list, not an error |
| `type` | `GENERAL REASONING CODING MULTIMODAL EMBEDDING` | — | exact `modelType` |
| `capability` | capability slug | — | `capabilities.some.capability.slug` |
| `modality` | `TEXT IMAGE AUDIO VIDEO CODE` | — | enum array `has` |
| `openWeights` | `true` / `false` | any | `isOpenWeights` |
| `maxPrice` | 0–10000 | — | input price per 1M ≤ value (inclusive) |
| `sort` | `release-date-desc/asc`, `name-asc`, `input-price-asc/desc`, `output-price-asc/desc`, `context-desc` | `release-date-desc` | name tie-breaker; legacy `newest`, `price-asc`, `price-desc` canonicalised |
| `page` | ≥ 1 | `1` | clamped to last page |
| `pageSize` | 1–50 | `9` | catalogue card grid |

Blank values are ignored; unknown params are ignored. `q` is not ranked — the default is labelled
"Release date (newest)" rather than "relevance".

## Prisma relation graph

```
Lab 1 ───── n Model n ───── n BenchmarkResult n ───── 1 Benchmark
                 │
                 ├──── n ModelProvider n ───── 1 Provider
                 └──── n ModelCapability n ───── 1 Capability
```

| Model | Unique | Relations | Indexes |
|---|---|---|---|
| `Lab` | `slug` | `models[]` | `name` |
| `Provider` | `slug` | `offerings[]` | `name`, GIN `regions` |
| `Model` | `slug` | `lab`, `offerings[]`, `benchmarkResults[]`, `capabilities[]` | `labId`, `releaseDate`, `modelType+releaseDate`, `inputPricePerMTokUsd`, `verificationStatus`, GIN `modalities` |
| `ModelProvider` | composite `(modelId, providerId)` | `model`, `provider` | `providerId+isAvailable`; availability, regions, price overrides |
| `Capability` | `slug` | `models[]` | `category` |
| `ModelCapability` | composite `(modelId, capabilityId)` | `model`, `capability` | `capabilityId` |
| `Benchmark` | `slug` | `results[]` | `category` |
| `BenchmarkResult` | composite `(modelId, benchmarkId)` | `model`, `benchmark` | `benchmarkId+score DESC`, `modelId`, `verificationStatus` |

Cascade rules: results, listings, and capability joins cascade with their model; labs with models are
protected; benchmarks cascade their results. All entities carry `createdAt`/`updatedAt`; models and
results carry `verificationStatus`, `dataSource`, optional `sourceUrl`, and `lastUpdated`.

## Seed pipeline and data-source assumptions

```
prisma/seed-data.ts  (labs 12, providers 12, models 50, benchmarks 7, results 251, capabilities 9)
        │
        ▼
prisma/seed.ts       upsert by slug; replace listings, capabilities, and results; delete stale slugs
        │
        ▼
PostgreSQL           verificationStatus=ILLUSTRATIVE, dataSource, sourceUrl=null, lastUpdated=2026-11-01
```

- Idempotent: safe to re-run; counts stay stable (verified 50 models / 12 labs / 12 providers / 7
  benchmarks / 251 results / 9 capabilities).
- **Illustrative, not live.** Prices/context windows/scores are hand-entered approximations.
  Model names reflect public families. No scraping, no vendor sync, no research-paper citations;
  seeded `sourceUrl` values are `null` rather than fabricated links.
- API responses expose `verificationStatus`, `dataSource`, `sourceUrl`, and `lastUpdated`; the UI
  also labels the catalogue as illustrative.
- Any live-data feature needs source + fetch timestamp + confidence labels before replacing seed.

## Core flows at a glance

| Flow | Path | Query module | Key filters/joins | Milestone |
|---|---|---|---|---|
| Discover → detail | `/models` → `/models/[slug]` | `lib/queries/models.ts` | text search, lab, provider, modality, open weights, max price, sort, page; providers + scores on detail | shipped M1 |
| Compare 2–4 | `/compare?ids=slug-a,slug-b` → `getModelsBySlugs()` | `lib/queries/models.ts`, `listModels()` for the picker | URL-only selection, pricing, context, modalities, scores, cost estimate | shipped M2 |
| Leaderboard | `/leaderboard?benchmark=…&category=…` → `getBenchmarkCatalog()` + `listLeaderboard()` | `lib/queries/leaderboard.ts` | one benchmark, best-first direction, coverage, `%` bars | shipped M3 |
| Labs | `/labs` → `/labs/[slug]` → `/models/[slug]` | `lib/queries/labs.ts` | search, `_count.models`, newest-first portfolio | shipped M3 |
| Providers | `/providers` → `/providers/[slug]` → `/models/[slug]` | `lib/queries/providers.ts` | search, `_count.offerings`, availability, regions, provider rates | shipped M3 |
| Cost estimate | `/compare` estimator; standalone `/calculator` planned | `lib/pricing.ts` (pure) | input/output tokens × per-1M list price | estimator shipped M2; standalone M4 |

Compare and calculator surfaces must label results as estimates based on illustrative pricing.

## Environment and deployment dependencies

| Dependency | Where | Required in production |
|---|---|---|
| `DATABASE_URL` | app + Prisma CLI | yes |
| `POSTGRES_*` | `docker-compose.yml` | no (local container only) |
| PostgreSQL 17 | Docker locally / managed service | yes (any supported Postgres version) |
| Node.js 20+ | host | yes |
| Docker | local development | no |
| External AI vendor key | playground stretch only | not for required MVP |

Build: `npm install` (runs `prisma generate`) → `npm run build`. Deploy needs
`prisma migrate deploy`; no script wraps it yet. Serverless hosts should use a pooled connection
string. `.env` is git-ignored; `.env.example` is the shareable template (not ignored, not yet
committed — the repository has no commit yet).

## Update protocol

Update both docs at the end of each milestone, and whenever a route, Prisma model, shared component,
API contract, env var, or data-source assumption changes.

### M1 shipped (for regression awareness)

- New: `lib/schemas/model-search.ts`, `lib/serialize.ts`, `lib/format.ts`, `lib/queries/models.ts`,
  `app/models/[slug]/{page,not-found}.tsx`, `app/api/models/{route.ts,[slug]/route.ts}`,
  `components/models/{model-card,model-filters,pagination,tag,provenance-note,provider-availability,benchmark-table}.tsx`.
- Replaced: `app/models/(list)/page.tsx`.
- Unchanged: Prisma schema and migration, seed, Docker setup, root layout, navigation.

### Interface shell shipped (M1.5)

- New primitives: `components/ui/{button,badge,card,alert,page-header,empty-state,stat-card,skeleton}.tsx`.
- New shell: `components/layout/{app-shell,brand,sidebar,nav-items,nav-link,mobile-nav,topbar}.tsx`.
- New states: `app/not-found.tsx`, `app/models/(list)/loading.tsx`. A later detail `loading.tsx`
  was added with the enriched detail page; because Next streams that fallback, missing slugs render
  the not-found UI with `noindex` while the HTTP status is already 200.
- Replaced: `app/layout.tsx`, `app/page.tsx` (dashboard), `app/models/(list)/page.tsx`,
  `app/models/[slug]/{page,not-found}.tsx`, `components/coming-soon.tsx`,
  `components/models/{tag,pagination}.tsx`.
- Removed: `components/layout/site-header.tsx`, `components/layout/site-nav.tsx`.
- Tokens: `app/globals.css` rewritten with the same semantic names plus status/surface steps.
- Unchanged: query layer, API routes, Prisma schema, seed, Docker setup.

### M2 shipped

- API: `POST /api/compare` with 2–4 unique slugs and `lib/queries/models.ts#getModelsBySlugs`
  (one bounded query, request order preserved). Contract is in `docs/API.md`.
- UI: `app/compare/page.tsx` replaces the placeholder with a URL-backed selection
  (`?ids=slug-a,slug-b`), specification/best-value table, benchmark matrix with comparability
  caveats, modality and capability matrices, and a validated token-cost estimator.
- New: `lib/pricing.ts` (pure token maths + input validation), `lib/compare.ts` (selection URLs,
  best-value and matrix helpers), `lib/schemas/compare.ts#parseCompareIds`, and
  `components/compare/*`.
- Changed: `/models` keeps its selection in `?compare=` and hands off to `/compare` instead of
  rendering inline comparison; model detail links to `/compare?ids=<slug>`. `lib/format.ts` adds
  exact token counts and USD estimate formatting.
- Reuses: detail shape, `lib/serialize.ts`, provenance note. The shared API envelope remains
  `{data,meta}` / `{error:{code,message,details}}`.

### M3 shipped

- Leaderboard: `/leaderboard` resolves exactly one benchmark from `benchmark`/`category` URL
  params (defaulting to the most-covered candidate), sorts best-first from `higherIsBetter`, and
  paginates at 10 rows. The context panel explains name, category, version, unit, direction,
  coverage, and illustrative provenance. No cross-benchmark composite score; missing results are
  reported as coverage and never counted as zero.
- Labs: `/labs` is a searchable, paginated directory over `Lab` with `_count.models`;
  `/labs/[slug]` shows the lab portfolio via the real `Model.lab` relation, with links to model
  detail and `/api/labs/[slug]`.
- Providers: `/providers` mirrors the lab directory over `Provider` with `_count.offerings`;
  `/providers/[slug]` reads `ModelProvider` listings for availability, regions, notes, and
  provider-specific price overrides versus list prices.
- New shared UI: `components/ui/collection-pagination.tsx`, `components/directory/{directory-search,
  directory-card,model-table}.tsx`, `components/leaderboard/{leaderboard-filters,leaderboard-table}.tsx`.
- New query surface: `lib/queries/leaderboard.ts#getBenchmarkCatalog`; schema defaults in
  `lib/schemas/{leaderboard-search,directory-search}.ts`; `lib/search-params.ts`.
- Cross-links added: model detail → lab profile and provider profile; provider availability →
  provider profile. Directory/profile loading, empty, error, and not-found states included.
- Unchanged: Prisma schema/migration/seed, API envelopes, compare flow. `/api/leaderboard`,
  `/api/labs`, and `/api/providers` already exposed the required data, so no new API route was added.
