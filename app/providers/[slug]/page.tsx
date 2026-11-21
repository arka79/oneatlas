import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, Database, ExternalLink, ServerCog } from "lucide-react";
import { DirectoryModelTable } from "@/components/directory/model-table";
import { IllustrativeDataNote } from "@/components/models/provenance-note";
import { Tag } from "@/components/models/tag";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getProviderBySlug, type ProviderDetail } from "@/lib/queries/providers";

export const dynamic = "force-dynamic";

type ProviderPageProps = PageProps<"/providers/[slug]">;

export async function generateMetadata({ params }: ProviderPageProps): Promise<Metadata> {
  const { slug } = await params;
  let provider: ProviderDetail | null;

  try {
    provider = await getProviderBySlug(slug);
  } catch {
    return { title: "Provider" };
  }

  if (!provider) {
    notFound();
  }

  return {
    title: provider.name,
    description: `${provider.name}: ${provider.modelCount} model listings with availability, regions, and provider-specific token rates.`,
  };
}

export default async function ProviderProfilePage({ params }: ProviderPageProps) {
  const { slug } = await params;

  let provider: ProviderDetail | null;

  try {
    provider = await getProviderBySlug(slug);
  } catch (error) {
    console.error(
      `Could not load provider "${slug}". Is PostgreSQL running and seeded?`,
      error,
    );

    return (
      <div className="mx-auto max-w-2xl py-6">
        <EmptyState
          icon={<Database className="size-5" />}
          title="Provider unavailable"
          description="This provider could not be loaded from PostgreSQL. Check that the database is running and seeded, then reload."
          action={<ButtonLink href="/providers">Back to providers</ButtonLink>}
        />
      </div>
    );
  }

  if (!provider) {
    notFound();
  }

  const availableCount = provider.models.filter((model) => model.isAvailable).length;
  const sortedModels = [...provider.models].sort(
    (a, b) => Number(b.isAvailable) - Number(a.isAvailable) || a.name.localeCompare(b.name),
  );

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/providers" className="transition-colors hover:text-foreground">
              Providers
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="size-3.5" />
          </li>
          <li>
            <span aria-current="page" className="text-foreground">
              {provider.name}
            </span>
          </li>
        </ol>
      </nav>

      <header>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
              <span>Provider</span>
              {provider.regions.length > 0 ? (
                <>
                  <span aria-hidden="true" className="text-muted">
                    /
                  </span>
                  <span className="text-muted">{provider.regions.join(" · ")}</span>
                </>
              ) : null}
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {provider.name}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">{provider.description}</p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              <Tag tone="primary">Provider</Tag>
              {provider.regions.map((region) => (
                <Tag key={region}>{region}</Tag>
              ))}
              <Tag>
                {provider.modelCount} listing{provider.modelCount === 1 ? "" : "s"}
              </Tag>
              <Tag>{availableCount} available</Tag>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col lg:items-stretch">
            <ButtonLink
              href={`/models?provider=${provider.slug}`}
              variant="primary"
              className="lg:min-w-48"
            >
              Browse served models
            </ButtonLink>
            <ButtonLink href={`/api/providers/${provider.slug}`} variant="secondary">
              View JSON API
            </ButtonLink>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
          <a
            href={provider.websiteUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            Provider website
            <ExternalLink className="size-3" aria-hidden="true" />
          </a>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
        <div className="bg-surface px-4 py-4">
          <p className="text-[10px] uppercase leading-4 tracking-[0.1em] text-muted">Listings</p>
          <p className="mt-1 font-mono text-sm font-medium tabular-nums">{provider.modelCount}</p>
        </div>
        <div className="bg-surface px-4 py-4">
          <p className="text-[10px] uppercase leading-4 tracking-[0.1em] text-muted">Available</p>
          <p className="mt-1 font-mono text-sm font-medium tabular-nums">{availableCount}</p>
        </div>
        <div className="bg-surface px-4 py-4">
          <p className="text-[10px] uppercase leading-4 tracking-[0.1em] text-muted">Regions</p>
          <p className="mt-1 text-sm font-medium">
            {provider.regions.length > 0 ? provider.regions.join(", ") : "Not stated"}
          </p>
        </div>
      </div>

      <IllustrativeDataNote lastUpdated={provider.updatedAt} />

      <section aria-labelledby="provider-models-heading" className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 id="provider-models-heading" className="text-base font-semibold tracking-tight">
              Model listings
            </h2>
            <p className="mt-1 text-xs leading-5 text-muted">
              Availability, regions, and provider-specific rates come from the model-provider
              listing. When no override exists, the model&apos;s list price is shown.
            </p>
          </div>
          <span className="text-xs text-muted">
            {sortedModels.length} listing{sortedModels.length === 1 ? "" : "s"}
          </span>
        </div>

        {sortedModels.length === 0 ? (
          <EmptyState
            icon={<ServerCog className="size-5" />}
            title="No model listings"
            description={`No catalogue models are recorded as served by ${provider.name} yet.`}
            action={<ButtonLink href="/models">Browse all models</ButtonLink>}
          />
        ) : (
          <DirectoryModelTable
            mode="provider"
            label={`Models served by ${provider.name}`}
            models={sortedModels}
          />
        )}
      </section>

      <Link
        href="/providers"
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium transition-colors hover:border-border-strong hover:bg-surface-raised"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to providers
      </Link>
    </div>
  );
}
