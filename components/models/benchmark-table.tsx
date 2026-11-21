import { formatDate, formatScore } from "@/lib/format";
import type { ModelBenchmarkResult } from "@/lib/queries/models";

function percentageWidth(score: number, unit: string): number | null {
  if (unit !== "%" || !Number.isFinite(score)) return null;
  return Math.max(0, Math.min(100, score));
}

/**
 * Benchmark scores for one model. Bars are only drawn for percentage units, so
 * the visual scale is never invented for a benchmark with an unknown maximum.
 * Seed sources are explicit placeholders; no citation links are fabricated.
 */
export function BenchmarkTable({ benchmarks }: { benchmarks: ModelBenchmarkResult[] }) {
  return (
    <section
      aria-labelledby="benchmarks-heading"
      className="rounded-xl border border-border bg-surface p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="benchmarks-heading" className="text-base font-semibold">
          Benchmark scores
        </h2>
        <span className="text-xs text-muted">{benchmarks.length} recorded</span>
      </div>
      <p className="mt-1 text-xs leading-6 text-muted">
        Illustrative figures entered for this demo. They are not published results and should not be
        compared across different sources. Bars use the 0–100% scale for percentage benchmarks;
        other units are shown as numbers only.
      </p>

      {benchmarks.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No benchmark scores are recorded for this model.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {benchmarks.map((benchmark) => {
            const width = percentageWidth(benchmark.score, benchmark.unit);

            return (
              <li
                key={benchmark.slug}
                className="rounded-lg border border-border bg-background/40 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{benchmark.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {benchmark.category} · updated {formatDate(benchmark.lastUpdated)}
                    </p>
                  </div>
                  <p className="shrink-0 font-mono text-sm">
                    {formatScore(benchmark.score, benchmark.unit)}
                  </p>
                </div>

                {width !== null ? (
                  <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-surface-raised">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${width}%` }}
                      aria-hidden="true"
                    />
                  </div>
                ) : null}

                <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-[11px] text-muted">
                  <span>{benchmark.higherIsBetter ? "Higher is better" : "Lower is better"}</span>
                  <span>{width !== null ? "0–100% scale" : `Unit: ${benchmark.unit}`}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
