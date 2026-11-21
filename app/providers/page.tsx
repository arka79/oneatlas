import type { Metadata } from "next";
import { Database, SearchX, ServerCog } from "lucide-react";
import { DirectoryCard } from "@/components/directory/directory-card";
import { DirectorySearch } from "@/components/directory/directory-search";
import { IllustrativeDataNote } from "@/components/models/provenance-note";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { CollectionPagination } from "@/components/ui/collection-pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { listProviders, type ProviderListResult } from "@/lib/queries/providers";
import { parseSearchParams } from "@/lib/schemas/api-query";
import { DEFAULT_DIRECTORY_SEARCH, directorySearchSchema } from "@/lib/schemas/directory-search";
import { toURLSearchParams } from "@/lib/search-params";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Providers",
  description:
    "Search inference providers and marketplaces serving the catalogue, see their model counts, and open a provider profile with availability and rates.",
};

const PAGE_SIZE = 9;

export default async function ProvidersPage({ searchParams }: PageProps<"/providers">) {
  const params = toURLSearchParams(await searchParams);
  const parsed = parseSearchParams(directorySearchSchema, params);
  const search = parsed.success ? parsed.data : DEFAULT_DIRECTORY_SEARCH;

  let result: ProviderListResult;

  try {
    result = await listProviders({ ...search, pageSize: PAGE_SIZE });
  } catch (error) {
    console.error("Could not load the provider directory.", error);

    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Ecosystem"
          title="Providers"
          description="Inference hosts and marketplaces that serve the models in the catalogue."
        />
        <EmptyState
          icon={<Database className="size-5" />}
          title="Providers unavailable"
          description="The provider directory could not be loaded from PostgreSQL. Check that the database is running and seeded, then reload."
          action={<ButtonLink href="/models">Browse models</ButtonLink>}
        />
      </div>
    );
  }

  const hasSearch = Boolean(search.q);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ecosystem"
        title="Providers"
        description="Inference providers, cloud platforms, and marketplaces that host the catalogue. Search by name or description, then open a profile for listing-specific availability, regions, and rates."
        actions={<ButtonLink href="/api/providers">JSON API</ButtonLink>}
      />

      {!parsed.success ? (
        <Alert tone="warning" title="Some search parameters were ignored">
          <ul className="list-inside list-disc space-y-0.5">
            {parsed.issues.map((issue) => (
              <li key={`${issue.field}-${issue.message}`}>
                {issue.field}: {issue.message}
              </li>
            ))}
          </ul>
        </Alert>
      ) : null}

      <DirectorySearch
        action="/providers"
        q={search.q}
        label="Search providers"
        placeholder="Provider name or description"
      />

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-muted" aria-live="polite">
          <span className="font-mono tabular-nums text-foreground">{result.total}</span> provider
          {result.total === 1 ? "" : "s"}
          {hasSearch ? (
            <>
              {" "}
              matching <span className="text-foreground">“{search.q}”</span>
            </>
          ) : null}
        </p>
        {result.totalPages > 1 ? (
          <p className="text-xs text-muted">
            Page {result.page} of {result.totalPages}
          </p>
        ) : null}
      </div>

      {result.data.length === 0 ? (
        <EmptyState
          icon={<SearchX className="size-5" />}
          title="No providers match this search"
          description={
            hasSearch
              ? `No provider name or description contains “${search.q}”. Try a shorter term or clear the search.`
              : "No providers are present in the catalogue yet. Seed the database and reload."
          }
          action={
            hasSearch ? (
              <ButtonLink href="/providers" variant="primary">
                Clear search
              </ButtonLink>
            ) : (
              <ButtonLink href="/models">Browse models</ButtonLink>
            )
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {result.data.map((provider) => (
            <li key={provider.slug}>
              <DirectoryCard
                href={`/providers/${provider.slug}`}
                name={provider.name}
                description={provider.description}
                icon={<ServerCog className="size-4" />}
                entityLabel="Provider"
                modelCount={provider.modelCount}
                websiteUrl={provider.websiteUrl}
                meta={provider.regions}
              />
            </li>
          ))}
        </ul>
      )}

      <CollectionPagination
        path="/providers"
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        totalPages={result.totalPages}
        itemLabel="providers"
        query={{ q: search.q }}
      />

      <IllustrativeDataNote />
    </div>
  );
}
