import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatPrice, formatTokenCount } from "@/lib/format";
import { isUsablePrice } from "@/lib/pricing";
import type { LabModelSummary } from "@/lib/queries/labs";
import type { ProviderModelListing } from "@/lib/queries/providers";
import { MODEL_TYPE_LABELS } from "@/lib/schemas/model-search";

type DirectoryModelTableProps =
  | {
      mode: "lab";
      label: string;
      models: LabModelSummary[];
    }
  | {
      mode: "provider";
      label: string;
      models: ProviderModelListing[];
    };

type DirectoryRow = {
  slug: string;
  name: string;
  modelType: LabModelSummary["modelType"];
  releaseDate: string;
  contextWindow: number;
  inputPricePerMTokUsd: number;
  outputPricePerMTokUsd: number;
  isOpenWeights: boolean;
  license: string;
  lab?: { slug: string; name: string };
  providerCount?: number;
  providerPrice?: {
    inputPricePerMTokUsd: number | null;
    outputPricePerMTokUsd: number | null;
  };
  isAvailable?: boolean;
  availableRegions?: string[];
  notes?: string | null;
};

type PriceCellProps = {
  listPrice: number;
  override?: number | null;
  showProviderRate: boolean;
};

function PriceCell({ listPrice, override, showProviderRate }: PriceCellProps) {
  const hasOverride = override !== null && override !== undefined;
  const effectivePrice = hasOverride ? override : listPrice;

  if (!isUsablePrice(effectivePrice)) {
    return <span className="text-xs text-muted">Not available</span>;
  }

  return (
    <>
      <span className="font-mono tabular-nums">{formatPrice(effectivePrice)}</span>
      {showProviderRate ? (
        <span className="mt-0.5 block text-[10px] text-muted">
          {hasOverride && isUsablePrice(listPrice)
            ? `provider rate · list ${formatPrice(listPrice)}`
            : "list price"}
        </span>
      ) : null}
    </>
  );
}

/**
 * Shared model table for lab portfolios and provider listings. Provider mode
 * adds the lab and listing-specific availability, regions, notes, and rates
 * from the real `ModelProvider` join; lab mode shows the provider count.
 */
export function DirectoryModelTable(props: DirectoryModelTableProps) {
  const rows: DirectoryRow[] =
    props.mode === "lab"
      ? props.models.map((model) => ({
          slug: model.slug,
          name: model.name,
          modelType: model.modelType,
          releaseDate: model.releaseDate,
          contextWindow: model.contextWindow,
          inputPricePerMTokUsd: model.inputPricePerMTokUsd,
          outputPricePerMTokUsd: model.outputPricePerMTokUsd,
          isOpenWeights: model.isOpenWeights,
          license: model.license,
          providerCount: model.providerCount,
        }))
      : props.models.map((model) => ({
          slug: model.slug,
          name: model.name,
          modelType: model.modelType,
          releaseDate: model.releaseDate,
          contextWindow: model.contextWindow,
          inputPricePerMTokUsd: model.inputPricePerMTokUsd,
          outputPricePerMTokUsd: model.outputPricePerMTokUsd,
          isOpenWeights: model.isOpenWeights,
          license: model.license,
          lab: model.lab,
          providerPrice: model.providerPrice,
          isAvailable: model.isAvailable,
          availableRegions: model.availableRegions,
          notes: model.notes,
        }));

  const isProvider = props.mode === "provider";

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full min-w-[58rem] text-left text-sm">
        <caption className="sr-only">{props.label}</caption>
        <thead className="border-b border-border bg-surface-raised text-[11px] uppercase tracking-wider text-muted">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              Model
            </th>
            {isProvider ? (
              <th scope="col" className="px-4 py-3 font-medium">
                Lab
              </th>
            ) : null}
            <th scope="col" className="px-4 py-3 font-medium">
              Type
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Context
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Input / 1M
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Output / 1M
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              {isProvider ? "Availability" : "Providers"}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((model) => (
            <tr key={model.slug}>
              <th scope="row" className="px-4 py-3 align-top font-normal">
                <Link
                  href={`/models/${model.slug}`}
                  className="font-medium text-foreground transition-colors hover:text-primary"
                >
                  {model.name}
                </Link>
                <p className="mt-0.5 text-[11px] text-muted">
                  {formatDate(model.releaseDate)} · {model.license}
                  {model.isOpenWeights ? " · Open weights" : ""}
                </p>
              </th>

              {isProvider ? (
                <td className="px-4 py-3 align-top text-xs">
                  {model.lab ? (
                    <Link
                      href={`/labs/${model.lab.slug}`}
                      className="text-muted-strong transition-colors hover:text-primary"
                    >
                      {model.lab.name}
                    </Link>
                  ) : (
                    <span className="text-muted">Unknown</span>
                  )}
                </td>
              ) : null}

              <td className="px-4 py-3 align-top">
                <Badge>{MODEL_TYPE_LABELS[model.modelType]}</Badge>
              </td>

              <td className="px-4 py-3 text-right align-top font-mono text-xs tabular-nums">
                {formatTokenCount(model.contextWindow)}
              </td>

              <td className="px-4 py-3 text-right align-top text-xs">
                <PriceCell
                  listPrice={model.inputPricePerMTokUsd}
                  override={model.providerPrice?.inputPricePerMTokUsd}
                  showProviderRate={isProvider}
                />
              </td>

              <td className="px-4 py-3 text-right align-top text-xs">
                <PriceCell
                  listPrice={model.outputPricePerMTokUsd}
                  override={model.providerPrice?.outputPricePerMTokUsd}
                  showProviderRate={isProvider}
                />
              </td>

              <td className="max-w-64 px-4 py-3 align-top text-xs">
                {isProvider ? (
                  <>
                    <Badge variant={model.isAvailable ? "success" : "neutral"}>
                      {model.isAvailable ? "Available" : "Unavailable"}
                    </Badge>
                    <p className="mt-1 text-[11px] leading-5 text-muted">
                      {model.availableRegions && model.availableRegions.length > 0
                        ? model.availableRegions.join(" · ")
                        : "Regions not listed"}
                    </p>
                    {model.notes ? (
                      <p className="mt-1 text-[11px] leading-5 text-muted">{model.notes}</p>
                    ) : null}
                  </>
                ) : (
                  <span className="text-muted">
                    <span className="font-mono tabular-nums text-foreground">
                      {model.providerCount ?? 0}
                    </span>{" "}
                    listing{(model.providerCount ?? 0) === 1 ? "" : "s"}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
