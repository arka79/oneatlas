import { Search } from "lucide-react";
import { MobileNav } from "@/components/layout/mobile-nav";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <MobileNav />

        <form
          action="/models"
          method="get"
          role="search"
          className="relative w-full max-w-md"
        >
          <label htmlFor="global-search" className="sr-only">
            Search models
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            id="global-search"
            name="q"
            type="search"
            maxLength={80}
            placeholder="Search models by name, lab, or capability…"
            className="h-9 w-full rounded-lg border border-transparent bg-surface pl-9 pr-14 text-[13px] text-foreground transition-colors placeholder:text-muted/70 hover:border-border focus-visible:border-primary focus-visible:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted sm:block">
            ↵
          </kbd>
        </form>

        <div className="ml-auto hidden items-center gap-1.5 text-xs text-muted sm:flex">
          <span className="size-1.5 rounded-full bg-warning" aria-hidden="true" />
          Illustrative data
        </div>
      </div>
    </header>
  );
}
