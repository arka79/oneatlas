"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  type FocusEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Database,
  GitCompare,
  LayoutGrid,
  List,
  RotateCcw,
  Search,
  SearchX,
  X,
} from "lucide-react";
import { ModelCard } from "@/components/models/model-card";
import { ModelTable } from "@/components/models/model-table";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchFilterOptions, fetchModels, type FilterOptions } from "@/lib/api/client";
import { buildCompareHref } from "@/lib/compare";
import type { ModelSummary } from "@/lib/queries/models";
import { COMPARE_MAX_MODELS, parseCompareIds } from "@/lib/schemas/compare";
import {
  buildModelSearchQuery,
  DEFAULT_MODEL_SEARCH,
  MODALITIES,
  MODALITY_LABELS,
  MODEL_SORTS,
  MODEL_SORT_LABELS,
  MODEL_TYPES,
  MODEL_TYPE_LABELS,
  parseModelSearchParams,
  type ModelSearch,
} from "@/lib/schemas/model-search";

type ViewMode = "cards" | "table";
type LoadStatus = "loading" | "ready" | "error";
type OptionsStatus = "loading" | "ready" | "error";
type ListMeta = { page: number; pageSize: number; total: number; totalPages: number };

const labelClass = "text-xs font-medium uppercase tracking-wider text-muted";
const fieldClass =
  "mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted/70 disabled:cursor-not-allowed disabled:opacity-60";

function formatSlug(slug: string) {
  return slug
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function ResultsSkeleton({ view }: { view: ViewMode }) {
  if (view === "table") {
    return <Skeleton className="h-96 rounded-xl" />;
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <li key={index}>
          <Skeleton className="h-64 rounded-xl" />
        </li>
      ))}
    </ul>
  );
}

export function ModelExplorer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchString = searchParams.toString();

  const parsed = useMemo(
    () => parseModelSearchParams(new URLSearchParams(searchString)),
    [searchString],
  );
  const search = parsed.success ? parsed.data : DEFAULT_MODEL_SEARCH;
  const apiQuery = useMemo(() => buildModelSearchQuery(search), [search]);
  const view: ViewMode = searchParams.get("view") === "table" ? "table" : "cards";
  const compareParam = searchParams.get("compare");
  const selectedSlugs = useMemo(() => parseCompareIds(compareParam), [compareParam]);

  const [models, setModels] = useState<ModelSummary[]>([]);
  const [meta, setMeta] = useState<ListMeta | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [loadedQuery, setLoadedQuery] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const isLoading = loadedQuery !== apiQuery;

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    labs: [],
    providers: [],
    capabilities: [],
  });
  const [optionsStatus, setOptionsStatus] = useState<OptionsStatus>("loading");

  const [selectionNotice, setSelectionNotice] = useState("");

  const updateParams = useCallback(
    (
      updates: Record<string, string | number | undefined>,
      options: { keepPage?: boolean; replace?: boolean } = {},
    ) => {
      const next = new URLSearchParams(searchString);

      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === "") {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      }

      if (!options.keepPage && !("page" in updates)) {
        next.delete("page");
      }
      if (next.get("page") === "1") next.delete("page");
      if (next.get("sort") === "release-date-desc") next.delete("sort");
      if (next.get("view") === "cards") next.delete("view");

      const query = next.toString();
      const href = `${pathname}${query ? `?${query}` : ""}`;

      if (options.replace) {
        router.replace(href, { scroll: false });
      } else {
        router.push(href, { scroll: false });
      }
    },
    [pathname, router, searchString],
  );

  const resetFilters = useCallback(() => {
    const next = new URLSearchParams(searchString);

    for (const key of [
      "q",
      "lab",
      "provider",
      "type",
      "capability",
      "modality",
      "openWeights",
      "maxPrice",
      "sort",
      "page",
      "pageSize",
    ]) {
      next.delete(key);
    }

    const query = next.toString();
    router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  }, [pathname, router, searchString]);

  useEffect(() => {
    const controller = new AbortController();

    fetchModels(apiQuery, controller.signal)
      .then((payload) => {
        setModels(payload.data);
        setMeta(payload.meta);
        setStatus("ready");
        setLoadedQuery(apiQuery);
        setErrorMessage("");
        setHasLoaded(true);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("error");
        setLoadedQuery(apiQuery);
        setErrorMessage(
          error instanceof Error ? error.message : "The catalog could not be loaded.",
        );
      });

    return () => controller.abort();
  }, [apiQuery, reloadToken]);

  useEffect(() => {
    const controller = new AbortController();

    fetchFilterOptions(controller.signal)
      .then((options) => {
        setFilterOptions(options);
        setOptionsStatus("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setOptionsStatus("error");
      });

    return () => controller.abort();
  }, []);

  const capabilityGroups = useMemo(() => {
    const groups = new Map<string, FilterOptions["capabilities"]>();

    for (const capability of filterOptions.capabilities) {
      const group = groups.get(capability.category) ?? [];
      group.push(capability);
      groups.set(capability.category, group);
    }

    return [...groups.entries()];
  }, [filterOptions.capabilities]);

  const activeFilterCount = [
    search.q,
    search.lab,
    search.provider,
    search.type,
    search.capability,
    search.modality,
    search.openWeights,
    search.maxPrice !== undefined ? "maxPrice" : undefined,
  ].filter(Boolean).length;
  const hasNonDefaultState =
    !parsed.success ||
    activeFilterCount > 0 ||
    search.sort !== DEFAULT_MODEL_SEARCH.sort ||
    search.page > 1;

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const value = String(formData.get("q") ?? "").trim();
    updateParams({ q: value || undefined });
  };

  const handleMaxPriceBlur = (event: FocusEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value.trim();
    const current = search.maxPrice !== undefined ? String(search.maxPrice) : "";
    if (value !== current) {
      updateParams({ maxPrice: value || undefined });
    }
  };

  const setView = (nextView: ViewMode) => {
    updateParams({ view: nextView === "table" ? "table" : undefined }, {
      keepPage: true,
      replace: true,
    });
  };

  const goToPage = (page: number) => {
    updateParams({ page: page === 1 ? undefined : page }, { keepPage: true });
  };

  const setSelectedSlugs = (next: string[]) => {
    updateParams(
      { compare: next.length > 0 ? next.join(",") : undefined },
      { keepPage: true, replace: true },
    );
    setSelectionNotice("");
  };

  const toggleSelection = (slug: string) => {
    if (selectedSlugs.includes(slug)) {
      setSelectedSlugs(selectedSlugs.filter((selected) => selected !== slug));
      return;
    }

    if (selectedSlugs.length >= COMPARE_MAX_MODELS) {
      setSelectionNotice(`Choose up to ${COMPARE_MAX_MODELS} models to compare.`);
      return;
    }

    setSelectedSlugs([...selectedSlugs, slug]);
  };

  const nameForSlug = (slug: string) =>
    models.find((model) => model.slug === slug)?.name ?? formatSlug(slug);

  const statusText = isLoading
    ? "Updating results…"
    : status === "error"
      ? "Results unavailable."
      : meta
        ? `${meta.total} model${meta.total === 1 ? "" : "s"} matched`
        : "Loading models…";

  return (
    <div className="space-y-5">
      {!parsed.success ? (
        <Alert tone="warning" title="Some URL filters were ignored">
          <ul className="list-inside list-disc space-y-0.5">
            {parsed.issues.map((issue) => (
              <li key={`${issue.field}-${issue.message}`}>
                {issue.field}: {issue.message}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs">Showing the default catalogue results instead.</p>
        </Alert>
      ) : null}

      {optionsStatus === "error" ? (
        <Alert tone="warning" title="Filter options unavailable">
          <p>Search, type, modality, weights, and sorting still work. Reload to retry lab, provider, and capability options.</p>
        </Alert>
      ) : null}

      <section
        aria-labelledby="catalog-filters-heading"
        className="rounded-xl border border-border bg-surface p-4 lg:p-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="catalog-filters-heading" className="text-sm font-semibold tracking-tight">
              Find models
            </h2>
            <p className="mt-1 text-xs leading-5 text-muted">
              Filters, sort, view, pagination, and comparison selection are stored in the URL.
            </p>
          </div>

          <div
            role="group"
            aria-label="Result view"
            className="inline-flex rounded-lg border border-border bg-background p-0.5"
          >
            <button
              type="button"
              aria-pressed={view === "cards"}
              onClick={() => setView("cards")}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                view === "cards"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted hover:bg-surface-raised hover:text-foreground"
              }`}
            >
              <LayoutGrid className="size-3.5" aria-hidden="true" />
              Cards
            </button>
            <button
              type="button"
              aria-pressed={view === "table"}
              onClick={() => setView("table")}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                view === "table"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted hover:bg-surface-raised hover:text-foreground"
              }`}
            >
              <List className="size-3.5" aria-hidden="true" />
              Table
            </button>
          </div>
        </div>

        <form onSubmit={handleSearch} role="search" aria-label="Search the model catalogue" className="mt-4">
          <label htmlFor="catalog-search" className="sr-only">
            Search models
          </label>
          <div className="relative max-w-2xl">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              key={search.q ?? ""}
              id="catalog-search"
              name="q"
              type="search"
              defaultValue={search.q ?? ""}
              maxLength={80}
              placeholder="Search model name, lab, licence, or description"
              className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-24 text-sm text-foreground placeholder:text-muted/70 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-1.5 top-1/2 -translate-y-1/2"
            >
              Search
            </Button>
          </div>
        </form>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="catalog-lab" className={labelClass}>
              Lab
            </label>
            <select
              id="catalog-lab"
              value={search.lab ?? ""}
              onChange={(event) => updateParams({ lab: event.target.value || undefined })}
              disabled={optionsStatus !== "ready"}
              className={fieldClass}
            >
              <option value="">All labs</option>
              {filterOptions.labs.map((lab) => (
                <option key={lab.value} value={lab.value}>
                  {lab.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="catalog-provider" className={labelClass}>
              Provider
            </label>
            <select
              id="catalog-provider"
              value={search.provider ?? ""}
              onChange={(event) => updateParams({ provider: event.target.value || undefined })}
              disabled={optionsStatus !== "ready"}
              className={fieldClass}
            >
              <option value="">All providers</option>
              {filterOptions.providers.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="catalog-type" className={labelClass}>
              Type
            </label>
            <select
              id="catalog-type"
              value={search.type ?? ""}
              onChange={(event) =>
                updateParams({
                  type: (event.target.value || undefined) as ModelSearch["type"],
                })
              }
              className={fieldClass}
            >
              <option value="">All types</option>
              {MODEL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {MODEL_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="catalog-capability" className={labelClass}>
              Capability
            </label>
            <select
              id="catalog-capability"
              value={search.capability ?? ""}
              onChange={(event) =>
                updateParams({ capability: event.target.value || undefined })
              }
              disabled={optionsStatus !== "ready"}
              className={fieldClass}
            >
              <option value="">All capabilities</option>
              {capabilityGroups.map(([category, capabilities]) => (
                <optgroup key={category} label={category}>
                  {capabilities.map((capability) => (
                    <option key={capability.slug} value={capability.slug}>
                      {capability.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="catalog-modality" className={labelClass}>
              Modality
            </label>
            <select
              id="catalog-modality"
              value={search.modality ?? ""}
              onChange={(event) =>
                updateParams({
                  modality: (event.target.value || undefined) as ModelSearch["modality"],
                })
              }
              className={fieldClass}
            >
              <option value="">Any modality</option>
              {MODALITIES.map((modality) => (
                <option key={modality} value={modality}>
                  {MODALITY_LABELS[modality]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="catalog-weights" className={labelClass}>
              Weights
            </label>
            <select
              id="catalog-weights"
              value={search.openWeights ?? ""}
              onChange={(event) =>
                updateParams({
                  openWeights: (event.target.value || undefined) as ModelSearch["openWeights"],
                })
              }
              className={fieldClass}
            >
              <option value="">Any weights</option>
              <option value="true">Open weights</option>
              <option value="false">Closed weights</option>
            </select>
          </div>

          <div>
            <label htmlFor="catalog-max-price" className={labelClass}>
              Max input price / 1M
            </label>
            <input
              key={search.maxPrice ?? ""}
              id="catalog-max-price"
              type="number"
              inputMode="decimal"
              min={0}
              max={10_000}
              step="0.01"
              defaultValue={search.maxPrice ?? ""}
              onBlur={handleMaxPriceBlur}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              placeholder="No ceiling"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="catalog-sort" className={labelClass}>
              Sort
            </label>
            <select
              id="catalog-sort"
              value={search.sort}
              onChange={(event) =>
                updateParams({
                  sort:
                    event.target.value === "release-date-desc"
                      ? undefined
                      : event.target.value,
                })
              }
              className={fieldClass}
            >
              {MODEL_SORTS.map((sort) => (
                <option key={sort} value={sort}>
                  {MODEL_SORT_LABELS[sort]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-xs text-muted" aria-live="polite">
            {statusText}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            disabled={!hasNonDefaultState}
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Reset filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </Button>
        </div>
      </section>

      {selectedSlugs.length > 0 ? (
        <section
          aria-labelledby="compare-selection-heading"
          className="sticky bottom-4 z-20 rounded-xl border border-primary/40 bg-surface-overlay p-3 shadow-xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p id="compare-selection-heading" className="text-xs font-semibold">
                Compare selected ({selectedSlugs.length}/{COMPARE_MAX_MODELS})
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {selectedSlugs.map((slug) => (
                  <span
                    key={slug}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-1.5 py-0.5 text-[11px] text-muted-strong"
                  >
                    {nameForSlug(slug)}
                    <button
                      type="button"
                      onClick={() => toggleSelection(slug)}
                      aria-label={`Remove ${nameForSlug(slug)} from comparison`}
                      className="rounded text-muted transition-colors hover:text-foreground"
                    >
                      <X className="size-3" aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSlugs([])}
              >
                Clear
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => router.push(buildCompareHref(selectedSlugs))}
                disabled={selectedSlugs.length < 2}
              >
                <GitCompare className="size-3.5" aria-hidden="true" />
                Compare selected
              </Button>
            </div>
          </div>
          {selectionNotice ? (
            <p role="status" className="mt-2 text-xs text-warning">
              {selectionNotice}
            </p>
          ) : null}
          {selectedSlugs.length === 1 ? (
            <p className="mt-2 text-xs text-muted">Select one more model to compare.</p>
          ) : null}
        </section>
      ) : null}

      <section aria-labelledby="catalog-results-heading" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="catalog-results-heading" className="text-base font-semibold tracking-tight">
              Results
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {selectedSlugs.length === 0
                ? "Select up to four models with the checkboxes to compare."
                : "Your selection is preserved while you filter. Open Compare for pricing, benchmarks, capabilities, and a cost estimator."}
            </p>
          </div>
        </div>

        {status === "error" && !isLoading ? (
          <Alert tone="danger" title="Catalog unavailable">
            <p>{errorMessage}</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => {
                setStatus("loading");
                setLoadedQuery(null);
                setErrorMessage("");
                setReloadToken((token) => token + 1);
              }}
            >
              <Database className="size-3.5" aria-hidden="true" />
              Try again
            </Button>
          </Alert>
        ) : !hasLoaded || (isLoading && models.length === 0) ? (
          <ResultsSkeleton view={view} />
        ) : models.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface/50 px-6 py-14 text-center">
            <span
              className="mx-auto grid size-10 place-items-center rounded-lg border border-border bg-surface-raised text-muted"
              aria-hidden="true"
            >
              <SearchX className="size-5" />
            </span>
            <h3 className="mt-4 text-base font-semibold tracking-tight">
              No models match these filters
            </h3>
            <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-muted">
              Try a shorter search term, remove a filter, or reset the catalogue.
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-5"
              onClick={resetFilters}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div
            aria-busy={isLoading}
            className={isLoading ? "opacity-60 transition-opacity" : undefined}
          >
            {view === "cards" ? (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {models.map((model) => (
                  <li key={model.slug}>
                    <ModelCard
                      model={model}
                      selectable
                      selected={selectedSlugs.includes(model.slug)}
                      selectionDisabled={selectedSlugs.length >= COMPARE_MAX_MODELS}
                      onToggle={toggleSelection}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <ModelTable
                models={models}
                selectedSlugs={selectedSlugs}
                onToggle={toggleSelection}
              />
            )}

            {meta ? (
              <nav
                aria-label="Model pagination"
                className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-border pt-4 sm:flex-row"
              >
                <p className="text-sm text-muted">
                  Showing{" "}
                  <span className="text-foreground">
                    {(meta.page - 1) * meta.pageSize + 1}
                  </span>
                  –
                  <span className="text-foreground">
                    {Math.min(meta.page * meta.pageSize, meta.total)}
                  </span>{" "}
                  of {meta.total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => goToPage(meta.page - 1)}
                    disabled={meta.page <= 1}
                  >
                    <ChevronLeft className="size-3.5" aria-hidden="true" />
                    Previous
                  </Button>
                  <span className="px-1 text-sm text-muted">
                    Page {meta.page} of {meta.totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => goToPage(meta.page + 1)}
                    disabled={meta.page >= meta.totalPages}
                  >
                    Next
                    <ChevronRight className="size-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </nav>
            ) : null}
          </div>
        )}
      </section>

      <p className="rounded-lg border border-border bg-surface px-4 py-3 text-xs leading-6 text-muted">
        <strong className="font-semibold text-foreground">Illustrative data.</strong> Model
        listings, prices, and capabilities are seeded demo data queried from the live catalogue
        API. They are not live vendor pricing.{" "}
        <Link href="/api/models" className="text-foreground underline underline-offset-2 hover:text-primary">
          View the JSON API
        </Link>
        .
      </p>
    </div>
  );
}
