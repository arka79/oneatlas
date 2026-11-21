import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatScore, formatTokenCount } from "@/lib/format";
import type { LeaderboardRow } from "@/lib/queries/leaderboard";
import { MODEL_TYPE_LABELS } from "@/lib/schemas/model-search";

type LeaderboardTableProps = {
  rows: LeaderboardRow[];
  unit: string;
  higherIsBetter: boolean;
  benchmarkName: string;
};

function scoreWidth(score: number, unit: string): number | null {
  if (unit !== "%" || !Number.isFinite(score)) return null;
  return Math.max(0, Math.min(100, score));
}

/**
 * Ranked rows within one benchmark. Bars are drawn only for percentage units,
 * because no shared scale exists for arbitrary benchmark units. The numeric
 * score is always shown, so the table never depends on the bar.
 */
export function LeaderboardTable({
  rows,
  unit,
  higherIsBetter,
  benchmarkName,
}: LeaderboardTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full min-w-[52rem] text-left text-sm">
        <caption className="sr-only">
          Models ranked by score on {benchmarkName}. {higherIsBetter ? "Higher" : "Lower"} scores are
          better. Rows are ordered best first.
        </caption>
        <thead className="border-b border-border bg-surface-raised text-[11px] uppercase tracking-wider text-muted">
          <tr>
            <th scope="col" className="w-16 px-4 py-3 font-medium">
              Rank
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Model
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Type
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Context
            </th>
            <th scope="col" className="min-w-64 px-4 py-3 font-medium">
              Score{unit ? ` (${unit === "%" ? "%" : unit})` : ""}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => {
            const width = scoreWidth(row.score, unit);
            const isLeader = row.rank === 1;

            return (
              <tr key={`${row.benchmark.slug}-${row.model.slug}`}>
                <td className="px-4 py-3 align-top">
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      isLeader ? "font-semibold text-success" : "text-muted"
                    }`}
                  >
                    #{row.rank}
                  </span>
                </td>

                <th scope="row" className="px-4 py-3 align-top font-normal">
                  <Link
                    href={`/models/${row.model.slug}`}
                    className="font-medium text-foreground transition-colors hover:text-primary"
                  >
                    {row.model.name}
                  </Link>
                  <p className="mt-0.5 text-[11px] text-muted">
                    <Link
                      href={`/labs/${row.model.lab.slug}`}
                      className="transition-colors hover:text-foreground"
                    >
                      {row.model.lab.name}
                    </Link>
                    {row.model.isOpenWeights ? " · Open weights" : ""}
                  </p>
                </th>

                <td className="px-4 py-3 align-top">
                  <Badge>{MODEL_TYPE_LABELS[row.model.modelType]}</Badge>
                </td>

                <td className="px-4 py-3 text-right align-top font-mono text-xs tabular-nums">
                  {formatTokenCount(row.model.contextWindow)}
                </td>

                <td className="px-4 py-3 align-top">
                  <div className="flex items-center gap-3">
                    <span className="w-20 shrink-0 font-mono text-sm tabular-nums">
                      {formatScore(row.score, unit)}
                    </span>
                    {width !== null ? (
                      <span
                        className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-raised"
                        aria-hidden="true"
                      >
                        <span
                          className={`block h-full rounded-full ${
                            isLeader ? "bg-success" : "bg-primary"
                          }`}
                          style={{ width: `${width}%` }}
                        />
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted">
                        Numeric only ({unit || "unit not stated"})
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
