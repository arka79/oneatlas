import { describe, test } from "node:test";
import assert from "node:assert";
import {
  buildCompareHref,
  buildCatalogCompareHref,
  bestValueIndices,
  buildBenchmarkComparisons,
  buildCapabilityMatrix,
} from "@/lib/compare";
import type { ModelDetail } from "@/lib/queries/models";

function makeModel(
  slug: string,
  name: string,
  overrides: {
    benchmarks?: Array<{
      slug: string;
      name: string;
      category: string;
      score: number | null;
      unit?: string;
      higherIsBetter?: boolean;
    }>;
    capabilities?: Array<{ slug: string; name: string; category: string }>;
  } = {},
): ModelDetail {
  return {
    slug,
    name,
    description: `${name} description`,
    lab: { slug: "lab-1", name: "Lab One", description: "", websiteUrl: "", country: null, foundedYear: null },
    modelType: "GENERAL",
    releaseDate: "2025-01-01",
    contextWindow: 131_072,
    maxOutputTokens: 8_192,
    inputPricePerMTokUsd: 1,
    outputPricePerMTokUsd: 2,
    modalities: ["TEXT"],
    isOpenWeights: false,
    license: "Proprietary",
    knowledgeCutoff: null,
    dataSource: "Illustrative seed dataset",
    sourceUrl: null,
    lastUpdated: "2026-11-01T00:00:00.000Z",
    verificationStatus: "ILLUSTRATIVE",
    isIllustrative: true,
    capabilities: (overrides.capabilities ?? []).map((c) => ({
      slug: c.slug,
      name: c.name,
      description: c.name,
      category: c.category,
    })),
    providers: [],
    benchmarks: (overrides.benchmarks ?? []).map((b) => ({
      slug: b.slug,
      name: b.name,
      category: b.category,
      unit: b.unit ?? "%",
      higherIsBetter: b.higherIsBetter ?? true,
      score: b.score,
      sourceUrl: null,
      lastUpdated: "2026-11-01T00:00:00.000Z",
      verificationStatus: "ILLUSTRATIVE",
      isIllustrative: true,
    })),
  } as ModelDetail;
}

describe("bestValueIndices", () => {
  test("returns empty array for empty input", () => {
    assert.deepStrictEqual(bestValueIndices([], "lower"), []);
    assert.deepStrictEqual(bestValueIndices([], "higher"), []);
  });

  test("returns empty array when all values are null", () => {
    assert.deepStrictEqual(bestValueIndices([null, null, null], "lower"), []);
    assert.deepStrictEqual(bestValueIndices([null, null, null], "higher"), []);
  });

  test("returns empty array with a single finite value (needs at least two)", () => {
    assert.deepStrictEqual(bestValueIndices([5, null, null], "lower"), []);
    assert.deepStrictEqual(bestValueIndices([null, 5, null], "higher"), []);
  });

  test("lower direction returns index of the minimum", () => {
    assert.deepStrictEqual(bestValueIndices([10, 5, 8], "lower"), [1]);
    assert.deepStrictEqual(bestValueIndices([5, 10, 8], "lower"), [0]);
    assert.deepStrictEqual(bestValueIndices([8, 10, 5], "lower"), [2]);
  });

  test("higher direction returns index of the maximum", () => {
    assert.deepStrictEqual(bestValueIndices([10, 5, 8], "higher"), [0]);
    assert.deepStrictEqual(bestValueIndices([5, 10, 8], "higher"), [1]);
    assert.deepStrictEqual(bestValueIndices([8, 10, 5], "higher"), [1]);
  });

  test("returns all indices when values tie for best", () => {
    assert.deepStrictEqual(bestValueIndices([5, 5, 8], "lower"), [0, 1]);
    assert.deepStrictEqual(bestValueIndices([8, 5, 5], "lower"), [1, 2]);
    assert.deepStrictEqual(bestValueIndices([5, 10, 10], "higher"), [1, 2]);
    assert.deepStrictEqual(bestValueIndices([7, 7, 7], "higher"), [0, 1, 2]);
  });

  test("ignores null values when computing the best", () => {
    assert.deepStrictEqual(bestValueIndices([null, 5, 10, null], "lower"), [1]);
    assert.deepStrictEqual(bestValueIndices([10, null, 5, null], "higher"), [0]);
    assert.deepStrictEqual(bestValueIndices([null, 3, null, 3], "lower"), [1, 3]);
  });

  test("works with floating point values", () => {
    assert.deepStrictEqual(bestValueIndices([1.5, 2.5, 1.5], "lower"), [0, 2]);
    assert.deepStrictEqual(bestValueIndices([1.5, 2.5, 3.5], "higher"), [2]);
  });
});

describe("buildCompareHref", () => {
  test("returns /compare for an empty selection", () => {
    assert.strictEqual(buildCompareHref([]), "/compare");
  });

  test("returns /compare?ids=slug for a single model", () => {
    assert.strictEqual(buildCompareHref(["gpt-5"]), "/compare?ids=gpt-5");
  });

  test("joins multiple slugs with commas", () => {
    assert.strictEqual(
      buildCompareHref(["gpt-5", "claude-opus-4-1"]),
      "/compare?ids=gpt-5,claude-opus-4-1",
    );
  });

  test("drops duplicate slugs", () => {
    assert.strictEqual(
      buildCompareHref(["gpt-5", "gpt-5", "claude-opus-4-1"]),
      "/compare?ids=gpt-5,claude-opus-4-1",
    );
  });

  test("preserves selection order (first occurrence wins)", () => {
    assert.strictEqual(
      buildCompareHref(["claude-opus-4-1", "gpt-5"]),
      "/compare?ids=claude-opus-4-1,gpt-5",
    );
  });

  test("slices to at most four models", () => {
    const slugs = ["a", "b", "c", "d", "e", "f"];
    const href = buildCompareHref(slugs);
    assert.strictEqual(href, "/compare?ids=a,b,c,d");
  });

  test("encodes slugs", () => {
    assert.strictEqual(buildCompareHref(["my-model"]), "/compare?ids=my-model");
  });
});

describe("buildCatalogCompareHref", () => {
  test("returns /models for an empty selection", () => {
    assert.strictEqual(buildCatalogCompareHref([]), "/models");
  });

  test("uses /models path with compare param", () => {
    assert.strictEqual(
      buildCatalogCompareHref(["gpt-5"]),
      "/models?compare=gpt-5",
    );
    assert.strictEqual(
      buildCatalogCompareHref(["gpt-5", "claude-opus-4-1"]),
      "/models?compare=gpt-5,claude-opus-4-1",
    );
  });

  test("drops duplicates and slices to four", () => {
    assert.strictEqual(
      buildCatalogCompareHref(["a", "a", "b", "c", "d", "e"]),
      "/models?compare=a,b,c,d",
    );
  });
});

describe("buildBenchmarkComparisons", () => {
  test("returns empty array when no models have benchmarks", () => {
    const models = [makeModel("a", "Model A"), makeModel("b", "Model B")];
    assert.deepStrictEqual(buildBenchmarkComparisons(models), []);
  });

  test("scoredCount is 1 and not comparable with one model", () => {
    const models = [
      makeModel("a", "Model A", {
        benchmarks: [{ slug: "mmlu", name: "MMLU", category: "Knowledge", score: 89.4 }],
      }),
    ];
    const rows = buildBenchmarkComparisons(models);
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].scoredCount, 1);
    assert.strictEqual(rows[0].comparable, false);
    assert.deepStrictEqual(rows[0].bestIndices, []);
    assert.deepStrictEqual(rows[0].scores, [89.4]);
  });

  test("is comparable and highlights best when two models share a benchmark", () => {
    const models = [
      makeModel("a", "Model A", {
        benchmarks: [{ slug: "mmlu", name: "MMLU", category: "Knowledge", score: 89.4 }],
      }),
      makeModel("b", "Model B", {
        benchmarks: [{ slug: "mmlu", name: "MMLU", category: "Knowledge", score: 90.1 }],
      }),
    ];
    const rows = buildBenchmarkComparisons(models);
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].scoredCount, 2);
    assert.strictEqual(rows[0].comparable, true);
    assert.deepStrictEqual(rows[0].bestIndices, [1]); // Model B has the higher score
    assert.deepStrictEqual(rows[0].scores, [89.4, 90.1]);
  });

  test("marks ties as best for both models", () => {
    const models = [
      makeModel("a", "Model A", {
        benchmarks: [{ slug: "mmlu", name: "MMLU", category: "Knowledge", score: 89.4 }],
      }),
      makeModel("b", "Model B", {
        benchmarks: [{ slug: "mmlu", name: "MMLU", category: "Knowledge", score: 89.4 }],
      }),
    ];
    const rows = buildBenchmarkComparisons(models);
    assert.deepStrictEqual(rows[0].bestIndices, [0, 1]);
  });

  test("missing scores are null and not counted", () => {
    const models = [
      makeModel("a", "Model A", {
        benchmarks: [{ slug: "mmlu", name: "MMLU", category: "Knowledge", score: 89.4 }],
      }),
      makeModel("b", "Model B", {}),
    ];
    const rows = buildBenchmarkComparisons(models);
    assert.strictEqual(rows[0].scoredCount, 1);
    assert.strictEqual(rows[0].comparable, false);
    assert.deepStrictEqual(rows[0].bestIndices, []);
    assert.deepStrictEqual(rows[0].scores, [89.4, null]);
  });

  test("multiple benchmarks are sorted by name then slug", () => {
    const models = [
      makeModel("a", "Model A", {
        benchmarks: [
          { slug: "swe-bench-verified", name: "SWE-bench Verified", category: "Coding", score: 74.9 },
          { slug: "mmlu", name: "MMLU", category: "Knowledge", score: 89.4 },
        ],
      }),
      makeModel("b", "Model B", {
        benchmarks: [
          { slug: "mmlu", name: "MMLU", category: "Knowledge", score: 90.1 },
          { slug: "swe-bench-verified", name: "SWE-bench Verified", category: "Coding", score: 61.3 },
        ],
      }),
    ];
    const rows = buildBenchmarkComparisons(models);
    assert.strictEqual(rows.length, 2);
    assert.strictEqual(rows[0].slug, "mmlu");
    assert.strictEqual(rows[1].slug, "swe-bench-verified");
  });

  test("lower-is-better direction picks the minimum", () => {
    const models = [
      makeModel("a", "Model A", {
        benchmarks: [{ slug: "perplexity", name: "Perplexity", category: "Other", score: 12.5, higherIsBetter: false }],
      }),
      makeModel("b", "Model B", {
        benchmarks: [{ slug: "perplexity", name: "Perplexity", category: "Other", score: 10.2, higherIsBetter: false }],
      }),
    ];
    const rows = buildBenchmarkComparisons(models);
    assert.deepStrictEqual(rows[0].bestIndices, [1]); // Model B has lower perplexity
  });

  test("scores array is aligned to model order", () => {
    const models = [
      makeModel("a", "Model A", {
        benchmarks: [{ slug: "mmlu", name: "MMLU", category: "Knowledge", score: 50 }],
      }),
      makeModel("b", "Model B", {
        benchmarks: [{ slug: "gpqa-diamond", name: "GPQA Diamond", category: "Science", score: 80 }],
      }),
    ];
    const rows = buildBenchmarkComparisons(models);
    // MMLU: only model A has a score
    assert.deepStrictEqual(rows.find((r) => r.slug === "mmlu")?.scores, [50, null]);
    // GPQA: only model B has a score
    assert.deepStrictEqual(rows.find((r) => r.slug === "gpqa-diamond")?.scores, [null, 80]);
  });
});

describe("buildCapabilityMatrix", () => {
  test("returns empty array when no models have capabilities", () => {
    const models = [makeModel("a", "Model A"), makeModel("b", "Model B")];
    assert.deepStrictEqual(buildCapabilityMatrix(models), []);
  });

  test("builds union of capabilities aligned to model order", () => {
    const models = [
      makeModel("a", "Model A", {
        capabilities: [
          { slug: "streaming", name: "Streaming", category: "Output" },
          { slug: "tool-use", name: "Tool use", category: "Tooling" },
        ],
      }),
      makeModel("b", "Model B", {
        capabilities: [
          { slug: "tool-use", name: "Tool use", category: "Tooling" },
          { slug: "structured-output", name: "Structured output", category: "Output" },
        ],
      }),
    ];
    const rows = buildCapabilityMatrix(models);
    assert.strictEqual(rows.length, 3);
    // Streaming: present in A only
    const streaming = rows.find((r) => r.slug === "streaming");
    assert.ok(streaming);
    assert.deepStrictEqual(streaming?.present, [true, false]);
    // Tool use: present in both
    const toolUse = rows.find((r) => r.slug === "tool-use");
    assert.ok(toolUse);
    assert.deepStrictEqual(toolUse?.present, [true, true]);
    // Structured output: present in B only
    const structured = rows.find((r) => r.slug === "structured-output");
    assert.ok(structured);
    assert.deepStrictEqual(structured?.present, [false, true]);
  });

  test("rows are sorted by category then name", () => {
    const models = [
      makeModel("a", "Model A", {
        capabilities: [
          { slug: "z-cap", name: "Z Capability", category: "Z Category" },
          { slug: "a-cap", name: "A Capability", category: "A Category" },
        ],
      }),
    ];
    const rows = buildCapabilityMatrix(models);
    assert.strictEqual(rows[0].category, "A Category");
    assert.strictEqual(rows[1].category, "Z Category");
  });

  test("present array length matches model count", () => {
    const models = [
      makeModel("a", "Model A", {
        capabilities: [{ slug: "cap-1", name: "Cap 1", category: "Cat" }],
      }),
      makeModel("b", "Model B", {
        capabilities: [{ slug: "cap-1", name: "Cap 1", category: "Cat" }],
      }),
      makeModel("c", "Model C", {}),
    ];
    const rows = buildCapabilityMatrix(models);
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].present.length, 3);
    assert.deepStrictEqual(rows[0].present, [true, true, false]);
  });
});
