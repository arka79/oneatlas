import type { ModelDetail } from "@/lib/queries/models";
import { COMPARE_MAX_MODELS } from "@/lib/schemas/compare";

/**
 * Pure comparison helpers shared by the compare page's server-rendered tables.
 * Selection lives in the URL; these functions only derive presentation data.
 */

export type BestDirection = "lower" | "higher";

/** Canonical `/compare` URL for a selection, preserving selection order. */
export function buildCompareHref(slugs: string[]): string {
  const unique = [...new Set(slugs)].slice(0, COMPARE_MAX_MODELS);

  return unique.length > 0
    ? `/compare?ids=${unique.map((slug) => encodeURIComponent(slug)).join(",")}`
    : "/compare";
}

/** Catalogue deep link that rehydrates the same selection in the explorer. */
export function buildCatalogCompareHref(slugs: string[]): string {
  const unique = [...new Set(slugs)].slice(0, COMPARE_MAX_MODELS);

  return unique.length > 0
    ? `/models?compare=${unique.map((slug) => encodeURIComponent(slug)).join(",")}`
    : "/models";
}

/**
 * Indices holding the best finite value. A winner is only meaningful when at
 * least two models have a value, so single-value rows and all-missing rows
 * intentionally return no indices (and therefore no highlight).
 */
export function bestValueIndices(
  values: Array<number | null>,
  direction: BestDirection,
): number[] {
  const finite = values.flatMap((value, index) =>
    typeof value === "number" && Number.isFinite(value) ? [{ value, index }] : [],
  );

  if (finite.length < 2) return [];

  const target =
    direction === "lower"
      ? Math.min(...finite.map((entry) => entry.value))
      : Math.max(...finite.map((entry) => entry.value));

  return finite.filter((entry) => entry.value === target).map((entry) => entry.index);
}

export type BenchmarkComparison = {
  slug: string;
  name: string;
  category: string;
  unit: string;
  higherIsBetter: boolean;
  /** Aligned to the model order passed in; null means "not recorded". */
  scores: Array<number | null>;
  scoredCount: number;
  comparable: boolean;
  bestIndices: number[];
};

/**
 * Pivots per-model benchmark results into one row per benchmark. Results are
 * comparable only within the same benchmark slug, and a winner is highlighted
 * only when at least two selected models have a score for that benchmark.
 */
export function buildBenchmarkComparisons(models: ModelDetail[]): BenchmarkComparison[] {
  const rows = new Map<
    string,
    Omit<BenchmarkComparison, "scoredCount" | "comparable" | "bestIndices">
  >();

  models.forEach((model, modelIndex) => {
    for (const result of model.benchmarks) {
      let row = rows.get(result.slug);

      if (!row) {
        row = {
          slug: result.slug,
          name: result.name,
          category: result.category,
          unit: result.unit,
          higherIsBetter: result.higherIsBetter,
          scores: models.map(() => null),
        };
        rows.set(result.slug, row);
      }

      row.scores[modelIndex] = Number.isFinite(result.score) ? result.score : null;
    }
  });

  return [...rows.values()]
    .sort((a, b) => a.name.localeCompare(b.name) || a.slug.localeCompare(b.slug))
    .map((row) => {
      const scoredCount = row.scores.filter((score) => score !== null).length;

      return {
        ...row,
        scoredCount,
        comparable: scoredCount >= 2,
        bestIndices: bestValueIndices(row.scores, row.higherIsBetter ? "higher" : "lower"),
      };
    });
}

export type CapabilityMatrixRow = {
  slug: string;
  name: string;
  category: string;
  present: boolean[];
};

/** Union of recorded capabilities, one row per capability, aligned to models. */
export function buildCapabilityMatrix(models: ModelDetail[]): CapabilityMatrixRow[] {
  const rows = new Map<string, CapabilityMatrixRow>();

  models.forEach((model, modelIndex) => {
    for (const capability of model.capabilities) {
      const row = rows.get(capability.slug) ?? {
        slug: capability.slug,
        name: capability.name,
        category: capability.category,
        present: models.map(() => false),
      };

      row.present[modelIndex] = true;
      rows.set(capability.slug, row);
    }
  });

  return [...rows.values()].sort(
    (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
  );
}
