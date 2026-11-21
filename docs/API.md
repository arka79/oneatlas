# API

OneAtlas exposes a read-mostly JSON API backed by PostgreSQL through Prisma. No endpoint returns
static frontend arrays; every collection and detail response is queried from the database.

Base URL in local development: `http://localhost:3000`

> **Illustrative data.** The committed seed contains 50 models, 12 labs, 12 providers, 7 benchmarks,
> and 251 benchmark results. Prices, context windows, release dates, and scores are hand-entered
> approximations, not live vendor pricing or published benchmark results. Model and result payloads
> carry `verificationStatus`, `sourceUrl`, `lastUpdated`, and `isIllustrative`.

## Response envelopes

Single resource:

```json
{ "data": { "slug": "gpt-5" } }
```

Collection:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 25,
    "total": 12,
    "totalPages": 1
  }
}
```

Error:

```json
{
  "error": {
    "code": "INVALID_QUERY",
    "message": "Invalid query parameters.",
    "details": {
      "issues": [{ "field": "type", "message": "Invalid option." }]
    }
  }
}
```

`/api/health` is a liveness/readiness probe and intentionally keeps its own status shape.

Common error codes:

| Code | Status | Meaning |
|---|---:|---|
| `INVALID_QUERY` | 400 | A known query parameter has an invalid value. |
| `INVALID_BODY` | 400 | The POST body failed validation. |
| `INVALID_JSON` | 400 | The POST body was not valid JSON. |
| `INVALID_SLUG` | 400 | A path slug failed the lowercase-hyphen format check. |
| `MODEL_NOT_FOUND` | 404 | No model has that slug. |
| `PROVIDER_NOT_FOUND` | 404 | No provider has that slug. |
| `LAB_NOT_FOUND` | 404 | No lab has that slug. |
| `MODELS_NOT_FOUND` | 404 | One or more compare slugs are unknown; `details.missing` lists them. |
| `DATABASE_UNAVAILABLE` | 503 | The database query failed. |

Unknown filter values that are *syntactically valid* (for example an unknown lab slug) return an
empty collection, not an error. Invalid enum values and malformed numbers return `400`.

Dates are ISO strings. Prices are plain numbers in **USD per 1,000,000 tokens**; the unit is also
encoded in the field names `inputPricePerMTokUsd` and `outputPricePerMTokUsd`. Provider-specific
overrides use `providerPrice` and are `null` when the provider uses the model list price.

## Endpoint summary

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Database readiness probe. |
| GET | `/api/models` | Search/filter/sort/paginate models. |
| GET | `/api/capabilities` | Capability definitions for filter controls. |
| GET | `/api/models/[slug]` | Model detail with lab, providers, capabilities, benchmarks. |
| GET | `/api/providers` | Provider directory with model counts. |
| GET | `/api/providers/[slug]` | Provider detail with served models and price overrides. |
| GET | `/api/labs` | Lab directory with model counts. |
| GET | `/api/labs/[slug]` | Lab detail with model portfolio. |
| GET | `/api/leaderboard` | Benchmark results filtered by benchmark/category. |
| POST | `/api/compare` | Compare 2–4 models in request order. |

---

## GET /api/models

Search, filter, sort, and paginate the catalogue.

| Param | Values | Default | Behaviour |
|---|---|---|---|
| `q` | ≤80 chars | — | Case-insensitive substring on model name, description, licence, and lab name. |
| `lab` | lab slug | — | Exact lab slug. |
| `provider` | provider slug | — | Models with a listing from that provider. |
| `type` | `GENERAL`, `REASONING`, `CODING`, `MULTIMODAL`, `EMBEDDING` | — | Exact `modelType`. |
| `capability` | capability slug, e.g. `extended-thinking` | — | Models joined to that capability. |
| `modality` | `TEXT`, `IMAGE`, `AUDIO`, `VIDEO`, `CODE` | — | Postgres enum-array membership. |
| `openWeights` | `true` / `false` | — | Open or closed weights. |
| `maxPrice` | `0`–`10000` | — | First-party input price per 1M tokens ≤ value. |
| `sort` | see below | `release-date-desc` | Deterministic sort with a name tie-breaker. |
| `page` | integer ≥ 1 | `1` | Clamped to the last real page. |
| `pageSize` | 1–50 | `9` | Catalogue card grid defaults to nine. |

Sort values:

- `release-date-desc`, `release-date-asc`
- `name-asc`
- `input-price-asc`, `input-price-desc`
- `output-price-asc`, `output-price-desc`
- `context-desc`

Legacy M1 values are accepted and canonicalised: `newest` → `release-date-desc`,
`price-asc` → `input-price-asc`, `price-desc` → `input-price-desc`.

Example:

```bash
curl 'http://localhost:3000/api/models?type=REASONING&capability=extended-thinking&sort=output-price-asc&pageSize=5'
```

Expected shape (one row abbreviated):

```json
{
  "data": [
    {
      "slug": "grok-3-mini",
      "name": "Grok 3 mini",
      "description": "A compact reasoning-capable Grok tier …",
      "lab": { "slug": "xai", "name": "xAI" },
      "modelType": "REASONING",
      "releaseDate": "2025-02-19",
      "contextWindow": 131072,
      "maxOutputTokens": 16384,
      "inputPricePerMTokUsd": 0.3,
      "outputPricePerMTokUsd": 0.5,
      "modalities": ["TEXT", "CODE"],
      "isOpenWeights": false,
      "license": "Proprietary",
      "knowledgeCutoff": "2024-11",
      "dataSource": "Illustrative seed dataset — hand-entered approximations; …",
      "sourceUrl": null,
      "lastUpdated": "2026-11-01T00:00:00.000Z",
      "verificationStatus": "ILLUSTRATIVE",
      "isIllustrative": true,
      "providerCount": 2,
      "providers": [
        { "slug": "openrouter", "name": "OpenRouter" },
        { "slug": "xai-api", "name": "xAI API" }
      ],
      "capabilities": [
        { "slug": "extended-thinking", "name": "Extended thinking" },
        { "slug": "multilingual", "name": "Multilingual" },
        { "slug": "streaming", "name": "Streaming" },
        { "slug": "structured-output", "name": "Structured output" },
        { "slug": "tool-use", "name": "Tool use" }
      ]
    }
  ],
  "meta": { "page": 1, "pageSize": 5, "total": 6, "totalPages": 2 }
}
```

## GET /api/models/[slug]

Returns the full model payload. Providers are ordered with available listings first, then by name;
capabilities by name; benchmark results by benchmark name. Provider price overrides are nullable.
Each provider listing includes `isAvailable` and listing-specific `availableRegions`.

```bash
curl 'http://localhost:3000/api/models/gpt-5'
```

Shape:

```json
{
  "data": {
    "slug": "gpt-5",
    "name": "GPT-5",
    "description": "…",
    "lab": {
      "slug": "openai",
      "name": "OpenAI",
      "description": "…",
      "websiteUrl": "https://openai.com",
      "country": "United States",
      "foundedYear": 2015
    },
    "modelType": "GENERAL",
    "releaseDate": "2025-08-07",
    "contextWindow": 400000,
    "maxOutputTokens": 128000,
    "inputPricePerMTokUsd": 1.25,
    "outputPricePerMTokUsd": 10,
    "modalities": ["TEXT", "IMAGE", "CODE"],
    "isOpenWeights": false,
    "license": "Proprietary",
    "knowledgeCutoff": "2024-09",
    "capabilities": [
      {
        "slug": "streaming",
        "name": "Streaming",
        "description": "Incremental token output …",
        "category": "Output"
      }
    ],
    "providers": [
      {
        "slug": "openai-api",
        "name": "OpenAI API",
        "description": "…",
        "websiteUrl": "https://platform.openai.com",
        "regions": ["Global"],
        "isAvailable": true,
        "availableRegions": ["Global"],
        "inputPricePerMTokUsd": null,
        "outputPricePerMTokUsd": null
      }
    ],
    "benchmarks": [
      {
        "slug": "mmlu",
        "name": "MMLU",
        "category": "Knowledge",
        "unit": "%",
        "higherIsBetter": true,
        "score": 89.4,
        "sourceUrl": null,
        "lastUpdated": "2026-11-01T00:00:00.000Z",
        "verificationStatus": "ILLUSTRATIVE",
        "isIllustrative": true
      }
    ],
    "dataSource": "Illustrative seed dataset — hand-entered approximations; …",
    "sourceUrl": null,
    "lastUpdated": "2026-11-01T00:00:00.000Z",
    "verificationStatus": "ILLUSTRATIVE",
    "isIllustrative": true
  }
}
```

## GET /api/capabilities

Returns every capability definition, ordered by category then name. The table is small and bounded,
so this endpoint is intentionally unpaginated. It backs the capability selector on `/models`.

```bash
curl 'http://localhost:3000/api/capabilities'
```

```json
{
  "data": [
    {
      "slug": "extended-thinking",
      "name": "Extended thinking",
      "description": "A budgeted reasoning phase before the final answer.",
      "category": "Reasoning"
    }
  ]
}
```

## GET /api/providers

| Param | Values | Default |
|---|---|---|
| `q` | ≤80 chars | — |
| `page` | integer ≥ 1 | `1` |
| `pageSize` | 1–100 | `25` |

`q` matches provider name and description.

```bash
curl 'http://localhost:3000/api/providers?q=aws'
```

```json
{
  "data": [
    {
      "slug": "amazon-bedrock",
      "name": "Amazon Bedrock",
      "description": "AWS's managed model marketplace …",
      "websiteUrl": "https://aws.amazon.com/bedrock",
      "regions": ["US", "EU", "APAC"],
      "modelCount": 18,
      "updatedAt": "2026-11-01T00:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "pageSize": 25, "total": 1, "totalPages": 1 }
}
```

## GET /api/providers/[slug]

One nested query returns the provider and every served model.

```bash
curl 'http://localhost:3000/api/providers/openai-api'
```

```json
{
  "data": {
    "slug": "openai-api",
    "name": "OpenAI API",
    "description": "…",
    "websiteUrl": "https://platform.openai.com",
    "regions": ["Global"],
    "modelCount": 9,
    "updatedAt": "2026-11-01T00:00:00.000Z",
    "models": [
      {
        "slug": "gpt-5",
        "name": "GPT-5",
        "modelType": "GENERAL",
        "releaseDate": "2025-08-07",
        "contextWindow": 400000,
        "maxOutputTokens": 128000,
        "inputPricePerMTokUsd": 1.25,
        "outputPricePerMTokUsd": 10,
        "modalities": ["TEXT", "IMAGE", "CODE"],
        "isOpenWeights": false,
        "license": "Proprietary",
        "lab": { "slug": "openai", "name": "OpenAI" },
        "providerPrice": {
          "inputPricePerMTokUsd": null,
          "outputPricePerMTokUsd": null
        },
        "isAvailable": true,
        "availableRegions": ["Global"],
        "notes": null
      }
    ]
  }
}
```

`providerPrice` values are provider-specific overrides. `null` means the listing uses the model's
list price.

## GET /api/labs

| Param | Values | Default |
|---|---|---|
| `q` | ≤80 chars | — |
| `page` | integer ≥ 1 | `1` |
| `pageSize` | 1–100 | `25` |

`q` matches lab name, description, and country.

```bash
curl 'http://localhost:3000/api/labs?q=china'
```

```json
{
  "data": [
    {
      "slug": "deepseek",
      "name": "DeepSeek",
      "description": "Chinese research lab …",
      "websiteUrl": "https://www.deepseek.com",
      "country": "China",
      "foundedYear": 2023,
      "modelCount": 4,
      "updatedAt": "2026-11-01T00:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "pageSize": 25, "total": 2, "totalPages": 1 }
}
```

## GET /api/labs/[slug]

```bash
curl 'http://localhost:3000/api/labs/openai'
```

```json
{
  "data": {
    "slug": "openai",
    "name": "OpenAI",
    "description": "…",
    "websiteUrl": "https://openai.com",
    "country": "United States",
    "foundedYear": 2015,
    "modelCount": 9,
    "updatedAt": "2026-11-01T00:00:00.000Z",
    "models": [
      {
        "slug": "gpt-5",
        "name": "GPT-5",
        "description": "…",
        "modelType": "GENERAL",
        "releaseDate": "2025-08-07",
        "contextWindow": 400000,
        "maxOutputTokens": 128000,
        "inputPricePerMTokUsd": 1.25,
        "outputPricePerMTokUsd": 10,
        "modalities": ["TEXT", "IMAGE", "CODE"],
        "isOpenWeights": false,
        "license": "Proprietary",
        "providerCount": 2
      }
    ]
  }
}
```

## GET /api/leaderboard

Rows are `BenchmarkResult` records joined to model, lab, and benchmark data.

| Param | Values | Default | Behaviour |
|---|---|---|---|
| `benchmark` | benchmark slug | — | Exact benchmark slug, e.g. `mmlu`. |
| `category` | category name | — | Case-insensitive benchmark category, e.g. `Coding`. |
| `sort` | `score-desc`, `score-asc`, `benchmark-asc`, `model-asc`, `release-date-desc` | `score-desc` | `rank` is the position in the filtered/sorted set. |
| `page` | integer ≥ 1 | `1` | Clamped to the last real page. |
| `pageSize` | 1–100 | `25` | — |

```bash
curl 'http://localhost:3000/api/leaderboard?benchmark=mmlu&sort=score-desc&pageSize=3'
```

```json
{
  "data": [
    {
      "rank": 1,
      "score": 90.1,
      "model": {
        "slug": "claude-opus-4-1",
        "name": "Claude Opus 4.1",
        "modelType": "REASONING",
        "releaseDate": "2025-08-05",
        "contextWindow": 200000,
        "isOpenWeights": false,
        "lab": { "slug": "anthropic", "name": "Anthropic" }
      },
      "benchmark": {
        "slug": "mmlu",
        "name": "MMLU",
        "category": "Knowledge",
        "unit": "%",
        "higherIsBetter": true,
        "version": "v1"
      },
      "verificationStatus": "ILLUSTRATIVE",
      "isIllustrative": true,
      "sourceUrl": null,
      "lastUpdated": "2026-11-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 3,
    "total": 46,
    "totalPages": 16,
    "filters": { "benchmark": "mmlu", "category": null, "sort": "score-desc" }
  }
}
```

When no benchmark/category filter is supplied, rows from multiple benchmarks are returned. For a
meaningful ranking, filter to one benchmark; `score-desc` across different benchmarks is not a
cross-benchmark quality claim. The `/leaderboard` page uses the same query layer but always resolves
exactly one benchmark and selects `score-desc` or `score-asc` from that benchmark's
`higherIsBetter` flag, so its displayed ranks are best-first. The API itself keeps `sort` explicit
and does not infer a direction.

## POST /api/compare

Body:

```json
{ "slugs": ["gpt-5", "claude-opus-4-1"] }
```

- Exactly 2–4 entries.
- Entries must be unique lowercase slugs.
- Unknown slugs return `404 MODELS_NOT_FOUND` with `error.details.missing`.
- The response preserves request order and uses the same detail shape as `/api/models/[slug]`.

```bash
curl -X POST 'http://localhost:3000/api/compare' \
  -H 'content-type: application/json' \
  -d '{"slugs":["gpt-5","claude-opus-4-1"]}'
```

```json
{
  "data": {
    "models": [
      {
        "slug": "gpt-5",
        "name": "GPT-5",
        "lab": { "slug": "openai", "name": "OpenAI" },
        "inputPricePerMTokUsd": 1.25,
        "outputPricePerMTokUsd": 10,
        "contextWindow": 400000,
        "capabilities": [],
        "providers": [],
        "benchmarks": []
      },
      {
        "slug": "claude-opus-4-1",
        "name": "Claude Opus 4.1",
        "lab": { "slug": "anthropic", "name": "Anthropic" },
        "inputPricePerMTokUsd": 15,
        "outputPricePerMTokUsd": 75,
        "contextWindow": 200000,
        "capabilities": [],
        "providers": [],
        "benchmarks": []
      }
    ]
  },
  "meta": { "requested": 2, "returned": 2 }
}
```

The abbreviated example omits the full capability/provider/benchmark arrays that each model
contains in the real response.

## Verification

With the dev server running:

```bash
npm run verify:api
```

The smoke test exercises every endpoint, the supported filter/sort paths, pagination shape, compare
validation, 404s, and 400s. It uses only Node's built-in `fetch` and exits non-zero on failure. Set
`BASE_URL` to target another port:

```bash
BASE_URL=http://localhost:3001 npm run verify:api
```

No authentication, rate limiting, or third-party AI calls are implemented. The API is read-only
except for the stateless compare POST.
