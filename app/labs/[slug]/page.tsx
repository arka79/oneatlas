import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, Database, ExternalLink, FlaskConical } from "lucide-react";
import { DirectoryModelTable } from "@/components/directory/model-table";
import { IllustrativeDataNote } from "@/components/models/provenance-note";
import { Tag } from "@/components/models/tag";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getLabBySlug, type LabDetail } from "@/lib/queries/labs";

export const dynamic = "force-dynamic";

type LabPageProps = PageProps<"/labs/[slug]">;

export async function generateMetadata({ params }: LabPageProps): Promise<Metadata> {
  const { slug } = await params;
  let lab: LabDetail | null;

  try {
    lab = await getLabBySlug(slug);
  } catch {
    return { title: "Lab" };
  }

  if (!lab) {
    notFound();
  }

  return {
    title: lab.name,
    description: `${lab.name}: ${lab.modelCount} models in the OneAtlas catalogue, with links to each model's pricing, context window, providers, and benchmarks.`,
  };
}

export default async function LabProfilePage({ params }: LabPageProps) {
  const { slug } = await params;

  let lab: LabDetail | null;

  try {
    lab = await getLabBySlug(slug);
  } catch (error) {
    console.error(`Could not load lab "${slug}". Is PostgreSQL running and seeded?`, error);

    return (
      <div className="mx-auto max-w-2xl py-6">
        <EmptyState
          icon={<Database className="size-5" />}
          title="Lab unavailable"
          description="This lab could not be loaded from PostgreSQL. Check that the database is running and seeded, then reload."
          action={<ButtonLink href="/labs">Back to labs</ButtonLink>}
        />
      </div>
    );
  }

  if (!lab) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/labs" className="transition-colors hover:text-foreground">
              Labs
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="size-3.5" />
          </li>
          <li>
            <span aria-current="page" className="text-foreground">
              {lab.name}
            </span>
          </li>
        </ol>
      </nav>

      <header>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
              <span>Lab</span>
              {lab.country ? (
                <>
                  <span aria-hidden="true" className="text-muted">
                    /
                  </span>
                  <span className="text-muted">{lab.country}</span>
                </>
              ) : null}
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {lab.name}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">{lab.description}</p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              <Tag tone="primary">Lab</Tag>
              {lab.country ? <Tag>{lab.country}</Tag> : null}
              {lab.foundedYear ? <Tag>Founded {lab.foundedYear}</Tag> : null}
              <Tag>
                {lab.modelCount} model{lab.modelCount === 1 ? "" : "s"}
              </Tag>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col lg:items-stretch">
            <ButtonLink href={`/models?lab=${lab.slug}`} variant="primary" className="lg:min-w-44">
              Browse this lab&apos;s models
            </ButtonLink>
            <ButtonLink href={`/api/labs/${lab.slug}`} variant="secondary">
              View JSON API
            </ButtonLink>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
          <a
            href={lab.websiteUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            Lab website
            <ExternalLink className="size-3" aria-hidden="true" />
          </a>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
        <div className="bg-surface px-4 py-4">
          <p className="text-[10px] uppercase leading-4 tracking-[0.1em] text-muted">Models</p>
          <p className="mt-1 font-mono text-sm font-medium tabular-nums">{lab.modelCount}</p>
        </div>
        <div className="bg-surface px-4 py-4">
          <p className="text-[10px] uppercase leading-4 tracking-[0.1em] text-muted">Country</p>
          <p className="mt-1 text-sm font-medium">{lab.country ?? "Not stated"}</p>
        </div>
        <div className="bg-surface px-4 py-4">
          <p className="text-[10px] uppercase leading-4 tracking-[0.1em] text-muted">Founded</p>
          <p className="mt-1 font-mono text-sm font-medium tabular-nums">
            {lab.foundedYear ?? "Not stated"}
          </p>
        </div>
      </div>

      <IllustrativeDataNote lastUpdated={lab.updatedAt} />

      <section aria-labelledby="lab-models-heading" className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 id="lab-models-heading" className="text-base font-semibold tracking-tight">
              Model portfolio
            </h2>
            <p className="mt-1 text-xs leading-5 text-muted">
              Models built by {lab.name}, newest release first. Each row links to the full model
              record.
            </p>
          </div>
          <span className="text-xs text-muted">
            {lab.models.length} model{lab.models.length === 1 ? "" : "s"}
          </span>
        </div>

        {lab.models.length === 0 ? (
          <EmptyState
            icon={<FlaskConical className="size-5" />}
            title="No models recorded"
            description={`No catalogue models are linked to ${lab.name} yet.`}
            action={<ButtonLink href="/models">Browse all models</ButtonLink>}
          />
        ) : (
          <DirectoryModelTable
            mode="lab"
            label={`Models built by ${lab.name}`}
            models={lab.models}
          />
        )}
      </section>

      <Link
        href="/labs"
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium transition-colors hover:border-border-strong hover:bg-surface-raised"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to labs
      </Link>
    </div>
  );
}
