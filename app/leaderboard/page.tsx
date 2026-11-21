import type { Metadata } from "next";
import { Database, Trophy } from "lucide-react";
import { LeaderboardFilters } from "@/components/leaderboard/leaderboard-filters";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { IllustrativeDataNote } from "@/components/models/provenance-note";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { CollectionPagination } from "@/components/ui/collection-pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  getBenchmarkCatalog,
  listLeaderboard,
  type BenchmarkCatalog,
  type BenchmarkOption,
  type LeaderboardResult,
} from "@/lib/queries/leaderboard";
import { parseSearchParams } from "@/lib/schemas/api-query";
import {
  DEFAULT_LEADERBOARD_SEARCH,
  leaderboardSearchSchema,
  type LeaderboardSort,
} from "@/lib/schemas/leaderboard-search";
import { toURLSearchParams } from "@/lib/search-params";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "Rank models within a single evaluation. Filter by benchmark or category, inspect score direction and coverage, and avoid cross-benchmark composite rankings.",
};

const PAGE_SIZE = 10;

function Unavailable() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Benchmarks"
        title="Leaderboard"
        description="Rank models within a single benchmark. Scores from different benchmarks are never combined."
      />
      <EmptyState
        icon={<Database className="size-5" />}
        title="Leaderboard unavailable"
        description="The benchmark data could not be loaded from PostgreSQL. Check that the database is running and seeded, then reload."
        action={<ButtonLink href="/models">Browse models</ButtonLink>}
      />
    </div>
  );
}

function BenchmarkContext({
  benchmark,
  totalModels,
}: {
  benchmark: BenchmarkOption;
  totalModels: number;
}) {
  const missing = Math.max(0, totalModels - benchmark.resultCount);

  return (
    <section
      aria-labelledby="benchmark-context-heading"
      className="rounded-xl border border-border bg-surface p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
            {benchmark.category}
            {benchmark.version ? ` · ${benchmark.version}` : ""}
          </p>
          <h2
            id="benchmark-context-heading"
            className="mt-1 text-xl font-semibold tracking-tight"
          >
            {benchmark.name}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{benchmark.description}</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="primary">
            {benchmark.higherIsBetter ? "Higher is better" : "Lower is better"}
          </Badge>
          <Badge>{benchmark.unit || "Unit not stated"}</Badge>
          <Badge>{benchmark.resultCount} results</Badge>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
        <div className="bg-surface-raised px-3 py-2.5">
          <dt className="text-[10px] uppercase tracking-[0.1em] text-muted">Ranking</dt>
          <dd className="mt-0.5 text-xs">
            {benchmark.higherIsBetter ? "Highest score first" : "Lowest score first"}
          </dd>
        </div>
        <div className="bg-surface-raised px-3 py-2.5">
          <dt className="text-[10px] uppercase tracking-[0.1em] text-muted">Coverage</dt>
          <dd className="mt-0.5 text-xs">
            {benchmark.resultCount} of {totalModels} models
          </dd>
        </div>
        <div className="bg-surface-raised px-3 py-2.5">
          <dt className="text-[10px] uppercase tracking-[0.1em] text-muted">Missing results</dt>
          <dd className="mt-0.5 text-xs">{missing} models</dd>
        </div>
        <div className="bg-surface-raised px-3 py-2.5">
          <dt className="text-[10px] uppercase tracking-[0.1em] text-muted">Score unit</dt>
          <dd className="mt-0.5 text-xs">{benchmark.unit || "Not stated"}</dd>
        </div>
      </dl>

      <div className="mt-3 space-y-1 text-xs leading-5 text-muted">
        <p>
          Scores are only comparable within this benchmark. This page never calculates a combined
          or universal score across evaluations.
        </p>
        <p>
          {missing > 0
            ? `${missing} model${missing === 1 ? "" : "s"} in the catalogue have no recorded result for this benchmark and are not ranked. Missing data is not a zero score.`
            : "Every model in the catalogue has a recorded result for this benchmark."}
        </p>
      </div>
    </section>
  );
}

export default async function LeaderboardPage({ searchParams }: PageProps<"/leaderboard">) {
  const params = toURLSearchParams(await searchParams);
  const parsed = parseSearchParams(leaderboardSearchSchema, params);
  const search = parsed.success ? parsed.data : DEFAULT_LEADERBOARD_SEARCH;

  let catalog: BenchmarkCatalog;

  try {
    catalog = await getBenchmarkCatalog();
  } catch (error) {
    console.error("Could not load the benchmark leaderboard catalog.", error);
    return <Unavailable />;
  }

  const categories = [...new Set(catalog.benchmarks.map((benchmark) => benchmark.category))].sort(
    (a, b) => a.localeCompare(b),
  );
  const categoryMatch = search.category
    ? categories.find((category) => category.toLowerCase() === search.category!.toLowerCase())
    : undefined;
  const candidates = categoryMatch
    ? catalog.benchmarks.filter((benchmark) => benchmark.category === categoryMatch)
    : catalog.benchmarks;
  const requestedBenchmark = search.benchmark
    ? catalog.benchmarks.find((benchmark) => benchmark.slug === search.benchmark)
    : undefined;  const fallbackBenchmark = [...candidates].sort(
    (a, b) => b.resultCount - a.resultCount || a.name.localeCompare(b.name),
  )[0];

  const warnings: string[] = [];

  if (!parsed.success) {
    warnings.push("Some filter values were invalid and were ignored.");
  }

  if (search.category && !categoryMatch) {
    warnings.push(`No category matches “${search.category}”. Showing all categories.`);
  }

  if (search.benchmark && !requestedBenchmark) {
    warnings.push(
      `No benchmark matches “${search.benchmark}”.${
        fallbackBenchmark ? ` Showing ${fallbackBenchmark.name} instead.` : ""
      }`,
    );
  } else if (
    requestedBenchmark &&
    categoryMatch &&
    requestedBenchmark.category !== categoryMatch
  ) {
    warnings.push(
      `${requestedBenchmark.name} is not in ${categoryMatch}.${
        fallbackBenchmark ? ` Showing ${fallbackBenchmark.name} instead.` : ""
      }`,
    );
  }

  const benchmark =
    requestedBenchmark && (!categoryMatch || requestedBenchmark.category === categoryMatch)
      ? requestedBenchmark
      : fallbackBenchmark;

  if (!benchmark) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Benchmarks"
          title="Leaderboard"
          description="Rank models within a single benchmark. Scores from different benchmarks are never combined."
          actions={<ButtonLink href="/api/leaderboard">JSON API</ButtonLink>}
        />
        {warnings.length > 0 ? (
          <Alert tone="warning" title="Some filters were ignored">
            <ul className="list-inside list-disc space-y-0.5">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </Alert>
        ) : null}
        <EmptyState
          icon={<Trophy className="size-5" />}
          title="No benchmarks available"
          description="The catalogue has no benchmark definitions yet, so there is nothing to rank. Seed the database and reload."
          action={<ButtonLink href="/models">Browse models</ButtonLink>}
        />
      </div>
    );
  }

  const sort: LeaderboardSort = benchmark.higherIsBetter ? "score-desc" : "score-asc";
  let result: LeaderboardResult | null = null;
  let resultError = false;

  try {
    result = await listLeaderboard({
      benchmark: benchmark.slug,
      category: benchmark.category,
      sort,
      page: search.page,
      pageSize: PAGE_SIZE,
    });
  } catch (error) {
    console.error(`Could not load leaderboard rows for "${benchmark.slug}".`, error);
    resultError = true;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Benchmarks"
        title="Leaderboard"
        description="Rank models within one benchmark at a time. Filters and pagination live in the URL; scores from different benchmarks are never combined into a synthetic universal rank."
        actions={<ButtonLink href="/api/leaderboard">JSON API</ButtonLink>}
      />

      {warnings.length > 0 ? (
        <Alert tone="warning" title="Some filters were ignored">
          <ul className="list-inside list-disc space-y-0.5">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </Alert>
      ) : null}

      <LeaderboardFilters
        categories={categories}
        benchmarks={candidates}
        category={categoryMatch}
        benchmarkSlug={benchmark.slug}
      />

      <BenchmarkContext benchmark={benchmark} totalModels={catalog.totalModels} />

      <section aria-labelledby="leaderboard-results-heading" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="leaderboard-results-heading" className="text-base font-semibold tracking-tight">
              Ranked results
            </h2>
            <p className="mt-0.5 text-xs leading-5 text-muted">
              {result ? `${result.total} recorded result${result.total === 1 ? "" : "s"}` : "Loading results"} for {benchmark.name}. Bars use the 0–100% scale only for percentage benchmarks; other units stay numeric.
            </p>
          </div>
          <p className="text-xs text-muted">Rank is within this benchmark only.</p>
        </div>

        {resultError ? (
          <Alert tone="danger" title="Ranked results unavailable">
            <p>
              The benchmark definition loaded, but its result rows could not be read from
              PostgreSQL. Reload to try again.
            </p>
          </Alert>
        ) : result && result.data.length === 0 ? (
          <EmptyState
            icon={<Trophy className="size-5" />}
            title="No recorded results"
            description={`No model has a recorded score for ${benchmark.name}. Missing results are not scored as zero; choose another benchmark or seed the dataset.`}
            action={<ButtonLink href="/leaderboard">Reset leaderboard</ButtonLink>}
          />
        ) : result ? (
          <>
            <LeaderboardTable
              rows={result.data}
              unit={benchmark.unit}
              higherIsBetter={benchmark.higherIsBetter}
              benchmarkName={benchmark.name}
            />
            <CollectionPagination
              path="/leaderboard"
              page={result.page}
              pageSize={result.pageSize}
              total={result.total}
              totalPages={result.totalPages}
              itemLabel="benchmark results"
              query={{ benchmark: benchmark.slug, category: categoryMatch }}
            />
          </>
        ) : null}
      </section>

      <IllustrativeDataNote
        lastUpdated={benchmark.lastUpdated}
        dataSource={benchmark.dataSource}
        sourceUrl={benchmark.sourceUrl ?? undefined}
      />
    </div>
  );
}
