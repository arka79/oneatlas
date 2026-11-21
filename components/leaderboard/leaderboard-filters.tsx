import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BenchmarkOption } from "@/lib/queries/leaderboard";

type LeaderboardFiltersProps = {
  categories: string[];
  benchmarks: BenchmarkOption[];
  category?: string;
  benchmarkSlug?: string;
};

const labelClass = "text-xs font-medium uppercase tracking-wider text-muted";
const fieldClass =
  "mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60";

/**
 * A plain GET form keeps filters in the URL. Rankings are always resolved to
 * one benchmark, so a category narrows the benchmark list rather than blending
 * scores from different evaluations.
 */
export function LeaderboardFilters({
  categories,
  benchmarks,
  category,
  benchmarkSlug,
}: LeaderboardFiltersProps) {
  const grouped = new Map<string, BenchmarkOption[]>();

  for (const benchmark of benchmarks) {
    const group = grouped.get(benchmark.category) ?? [];
    group.push(benchmark);
    grouped.set(benchmark.category, group);
  }

  return (
    <section
      aria-labelledby="leaderboard-filters-heading"
      className="rounded-xl border border-border bg-surface p-4 lg:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="leaderboard-filters-heading" className="text-sm font-semibold tracking-tight">
            Filter rankings
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted">
            Choose a benchmark. A category narrows the benchmark list; it never merges scores.
          </p>
        </div>
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-foreground"
        >
          <RotateCcw className="size-3" aria-hidden="true" />
          Reset
        </Link>
      </div>

      <form
        action="/leaderboard"
        method="get"
        className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end"
      >
        <div>
          <label htmlFor="leaderboard-category" className={labelClass}>
            Category
          </label>
          <select
            id="leaderboard-category"
            name="category"
            defaultValue={category ?? ""}
            className={fieldClass}
          >
            <option value="">All categories</option>
            {categories.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="leaderboard-benchmark" className={labelClass}>
            Benchmark
          </label>
          <select
            id="leaderboard-benchmark"
            name="benchmark"
            defaultValue={benchmarkSlug ?? ""}
            disabled={benchmarks.length === 0}
            className={fieldClass}
          >
            {benchmarks.length === 0 ? <option value="">No benchmarks available</option> : null}
            {[...grouped.entries()].map(([group, options]) => (
              <optgroup key={group} label={group}>
                {options.map((benchmark) => (
                  <option key={benchmark.slug} value={benchmark.slug}>
                    {benchmark.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <Button type="submit" size="md" disabled={benchmarks.length === 0}>
          Apply filters
        </Button>
      </form>
    </section>
  );
}
