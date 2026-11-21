import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type QueryValue = string | number | undefined;

type CollectionPaginationProps = {
  /** Route the pagination links point at, e.g. `/labs`. */
  path: string;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  /** Plural noun used in the summary and accessible label. */
  itemLabel: string;
  /** Filters to preserve in every link. Page is managed by this component. */
  query?: Record<string, QueryValue>;
};

const controlClass =
  "inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-surface-raised";
const disabledClass =
  "inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm font-medium opacity-40";

function pageHref(
  path: string,
  query: Record<string, QueryValue> | undefined,
  target: number,
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }

  if (target > 1) {
    params.set("page", String(target));
  } else {
    params.delete("page");
  }

  const queryString = params.toString();
  return `${path}${queryString ? `?${queryString}` : ""}`;
}

/**
 * Shared server-rendered pagination for directories and the leaderboard.
 * Filters are preserved and the canonical first page omits `?page=1`.
 */
export function CollectionPagination({
  path,
  page,
  pageSize,
  total,
  totalPages,
  itemLabel,
  query,
}: CollectionPaginationProps) {
  if (total === 0) return null;

  const firstItem = (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label={`${itemLabel} pagination`}
      className="flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row"
    >
      <p className="text-sm text-muted">
        Showing <span className="text-foreground">{firstItem}</span>–
        <span className="text-foreground">{lastItem}</span> of {total} {itemLabel}
      </p>

      <div className="flex items-center gap-2">
        {page <= 1 ? (
          <span className={disabledClass} aria-disabled="true">
            <ChevronLeft className="size-4" aria-hidden="true" />
            Previous
          </span>
        ) : (
          <Link href={pageHref(path, query, page - 1)} rel="prev" className={controlClass}>
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
          <Link href={pageHref(path, query, page + 1)} rel="next" className={controlClass}>
            Next
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </nav>
  );
}
