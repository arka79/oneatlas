"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatTokenCount } from "@/lib/format";
import type { ModelSummary } from "@/lib/queries/models";
import { MODEL_TYPE_LABELS } from "@/lib/schemas/model-search";

type ModelTableProps = {
  models: ModelSummary[];
  selectedSlugs: string[];
  onToggle: (slug: string) => void;
};

export function ModelTable({ models, selectedSlugs, onToggle }: ModelTableProps) {
  const selected = new Set(selectedSlugs);
  const atLimit = selectedSlugs.length >= 4;

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full min-w-[64rem] text-left text-sm">
        <caption className="sr-only">
          Model catalogue table with pricing, context, providers, and capabilities
        </caption>
        <thead className="border-b border-border bg-surface-raised text-[11px] uppercase tracking-wider text-muted">
          <tr>
            <th scope="col" className="px-3 py-3">
              <span className="sr-only">Compare selection</span>
            </th>
            <th scope="col" className="px-3 py-3 font-medium">
              Model
            </th>
            <th scope="col" className="px-3 py-3 font-medium">
              Type
            </th>
            <th scope="col" className="px-3 py-3 font-medium">
              Providers
            </th>
            <th scope="col" className="px-3 py-3 text-right font-medium">
              Context
            </th>
            <th scope="col" className="px-3 py-3 text-right font-medium">
              Input / 1M
            </th>
            <th scope="col" className="px-3 py-3 text-right font-medium">
              Output / 1M
            </th>
            <th scope="col" className="px-3 py-3 font-medium">
              Capabilities
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {models.map((model) => {
            const isSelected = selected.has(model.slug);
            const visibleCapabilities = model.capabilities.slice(0, 3);

            return (
              <tr key={model.slug} className={isSelected ? "bg-primary/[0.04]" : undefined}>
                <td className="px-3 py-3 align-top">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={atLimit && !isSelected}
                    onChange={() => onToggle(model.slug)}
                    aria-label={`Select ${model.name} for comparison`}
                    className="size-4 cursor-pointer rounded border-border bg-background accent-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"
                  />
                </td>
                <th scope="row" className="px-3 py-3 align-top font-normal">
                  <Link
                    href={`/models/${model.slug}`}
                    className="font-medium text-foreground transition-colors hover:text-primary"
                  >
                    {model.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted">{model.lab.name}</p>
                </th>
                <td className="px-3 py-3 align-top">
                  <Badge>{MODEL_TYPE_LABELS[model.modelType]}</Badge>
                </td>
                <td className="max-w-[14rem] px-3 py-3 align-top text-xs leading-5 text-muted">
                  {model.providers.length > 0
                    ? model.providers.map((provider) => provider.name).join(", ")
                    : "No listings"}
                </td>
                <td className="px-3 py-3 text-right align-top font-mono text-xs">
                  {formatTokenCount(model.contextWindow)}
                </td>
                <td className="px-3 py-3 text-right align-top font-mono text-xs">
                  {formatPrice(model.inputPricePerMTokUsd)}
                </td>
                <td className="px-3 py-3 text-right align-top font-mono text-xs">
                  {formatPrice(model.outputPricePerMTokUsd)}
                </td>
                <td className="px-3 py-3 align-top">
                  <div className="flex max-w-[16rem] flex-wrap gap-1">
                    {visibleCapabilities.map((capability) => (
                      <Badge key={capability.slug}>{capability.name}</Badge>
                    ))}
                    {model.capabilities.length > visibleCapabilities.length ? (
                      <Badge>+{model.capabilities.length - visibleCapabilities.length}</Badge>
                    ) : null}
                    {model.capabilities.length === 0 ? (
                      <span className="text-xs text-muted">None listed</span>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
