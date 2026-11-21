import { Skeleton } from "@/components/ui/skeleton";

export default function ProviderProfileLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading provider profile…</span>

      <div className="flex items-center gap-2">
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="size-3 rounded-full" />
        <Skeleton className="h-3.5 w-28" />
      </div>

      <div className="space-y-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-10 w-2/3 max-w-md" />
        <Skeleton className="h-4 w-full max-w-3xl" />
        <Skeleton className="h-4 w-5/6 max-w-2xl" />
        <div className="flex flex-wrap gap-1.5 pt-1">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-6 w-20 rounded-md" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="bg-surface px-4 py-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-5 w-24" />
          </div>
        ))}
      </div>

      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}
