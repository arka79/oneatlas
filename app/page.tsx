import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  ChevronRight,
  CircleDollarSign,
  FlaskConical,
  Maximize2,
  Search,
  ServerCog,
  Trophy,
} from "lucide-react";
import { IllustrativeDataNote } from "@/components/models/provenance-note";
import { Alert } from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { formatDate, formatPrice, formatTokenCount } from "@/lib/format";
import {
  getDashboardData,
  type DashboardModel,
} from "@/lib/queries/dashboard";
import { MODEL_TYPE_LABELS } from "@/lib/schemas/model-search";

export const dynamic = "force-dynamic";

const quickLinks = [
  { href: "/models?type=REASONING", label: "Reasoning" },
  { href: "/models?type=MULTIMODAL", label: "Multimodal" },
  { href: "/models?openWeights=true", label: "Open weights" },
  { href: "/models?type=EMBEDDING", label: "Embeddings" },
] as const;

function LeaderCard({
  title,
  description,
  icon,
  models,
  metric,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  models: DashboardModel[];
  metric: (model: DashboardModel) => ReactNode;
}) {
  return (
    <Card>
      <CardHeader
        title={title}
        description={description}
        action={
          <span className="text-muted" aria-hidden="true">
            {icon}
          </span>
        }
      />
      <CardContent className="p-0">
        {models.length > 0 ? (
          <ol className="divide-y divide-border">
            {models.map((model, index) => (
              <li key={model.slug}>
                <Link
                  href={`/models/${model.slug}`}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-raised"
                >
                  <span className="w-4 shrink-0 font-mono text-xs text-muted">{index + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{model.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {model.lab.name} · {MODEL_TYPE_LABELS[model.modelType]}
                    </span>
                  </span>
                  <span className="shrink-0 text-right text-xs">{metric(model)}</span>
                  <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p className="px-5 py-8 text-sm text-muted">No model data available.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Overview"
          title="Dashboard"
          description="Database-backed catalogue coverage and model discovery."
        />
        <Alert tone="danger" title="Database not ready">
          <p>The dashboard is served from PostgreSQL. From the project root, run:</p>
          <ol className="mt-2 space-y-1 font-mono text-xs text-foreground">
            <li>npm run db:up</li>
            <li>npm run db:migrate</li>
            <li>npm run db:seed</li>
          </ol>
        </Alert>
      </div>
    );
  }

  const { stats, recentModels, cheapestInput, largestContext, typeCounts } = data;
  const maxTypeCount = Math.max(...typeCounts.map((entry) => entry.count), 1);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="A database-backed view of catalogue coverage, recent releases, and factual price and context comparisons. No popularity or usage trends are inferred."
        actions={
          <ButtonLink href="/models" variant="primary">
            Browse catalog
            <ArrowRight className="size-4" aria-hidden="true" />
          </ButtonLink>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Models"
          value={stats.models}
          hint="in catalog"
          icon={<Boxes className="size-4" />}
          href="/models"
        />
        <StatCard
          label="Labs"
          value={stats.labs}
          hint="research orgs"
          icon={<FlaskConical className="size-4" />}
        />
        <StatCard
          label="Providers"
          value={stats.providers}
          hint="hosting models"
          icon={<ServerCog className="size-4" />}
        />
        <StatCard
          label="Benchmarks"
          value={stats.benchmarks}
          hint="tracked"
          icon={<Trophy className="size-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recently released"
            description="Newest release dates in the catalog. This is not a usage, quality, or popularity ranking."
            action={
              <Link
                href="/models?sort=release-date-desc"
                className="inline-flex items-center gap-1 text-muted transition-colors hover:text-foreground"
              >
                View catalog
                <ArrowRight className="size-3" aria-hidden="true" />
              </Link>
            }
          />
          <CardContent className="p-0">
            {recentModels.length > 0 ? (
              <ul className="divide-y divide-border">
                {recentModels.map((model) => (
                  <li key={model.slug}>
                    <Link
                      href={`/models/${model.slug}`}
                      className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-raised"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{model.name}</p>
                        <p className="mt-0.5 truncate text-xs text-muted">
                          {model.lab.name} · {MODEL_TYPE_LABELS[model.modelType]} ·{" "}
                          {formatDate(model.releaseDate)} · {model.providerCount} provider
                          {model.providerCount === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div className="hidden shrink-0 text-right sm:block">
                        <p className="font-mono text-xs tabular-nums">
                          {formatPrice(model.inputPricePerMTokUsd)}
                          <span className="text-muted"> /1M in</span>
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted">
                          {formatTokenCount(model.contextWindow)} context
                        </p>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-8 text-sm text-muted">No recent models are available.</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Find a model"
              description="Search the live catalogue or start with a focused view."
            />
            <CardContent className="space-y-4">
              <form action="/models" method="get" role="search" className="space-y-2">
                <label htmlFor="dashboard-search" className="sr-only">
                  Search models
                </label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                    aria-hidden="true"
                  />
                  <input
                    id="dashboard-search"
                    name="q"
                    type="search"
                    maxLength={80}
                    placeholder="Model, lab, licence, or capability"
                    className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted/70 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
                  />
                </div>
                <Button type="submit" size="sm" className="w-full">
                  Search models
                </Button>
              </form>

              <div className="flex flex-wrap gap-1.5">
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-md border border-border bg-surface-raised px-2 py-1 text-[11px] font-medium text-muted-strong transition-colors hover:border-border-strong hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <Link
                href="/models"
                className="inline-flex items-center gap-1 text-xs font-medium text-foreground underline underline-offset-2 hover:text-primary"
              >
                Browse all {stats.models} models
                <ArrowRight className="size-3" aria-hidden="true" />
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Model mix"
              description="Counts by model type in the current catalog."
            />
            <CardContent className="space-y-3">
              {typeCounts.map((entry) => (
                <div key={entry.modelType}>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-muted-strong">
                      {MODEL_TYPE_LABELS[entry.modelType]}
                    </span>
                    <span className="font-mono tabular-nums">{entry.count}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-raised">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(4, (entry.count / maxTypeCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <LeaderCard
          title="Lowest input price"
          description="Factual sort of first-party input price per 1M tokens. Not a quality ranking."
          icon={<CircleDollarSign className="size-4" />}
          models={cheapestInput}
          metric={(model) => (
            <>
              <span className="block font-mono tabular-nums">
                {formatPrice(model.inputPricePerMTokUsd)}
              </span>
              <span className="block text-[11px] text-muted">/1M input</span>
            </>
          )}
        />
        <LeaderCard
          title="Largest context windows"
          description="Factual sort by context window; larger windows are not inherently better for every task."
          icon={<Maximize2 className="size-4" />}
          models={largestContext}
          metric={(model) => (
            <>
              <span className="block font-mono tabular-nums">
                {formatTokenCount(model.contextWindow)}
              </span>
              <span className="block text-[11px] text-muted">tokens</span>
            </>
          )}
        />
      </div>

      <IllustrativeDataNote lastUpdated={recentModels[0]?.lastUpdated} />
    </div>
  );
}
