import Link from "next/link";
import type { ReactNode } from "react";
import { Tag } from "@/components/models/tag";
import { Badge } from "@/components/ui/badge";
import { bestValueIndices, type BestDirection } from "@/lib/compare";
import { formatDate, formatPrice, formatTokenCount } from "@/lib/format";
import { isUsablePrice } from "@/lib/pricing";
import type { ModelDetail } from "@/lib/queries/models";
import { MODALITY_LABELS, MODEL_TYPE_LABELS } from "@/lib/schemas/model-search";

type MetricCell = {
  content: ReactNode;
  /** Only finite numbers participate in a "best value" comparison. */
  numeric?: number | null;
};

type MetricRow = {
  label: string;
  cells: MetricCell[];
  direction?: BestDirection;
  bestLabel?: string;
};

function priceCell(value: number): MetricCell {
  if (!isUsablePrice(value)) {
    return { content: "Not available", numeric: null };
  }

  return {
    content: (
      <>
        <span className="font-mono tabular-nums">{formatPrice(value)}</span>
        <span className="text-muted"> / 1M tokens</span>
      </>
    ),
    numeric: value,
  };
}

function metricRows(models: ModelDetail[]): MetricRow[] {
  return [
    {
      label: "Lab",
      cells: models.map((model) => ({ content: model.lab.name })),
    },
    {
      label: "Model type",
      cells: models.map((model) => ({ content: MODEL_TYPE_LABELS[model.modelType] })),
    },
    {
      label: "Released",
      cells: models.map((model) => ({ content: formatDate(model.releaseDate) })),
    },
    {
      label: "Providers",
      cells: models.map((model) => {
        const available = model.providers.filter((provider) => provider.isAvailable);

        return {
          content: (
            <>
              <span>
                {available.length > 0
                  ? available.map((provider) => provider.name).join(", ")
                  : "No available listings"}
              </span>
              <span className="mt-0.5 block text-[11px] text-muted">
                {model.providers.length} listing{model.providers.length === 1 ? "" : "s"} in the
                catalogue
              </span>
            </>
          ),
        };
      }),
    },
    {
      label: "Context window",
      direction: "higher",
      bestLabel: "Largest",
      cells: models.map((model) => ({
        content: (
          <>
            <span className="font-mono tabular-nums">{formatTokenCount(model.contextWindow)}</span>
            <span className="text-muted"> tokens</span>
          </>
        ),
        numeric: Number.isFinite(model.contextWindow) ? model.contextWindow : null,
      })),
    },
    {
      label: "Max output",
      direction: "higher",
      bestLabel: "Largest",
      cells: models.map((model) => ({
        content:
          model.maxOutputTokens === null ? (
            <span className="text-muted">Not stated</span>
          ) : (
            <>
              <span className="font-mono tabular-nums">
                {formatTokenCount(model.maxOutputTokens)}
              </span>
              <span className="text-muted"> tokens</span>
            </>
          ),
        numeric: model.maxOutputTokens,
      })),
    },
    {
      label: "Input price",
      direction: "lower",
      bestLabel: "Lowest",
      cells: models.map((model) => priceCell(model.inputPricePerMTokUsd)),
    },
    {
      label: "Output price",
      direction: "lower",
      bestLabel: "Lowest",
      cells: models.map((model) => priceCell(model.outputPricePerMTokUsd)),
    },
    {
      label: "Licence and weights",
      cells: models.map((model) => ({
        content: `${model.isOpenWeights ? "Open weights" : "Closed weights"} · ${model.license}`,
      })),
    },
    {
      label: "Modalities",
      cells: models.map((model) => ({
        content: (
          <span className="flex flex-wrap gap-1">
            {model.modalities.map((modality) => (
              <Tag key={modality}>{MODALITY_LABELS[modality]}</Tag>
            ))}
          </span>
        ),
      })),
    },
  ];
}

/**
 * Side-by-side specifications. Best badges appear only for rows with a valid
 * shared direction and at least two finite values, so a lone price or a
 * missing max-output figure is never presented as a winner.
 */
export function CompareTable({ models }: { models: ModelDetail[] }) {
  const rows = metricRows(models);

  return (
    <section
      aria-labelledby="compare-specs-heading"
      className="rounded-xl border border-border bg-surface"
    >
      <header className="border-b border-border px-4 py-4 lg:px-5">
        <h2 id="compare-specs-heading" className="text-base font-semibold tracking-tight">
          Specifications
        </h2>
        <p className="mt-1 text-xs leading-5 text-muted">
          Highlighted values are the lowest price or largest limit among the selected models only.
          They are not overall recommendations.
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
          <caption className="sr-only">
            Side-by-side pricing, context, provider, and capability specifications for the selected
            models
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-20 w-40 min-w-36 border-b border-border bg-surface px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-muted"
              >
                Attribute
              </th>
              {models.map((model) => (
                <th
                  key={model.slug}
                  scope="col"
                  className="min-w-44 border-b border-border bg-surface px-4 py-3 align-top"
                >
                  <Link
                    href={`/models/${model.slug}`}
                    className="text-sm font-semibold tracking-tight text-foreground transition-colors hover:text-primary"
                  >
                    {model.name}
                  </Link>
                  <span className="mt-1 block text-xs font-normal text-muted">
                    {model.lab.name}
                  </span>
                  <span className="mt-0.5 block text-[11px] font-normal text-muted">
                    {MODEL_TYPE_LABELS[model.modelType]}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => {
              const bestIndices = row.direction
                ? bestValueIndices(
                    row.cells.map((cell) => cell.numeric ?? null),
                    row.direction,
                  )
                : [];

              return (
                <tr key={row.label}>
                  <th
                    scope="row"
                    className="sticky left-0 z-10 bg-surface px-4 py-3 align-top text-xs font-medium text-muted"
                  >
                    {row.label}
                  </th>
                  {models.map((model, index) => {
                    const isBest = bestIndices.includes(index);

                    return (
                      <td
                        key={model.slug}
                        className={`px-4 py-3 align-top text-xs leading-5 ${
                          isBest ? "bg-success/[0.07]" : ""
                        }`}
                      >
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="min-w-0">{row.cells[index].content}</span>
                          {isBest && row.bestLabel ? (
                            <Badge variant="success">{row.bestLabel}</Badge>
                          ) : null}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="border-t border-border px-4 py-3 text-xs leading-5 text-muted lg:px-5">
        Prices are illustrative list prices in US dollars per 1,000,000 tokens. They exclude
        provider-specific overrides, prompt caching, batch discounts, minimum charges, and taxes.
        Embedding models can have an output price of $0. Provider availability is listing data, not
        a live status check.
      </p>
    </section>
  );
}
