#!/usr/bin/env node

/**
 * Repeatable API smoke test. Requires a running server:
 *   npm run dev
 *   npm run verify:api
 *
 * Override the target with BASE_URL, e.g. BASE_URL=http://localhost:3001 npm run verify:api
 */

const baseUrl = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

let passed = 0;
let failed = 0;

function assert(condition, label, detail) {
  if (condition) {
    passed += 1;
    console.log(`PASS ${label}`);
    return;
  }

  failed += 1;
  console.error(`FAIL ${label}${detail === undefined ? "" : `\n     ${JSON.stringify(detail)}`}`);
}

function nondecreasing(values) {
  return values.every((value, index) => index === 0 || values[index - 1] <= value);
}

function nonincreasing(values) {
  return values.every((value, index) => index === 0 || values[index - 1] >= value);
}

async function request(path, init) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const text = await response.text();
  let body;

  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  return { response, body };
}

async function main() {
  console.log(`Verifying OneAtlas API at ${baseUrl}\n`);

  const health = await request("/api/health");
  assert(health.response.status === 200, "GET /api/health returns 200", health.body);
  assert(health.body?.status === "ok", "health reports database connected", health.body);

  if (health.response.status !== 200) {
    throw new Error("Server is reachable but the database is not ready.");
  }

  const models = await request("/api/models");
  assert(models.response.status === 200, "GET /api/models returns 200", models.body);
  assert(models.body?.meta?.total === 50, "catalogue contains 50 models", models.body?.meta);
  assert(models.body?.data?.length === 9, "default page size is 9", models.body?.meta);
  assert(
    models.body?.data?.every((model) => typeof model.modelType === "string"),
    "model summaries include modelType",
  );
  assert(
    models.body?.data?.every(
      (model) => Array.isArray(model.providers) && Array.isArray(model.capabilities),
    ) &&
      models.body.data[0].providers.length > 0 &&
      models.body.data[0].capabilities.length > 0,
    "model summaries include provider availability and capability tags",
    models.body?.data?.[0],
  );

  const capabilities = await request("/api/capabilities");
  assert(capabilities.response.status === 200, "GET /api/capabilities returns 200", capabilities.body);
  assert(
    capabilities.body?.data?.length === 9 &&
      capabilities.body.data.every(
        (capability) =>
          typeof capability.slug === "string" &&
          typeof capability.name === "string" &&
          typeof capability.category === "string",
      ),
    "capability lookup returns all nine categorised capabilities",
    capabilities.body?.data,
  );

  const filtered = await request(
    "/api/models?type=REASONING&capability=extended-thinking&sort=output-price-asc&pageSize=5",
  );
  assert(filtered.response.status === 200, "filtered catalogue returns 200", filtered.body);
  assert(filtered.body?.meta?.pageSize === 5, "pageSize query is honoured", filtered.body?.meta);
  assert(
    filtered.body?.data?.length > 0 &&
      filtered.body.data.every((model) => model.modelType === "REASONING"),
    "type filter returns only REASONING models",
  );
  assert(
    nondecreasing(filtered.body?.data?.map((model) => model.outputPricePerMTokUsd) ?? []),
    "output-price-asc is sorted ascending",
  );

  const filteredSlug = filtered.body?.data?.[0]?.slug;
  if (filteredSlug) {
    const capabilityDetail = await request(`/api/models/${filteredSlug}`);
    assert(
      capabilityDetail.body?.data?.capabilities?.some(
        (capability) => capability.slug === "extended-thinking",
      ),
      "capability filter matches detail capabilities",
      capabilityDetail.body?.data?.capabilities,
    );
  }

  const releaseAsc = await request("/api/models?sort=release-date-asc&pageSize=10");
  assert(
    nondecreasing(releaseAsc.body?.data?.map((model) => model.releaseDate) ?? []),
    "release-date-asc is sorted ascending",
  );

  const inputDesc = await request("/api/models?sort=input-price-desc&pageSize=10");
  assert(
    nonincreasing(inputDesc.body?.data?.map((model) => model.inputPricePerMTokUsd) ?? []),
    "input-price-desc is sorted descending",
  );

  const invalidModels = await request("/api/models?type=NOT_A_TYPE");
  assert(
    invalidModels.response.status === 400 &&
      invalidModels.body?.error?.code === "INVALID_QUERY" &&
      Array.isArray(invalidModels.body?.error?.details?.issues),
    "invalid model filters return 400 INVALID_QUERY",
    invalidModels.body,
  );

  const modelDetail = await request("/api/models/gpt-5");
  assert(modelDetail.response.status === 200, "GET /api/models/gpt-5 returns 200", modelDetail.body);
  assert(
    typeof modelDetail.body?.data?.lab?.name === "string" &&
      modelDetail.body?.data?.capabilities?.length > 0 &&
      modelDetail.body?.data?.providers?.length > 0 &&
      modelDetail.body?.data?.benchmarks?.length > 0 &&
      modelDetail.body.data.providers.every(
        (provider) =>
          typeof provider.isAvailable === "boolean" &&
          Array.isArray(provider.availableRegions),
      ),
    "model detail includes lab, capabilities, provider availability, and benchmarks",
  );

  const missingModel = await request("/api/models/not-a-real-model");
  assert(
    missingModel.response.status === 404 &&
      missingModel.body?.error?.code === "MODEL_NOT_FOUND",
    "unknown model returns 404 MODEL_NOT_FOUND",
    missingModel.body,
  );

  const providers = await request("/api/providers");
  assert(providers.response.status === 200, "GET /api/providers returns 200", providers.body);
  assert(providers.body?.meta?.total === 12, "provider directory contains 12 providers", providers.body?.meta);
  assert(
    typeof providers.body?.data?.[0]?.modelCount === "number" &&
      Array.isArray(providers.body?.data?.[0]?.regions),
    "provider summaries include modelCount and regions",
  );

  const providerDetail = await request("/api/providers/openai-api");
  assert(providerDetail.response.status === 200, "GET /api/providers/openai-api returns 200", providerDetail.body);
  assert(
    providerDetail.body?.data?.models?.length > 0 &&
      providerDetail.body.data.models[0].providerPrice !== undefined,
    "provider detail includes served models and provider prices",
  );

  const missingProvider = await request("/api/providers/not-a-real-provider");
  assert(
    missingProvider.response.status === 404 &&
      missingProvider.body?.error?.code === "PROVIDER_NOT_FOUND",
    "unknown provider returns 404 PROVIDER_NOT_FOUND",
    missingProvider.body,
  );

  const labs = await request("/api/labs");
  assert(labs.response.status === 200, "GET /api/labs returns 200", labs.body);
  assert(labs.body?.meta?.total === 12, "lab directory contains 12 labs", labs.body?.meta);

  const labDetail = await request("/api/labs/openai");
  assert(labDetail.response.status === 200, "GET /api/labs/openai returns 200", labDetail.body);
  assert(
    labDetail.body?.data?.models?.length > 0 &&
      typeof labDetail.body.data.models[0].providerCount === "number",
    "lab detail includes portfolio and provider counts",
  );

  const missingLab = await request("/api/labs/not-a-real-lab");
  assert(
    missingLab.response.status === 404 && missingLab.body?.error?.code === "LAB_NOT_FOUND",
    "unknown lab returns 404 LAB_NOT_FOUND",
    missingLab.body,
  );

  const leaderboard = await request("/api/leaderboard?benchmark=mmlu&sort=score-desc&pageSize=3");
  assert(leaderboard.response.status === 200, "GET /api/leaderboard returns 200", leaderboard.body);
  assert(
    leaderboard.body?.data?.length === 3 &&
      leaderboard.body.data.every((row) => row.benchmark.slug === "mmlu") &&
      nonincreasing(leaderboard.body.data.map((row) => row.score)),
    "leaderboard filters by benchmark and sorts by score",
    leaderboard.body?.data,
  );
  assert(
    leaderboard.body?.meta?.filters?.benchmark === "mmlu",
    "leaderboard meta reports applied benchmark filter",
    leaderboard.body?.meta,
  );

  const codingLeaderboard = await request("/api/leaderboard?category=Coding&pageSize=5");
  assert(
    codingLeaderboard.body?.data?.length > 0 &&
      codingLeaderboard.body.data.every((row) => row.benchmark.category === "Coding"),
    "leaderboard category filter is case-insensitive and scoped",
    codingLeaderboard.body?.data,
  );

  const invalidLeaderboard = await request("/api/leaderboard?sort=not-a-sort");
  assert(
    invalidLeaderboard.response.status === 400 &&
      invalidLeaderboard.body?.error?.code === "INVALID_QUERY",
    "invalid leaderboard sort returns 400 INVALID_QUERY",
    invalidLeaderboard.body,
  );

  const compare = await request("/api/compare", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ slugs: ["gpt-5", "claude-opus-4-1"] }),
  });
  assert(compare.response.status === 200, "POST /api/compare returns 200", compare.body);
  assert(
    compare.body?.data?.models?.length === 2 &&
      compare.body.data.models[0].slug === "gpt-5" &&
      compare.body.data.models[1].slug === "claude-opus-4-1" &&
      compare.body.data.models.every((model) => Array.isArray(model.capabilities)),
    "compare preserves request order and returns comparison detail",
    compare.body?.data?.models?.map((model) => model.slug),
  );

  const tooFew = await request("/api/compare", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ slugs: ["gpt-5"] }),
  });
  assert(
    tooFew.response.status === 400 && tooFew.body?.error?.code === "INVALID_BODY",
    "compare rejects fewer than two slugs",
    tooFew.body,
  );

  const duplicates = await request("/api/compare", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ slugs: ["gpt-5", "gpt-5"] }),
  });
  assert(
    duplicates.response.status === 400 && duplicates.body?.error?.code === "INVALID_BODY",
    "compare rejects duplicate slugs",
    duplicates.body,
  );

  const missingCompare = await request("/api/compare", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ slugs: ["gpt-5", "does-not-exist"] }),
  });
  assert(
    missingCompare.response.status === 404 &&
      missingCompare.body?.error?.code === "MODELS_NOT_FOUND" &&
      missingCompare.body?.error?.details?.missing?.[0] === "does-not-exist",
    "compare reports missing model slugs",
    missingCompare.body,
  );

  const invalidJson = await request("/api/compare", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{not-json",
  });
  assert(
    invalidJson.response.status === 400 && invalidJson.body?.error?.code === "INVALID_JSON",
    "compare rejects malformed JSON",
    invalidJson.body,
  );

  console.log(`\n${passed} passed, ${failed} failed.`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("\nAPI verification could not run.");
  console.error(error instanceof Error ? error.message : error);
  console.error(`Is the server running at ${baseUrl}? Start it with \`npm run dev\`.`);
  process.exit(1);
});
