import Link from "next/link";
import { RotateCcw, Search } from "lucide-react";
import type { ModelFilterOptions } from "@/lib/queries/models";
import {
  MODALITIES,
  MODALITY_LABELS,
  MODEL_SORTS,
  MODEL_SORT_LABELS,
  type ModelSearch,
} from "@/lib/schemas/model-search";

const labelClass = "text-xs font-medium uppercase tracking-wider text-muted";
const fieldClass =
  "mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/70";

/**
 * Server-rendered GET form: filtering, sorting, and search live in the URL, so
 * results survive reloads, are shareable, and work without client JavaScript.
 */
export function ModelFilters({ search, options }: { search: ModelSearch; options: ModelFilterOptions }) {
  return (
    <form
      method="get"
      action="/models"
      role="search"
      aria-label="Filter the model catalog"
      className="grid gap-4 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-5"
    >
      <div className="sm:col-span-2">
        <label htmlFor="model-search-q" className={labelClass}>
          Search
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-[1.15rem] size-4 text-muted"
            aria-hidden="true"
          />
          <input
            id="model-search-q"
            name="q"
            type="search"
            defaultValue={search.q ?? ""}
            placeholder="Model name, lab, licence, or capability"
            maxLength={80}
            className={`${fieldClass} pl-9`}
          />
        </div>
      </div>

      <div>
        <label htmlFor="model-search-lab" className={labelClass}>
          Lab
        </label>
        <select id="model-search-lab" name="lab" defaultValue={search.lab ?? ""} className={fieldClass}>
          <option value="">All labs</option>
          {options.labs.map((lab) => (
            <option key={lab.value} value={lab.value}>
              {lab.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="model-search-provider" className={labelClass}>
          Provider
        </label>
        <select
          id="model-search-provider"
          name="provider"
          defaultValue={search.provider ?? ""}
          className={fieldClass}
        >
          <option value="">All providers</option>
          {options.providers.map((provider) => (
            <option key={provider.value} value={provider.value}>
              {provider.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="model-search-modality" className={labelClass}>
          Modality
        </label>
        <select
          id="model-search-modality"
          name="modality"
          defaultValue={search.modality ?? ""}
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
        <label htmlFor="model-search-weights" className={labelClass}>
          Weights
        </label>
        <select
          id="model-search-weights"
          name="openWeights"
          defaultValue={search.openWeights ?? ""}
          className={fieldClass}
        >
          <option value="">Any weights</option>
          <option value="true">Open weights only</option>
          <option value="false">Closed weights only</option>
        </select>
      </div>

      <div>
        <label htmlFor="model-search-max-price" className={labelClass}>
          Max input price / 1M
        </label>
        <input
          id="model-search-max-price"
          name="maxPrice"
          type="number"
          inputMode="decimal"
          min={0}
          max={10_000}
          step="0.01"
          defaultValue={search.maxPrice ?? ""}
          placeholder="e.g. 3.00"
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="model-search-sort" className={labelClass}>
          Sort
        </label>
        <select id="model-search-sort" name="sort" defaultValue={search.sort} className={fieldClass}>
          {MODEL_SORTS.map((sort) => (
            <option key={sort} value={sort}>
              {MODEL_SORT_LABELS[sort]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
        <button
          type="submit"
          className="inline-flex flex-1 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-strong"
        >
          Apply filters
        </button>
        <Link
          href="/models"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-raised hover:text-foreground"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Reset
        </Link>
      </div>
    </form>
  );
}
