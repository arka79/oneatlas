import type { Metadata } from "next";
import { Database, FlaskConical, SearchX } from "lucide-react";
import { DirectoryCard } from "@/components/directory/directory-card";
import { DirectorySearch } from "@/components/directory/directory-search";
import { IllustrativeDataNote } from "@/components/models/provenance-note";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { CollectionPagination } from "@/components/ui/collection-pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { listLabs, type LabListResult } from "@/lib/queries/labs";
import { parseSearchParams } from "@/lib/schemas/api-query";
import { DEFAULT_DIRECTORY_SEARCH, directorySearchSchema } from "@/lib/schemas/directory-search";
import { toURLSearchParams } from "@/lib/search-params";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Labs",
  description:
    "Search the research organisations behind the catalogue, see their model counts, and open a lab profile with its model portfolio.",
};

const PAGE_SIZE = 9;

export default async function LabsPage({ searchParams }: PageProps<"/labs">) {
  const params = toURLSearchParams(await searchParams);
  const parsed = parseSearchParams(directorySearchSchema, params);
  const search = parsed.success ? parsed.data : DEFAULT_DIRECTORY_SEARCH;

  let result: LabListResult;

  try {
    result = await listLabs({ ...search, pageSize: PAGE_SIZE });
  } catch (error) {
    console.error("Could not load the lab directory.", error);

    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Ecosystem"
          title="Labs"
          description="The research organisations behind the models in the catalogue."
        />
        <EmptyState
          icon={<Database className="size-5" />}
          title="Labs unavailable"
          description="The lab directory could not be loaded from PostgreSQL. Check that the database is running and seeded, then reload."
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
        title="Labs"
        description="Research organisations that build the models in the catalogue. Search by name, description, or country, then open a lab profile to see its linked model portfolio."
        actions={<ButtonLink href="/api/labs">JSON API</ButtonLink>}
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
        action="/labs"
        q={search.q}
        label="Search labs"
        placeholder="Lab name, description, or country"
      />

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-muted" aria-live="polite">
          <span className="font-mono tabular-nums text-foreground">{result.total}</span> lab
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
          title="No labs match this search"
          description={
            hasSearch
              ? `No lab name, description, or country contains “${search.q}”. Try a shorter term or clear the search.`
              : "No labs are present in the catalogue yet. Seed the database and reload."
          }
          action={
            hasSearch ? (
              <ButtonLink href="/labs" variant="primary">
                Clear search
              </ButtonLink>
            ) : (
              <ButtonLink href="/models">Browse models</ButtonLink>
            )
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {result.data.map((lab) => (
            <li key={lab.slug}>
              <DirectoryCard
                href={`/labs/${lab.slug}`}
                name={lab.name}
                description={lab.description}
                icon={<FlaskConical className="size-4" />}
                entityLabel="Lab"
                modelCount={lab.modelCount}
                websiteUrl={lab.websiteUrl}
                meta={[
                  ...(lab.country ? [lab.country] : []),
                  ...(lab.foundedYear ? [`Founded ${lab.foundedYear}`] : []),
                ]}
              />
            </li>
          ))}
        </ul>
      )}

      <CollectionPagination
        path="/labs"
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        totalPages={result.totalPages}
        itemLabel="labs"
        query={{ q: search.q }}
      />

      <IllustrativeDataNote />
    </div>
  );
}
