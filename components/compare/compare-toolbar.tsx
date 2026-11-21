"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight, Plus, X } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { buildCatalogCompareHref, buildCompareHref } from "@/lib/compare";
import { COMPARE_MAX_MODELS } from "@/lib/schemas/compare";

export type CompareSelection = { slug: string; name: string };
export type CompareOption = { slug: string; name: string; lab: string };

type CompareToolbarProps = {
  selected: CompareSelection[];
  options: CompareOption[];
};

/**
 * URL-backed selection controls. Adding or removing a model rewrites
 * `/compare?ids=…`, so the server re-renders the comparison and the selection
 * survives refreshes, sharing, and navigation back to the catalogue.
 */
export function CompareToolbar({ selected, options }: CompareToolbarProps) {
  const router = useRouter();
  const [pendingSlug, setPendingSlug] = useState("");
  const [isPending, startTransition] = useTransition();
  const selectedSet = new Set(selected.map((model) => model.slug));
  const availableOptions = options.filter((option) => !selectedSet.has(option.slug));
  const atLimit = selected.length >= COMPARE_MAX_MODELS;

  const navigate = (slugs: string[]) => {
    startTransition(() => {
      router.replace(buildCompareHref(slugs), { scroll: false });
    });
  };

  const handleAdd = () => {
    if (!pendingSlug || atLimit || selectedSet.has(pendingSlug)) return;

    const nextSlug = pendingSlug;
    setPendingSlug("");
    navigate([...selected.map((model) => model.slug), nextSlug]);
  };

  const handleRemove = (slug: string) => {
    navigate(selected.map((model) => model.slug).filter((selectedSlug) => selectedSlug !== slug));
  };

  return (
    <section
      aria-labelledby="compare-selection-heading"
      className="rounded-xl border border-border bg-surface p-4 lg:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="compare-selection-heading" className="text-sm font-semibold tracking-tight">
            Selected models ({selected.length}/{COMPARE_MAX_MODELS})
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted">
            Selection order follows the URL and is kept when you browse the catalogue.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-52">
            <label htmlFor="compare-add-model" className="sr-only">
              Add a model to the comparison
            </label>
            <select
              id="compare-add-model"
              value={pendingSlug}
              onChange={(event) => setPendingSlug(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleAdd();
                }
              }}
              disabled={atLimit || availableOptions.length === 0 || isPending}
              className="h-9 w-full max-w-64 rounded-lg border border-border bg-background px-3 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {atLimit
                  ? "Remove a model to add another"
                  : availableOptions.length === 0
                    ? "No models available"
                    : "Choose a model…"}
              </option>
              {availableOptions.map((option) => (
                <option key={option.slug} value={option.slug}>
                  {option.name} — {option.lab}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleAdd}
            disabled={!pendingSlug || atLimit || isPending}
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Add
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => navigate([])}
            disabled={selected.length === 0 || isPending}
          >
            Clear
          </Button>
        </div>
      </div>

      {selected.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {selected.map((model) => (
            <span
              key={model.slug}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-raised px-2 py-1 text-xs text-muted-strong"
            >
              {model.name}
              <button
                type="button"
                onClick={() => handleRemove(model.slug)}
                disabled={isPending}
                aria-label={`Remove ${model.name} from the comparison`}
                className="rounded text-muted transition-colors hover:text-foreground disabled:opacity-50"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">
          No models selected yet. Add one above, or pick several from the{" "}
          <Link href="/models" className="text-foreground underline underline-offset-2 hover:text-primary">
            catalogue
          </Link>
          .
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <p role="status" aria-live="polite" className="text-xs text-muted">
          {isPending
            ? "Updating comparison…"
            : atLimit
              ? `Maximum of ${COMPARE_MAX_MODELS} models reached. Remove one to add another.`
              : "Add up to four models; two or more unlock the comparison and cost estimator."}
        </p>

        {availableOptions.length === 0 && options.length === 0 ? (
          <p className="text-xs text-muted">The model picker is unavailable right now.</p>
        ) : null}

        <ButtonLink
          href={buildCatalogCompareHref(selected.map((model) => model.slug))}
          size="sm"
          variant="secondary"
        >
          Browse catalogue
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </ButtonLink>
      </div>
    </section>
  );
}
