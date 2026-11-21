import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import type { ModelProviderListing } from "@/lib/queries/models";

type ProviderAvailabilityProps = {
  providers: ModelProviderListing[];
  listInputPrice: number;
  listOutputPrice: number;
};

/**
 * Lists the providers that serve a model. Availability and region coverage are
 * properties of the listing; a listing may also carry its own rate. When it
 * does not, the model's list price is shown and labelled as such.
 */
export function ProviderAvailability({
  providers,
  listInputPrice,
  listOutputPrice,
}: ProviderAvailabilityProps) {
  const availableCount = providers.filter((provider) => provider.isAvailable).length;

  return (
    <section
      aria-labelledby="providers-heading"
      className="rounded-xl border border-border bg-surface p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="providers-heading" className="text-base font-semibold">
          Providers and availability
        </h2>
        <span className="text-xs text-muted">
          {availableCount} available · {providers.length} listed
        </span>
      </div>
      <p className="mt-1 text-xs leading-6 text-muted">
        Seeded listings. Real provider availability, regions, and rates can differ — confirm with the
        provider.
      </p>

      {providers.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No providers are listed for this model.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {providers.map((provider) => {
            const inputPrice = provider.inputPricePerMTokUsd ?? listInputPrice;
            const outputPrice = provider.outputPricePerMTokUsd ?? listOutputPrice;
            const hasOverride =
              provider.inputPricePerMTokUsd !== null || provider.outputPricePerMTokUsd !== null;
            const regions =
              provider.availableRegions.length > 0
                ? provider.availableRegions
                : provider.regions;

            return (
              <li
                key={provider.slug}
                className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/providers/${provider.slug}`}
                      className="text-sm font-medium transition-colors hover:text-primary"
                    >
                      {provider.name}
                    </Link>
                    <a
                      href={provider.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${provider.name} website (opens in a new tab)`}
                      className="text-muted transition-colors hover:text-foreground"
                    >
                      <ExternalLink className="size-3" aria-hidden="true" />
                    </a>
                    <Badge variant={provider.isAvailable ? "success" : "neutral"}>
                      {provider.isAvailable ? "Available" : "Unavailable"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {regions.length > 0 ? regions.join(" · ") : "Regions not listed"}
                  </p>
                </div>

                {provider.isAvailable ? (
                  <div className="text-left sm:text-right">
                    <p className="font-mono text-xs">
                      {formatPrice(inputPrice)} in · {formatPrice(outputPrice)} out
                    </p>
                    <p className="text-xs text-muted">
                      {hasOverride ? "Provider-specific rate" : "List price"} per 1M tokens
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted">Currently unavailable; rates omitted.</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
