import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildModelSearchQuery, type ModelSearch } from "@/lib/schemas/model-search";

type ModelPaginationProps = {
  search: ModelSearch;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const controlClass =
  "inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-surface-raised";
const disabledClass =
  "inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm font-medium opacity-40";

export function ModelPagination({ search, page, pageSize, total, totalPages }: ModelPaginationProps) {
  if (total === 0) {
    return null;
  }

  const firstItem = (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Model pagination"
      className="flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row"
    >
      <p className="text-sm text-muted">
        Showing <span className="text-foreground">{firstItem}</span>–
        <span className="text-foreground">{lastItem}</span> of {total} models
      </p>

      <div className="flex items-center gap-2">
        {page <= 1 ? (
          <span className={disabledClass} aria-disabled="true">
            <ChevronLeft className="size-4" aria-hidden="true" />
            Previous
          </span>
        ) : (
          <Link
            href={`/models${buildModelSearchQuery(search, { page: page - 1 })}`}
            rel="prev"
            className={controlClass}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            Previous
          </Link>
        )}

        <span className="px-1 text-sm text-muted">
          Page {page} of {totalPages}
        </span>

        {page >= totalPages ? (
          <span className={disabledClass} aria-disabled="true">
            Next
            <ChevronRight className="size-4" aria-hidden="true" />
          </span>
        ) : (
          <Link
            href={`/models${buildModelSearchQuery(search, { page: page + 1 })}`}
            rel="next"
            className={controlClass}
          >
            Next
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </nav>
  );
}
