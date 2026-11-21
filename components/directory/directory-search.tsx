import Link from "next/link";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type DirectorySearchProps = {
  action: string;
  q?: string;
  label: string;
  placeholder: string;
};

/**
 * Server-rendered directory search. A plain GET form keeps the query in the
 * URL, works without JavaScript, and resets pagination when a new term is
 * submitted.
 */
export function DirectorySearch({ action, q, label, placeholder }: DirectorySearchProps) {
  return (
    <section
      aria-labelledby="directory-search-heading"
      className="rounded-xl border border-border bg-surface p-4 lg:p-5"
    >
      <h2 id="directory-search-heading" className="text-sm font-semibold tracking-tight">
        {label}
      </h2>
      <p className="mt-1 text-xs leading-5 text-muted">
        The search term is stored in the URL, so results can be bookmarked or shared.
      </p>

      <form action={action} method="get" role="search" aria-label={label} className="mt-3">
        <label htmlFor="directory-search-input" className="sr-only">
          {label}
        </label>
        <div className="relative max-w-xl">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            key={q ?? ""}
            id="directory-search-input"
            name="q"
            type="search"
            defaultValue={q ?? ""}
            maxLength={80}
            placeholder={placeholder}
            className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-24 text-sm text-foreground placeholder:text-muted/70 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
          />
          <Button type="submit" size="sm" className="absolute right-1.5 top-1/2 -translate-y-1/2">
            Search
          </Button>
        </div>
      </form>

      {q ? (
        <Link
          href={action}
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-foreground"
        >
          <X className="size-3" aria-hidden="true" />
          Clear search
        </Link>
      ) : null}
    </section>
  );
}
