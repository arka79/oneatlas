import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buildBenchmarkComparisons } from "@/lib/compare";
import { formatScore } from "@/lib/format";
import type { ModelDetail } from "@/lib/queries/models";

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

/**
 * Benchmark matrix with an explicit comparability rule: a best score is
 * highlighted only within one benchmark row when at least two selected models
 * have a recorded score. Missing results stay visibly missing.
 */
export function BenchmarkCompare({ models }: { models: ModelDetail[] }) {
  const rows = buildBenchmarkComparisons(models);
  const comparableRows = rows.filter((row) => row.comparable);
  const partialRows = rows.filter((row) => row.scoredCount === 1);
  const modelsWithoutScores = models.filter((model) => model.benchmarks.length === 0);

  return (
    <section
      aria-labelledby="compare-benchmarks-heading"
      className="rounded-xl border border-border bg-surface"
    >
      <header className="border-b border-border px-4 py-4 lg:px-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="compare-benchmarks-heading" className="text-base font-semibold tracking-tight">
            Benchmark scores
          </h2>
          <span className="text-xs text-muted">
            {rows.length} benchmark{rows.length === 1 ? "" : "s"} with at least one result
          </span>
        </div>
        <p className="mt-1 text-xs leading-5 text-muted">
          Rows are grouped by benchmark, so scores are only compared within the same evaluation.
          Different benchmarks use different scales and are not directly comparable.
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="p-4 lg:p-5">
          <Alert tone="info" title="No benchmark data for this selection">
            <p>
              None of the selected models has a recorded benchmark score, so there is nothing to
              compare in this section. That is missing data, not a zero score.
            </p>
          </Alert>
        </div>
      ) : (
        <>
          {comparableRows.length === 0 ? (
            <div className="px-4 pt-4 lg:px-5">
              <Alert tone="warning" title="No directly comparable benchmark rows">
                <p>
                  No benchmark has scores from at least two selected models. Scores are shown below
                  without a best-value highlight.
                </p>
              </Alert>
            </div>
          ) : null}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
              <caption className="sr-only">
                Benchmark scores for the selected models, grouped by benchmark
              </caption>
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="sticky left-0 z-20 w-56 min-w-48 border-b border-border bg-surface px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-muted"
                  >
                    Benchmark
                  </th>
                  {models.map((model) => (
                    <th
                      key={model.slug}
                      scope="col"
                      className="min-w-36 border-b border-border bg-surface px-4 py-3 align-bottom text-xs font-semibold text-foreground"
                    >
                      {model.name}
                      <span className="mt-0.5 block text-[11px] font-normal text-muted">
                        {model.lab.name}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.slug}>
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-surface px-4 py-3 align-top"
                    >
                      <span className="block text-xs font-medium text-foreground">{row.name}</span>
                      <span className="mt-0.5 block text-[11px] font-normal text-muted">
                        {row.category} · {row.unit === "%" ? "percent" : row.unit} ·{" "}
                        {row.higherIsBetter ? "higher is better" : "lower is better"}
                      </span>
                    </th>
                    {models.map((model, index) => {
                      const score = row.scores[index];
                      const isBest = row.bestIndices.includes(index);

                      return (
                        <td
                          key={model.slug}
                          className={`px-4 py-3 align-top text-xs ${
                            isBest ? "bg-success/[0.07]" : ""
                          }`}
                        >
                          {score === null ? (
                            <span className="text-muted">
                              —<span className="sr-only"> Not recorded</span>
                            </span>
                          ) : (
                            <span className="flex flex-wrap items-center gap-1.5">
                              <span className="font-mono tabular-nums">
                                {formatScore(score, row.unit)}
                              </span>
                              {isBest ? <Badge variant="success">Top score</Badge> : null}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-1.5 border-t border-border px-4 py-3 text-xs leading-5 text-muted lg:px-5">
            <li>
              A dash means no result is recorded for that model, not a score of zero. A model can be
              missing from a benchmark that other selected models have taken.
            </li>
            {modelsWithoutScores.length > 0 ? (
              <li>
                No benchmark results are recorded for{" "}
                {joinNames(modelsWithoutScores.map((model) => model.name))}.
              </li>
            ) : null}
            {partialRows.length > 0 ? (
              <li>
                {partialRows.length} row{partialRows.length === 1 ? " has" : "s have"} a score for
                only one selected model, so no best value is highlighted there.
              </li>
            ) : null}
            <li>
              Scores are illustrative seed data, not published results. “Top score” follows the
              benchmark’s recorded higher-is-better or lower-is-better direction and also marks ties.
            </li>
          </ul>
        </>
      )}
    </section>
  );
}
