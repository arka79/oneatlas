import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Tag } from "@/components/models/tag";
import { formatPrice, formatTokenCount } from "@/lib/format";
import type { ModelSummary } from "@/lib/queries/models";
import { MODEL_TYPE_LABELS } from "@/lib/schemas/model-search";

type ModelCardProps = {
  model: ModelSummary;
  selectable?: boolean;
  selected?: boolean;
  selectionDisabled?: boolean;
  onToggle?: (slug: string) => void;
};

/**
 * Catalogue card. The heading link's overlay makes the whole card clickable,
 * except for the comparison checkbox, which sits above the overlay.
 */
export function ModelCard({
  model,
  selectable = false,
  selected = false,
  selectionDisabled = false,
  onToggle,
}: ModelCardProps) {
  const providerLabel =
    model.providers.length === 0
      ? "No provider listings"
      : `${model.providers
          .slice(0, 2)
          .map((provider) => provider.name)
          .join(", ")}${model.providers.length > 2 ? ` +${model.providers.length - 2}` : ""}`;
  const visibleCapabilities = model.capabilities.slice(0, 3);

  return (
    <article
      className={`group relative flex h-full flex-col rounded-xl border bg-surface p-5 transition-colors ${
        selected
          ? "border-primary/60 bg-primary/[0.04]"
          : "border-border hover:border-primary/50 hover:bg-surface-raised"
      }`}
    >
      {selectable ? (
        <div className="absolute right-4 top-4 z-10">
          <input
            type="checkbox"
            checked={selected}
            disabled={selectionDisabled && !selected}
            onChange={() => onToggle?.(model.slug)}
            aria-label={`Select ${model.name} for comparison`}
            className="size-4 cursor-pointer rounded border-border bg-background accent-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"
          />
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-3 pr-8">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-widest text-muted">{model.lab.name}</p>
          <h3 className="mt-1.5 text-lg font-semibold tracking-tight">
            <Link href={`/models/${model.slug}`} className="after:absolute after:inset-0">
              {model.name}
            </Link>
          </h3>
        </div>
        <ArrowUpRight
          className="size-4 shrink-0 text-muted transition-colors group-hover:text-primary"
          aria-hidden="true"
        />
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{model.description}</p>

      <p className="mt-3 text-xs leading-5 text-muted">
        <span className="font-medium text-muted-strong">Available via</span> {providerLabel}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4 text-sm">
        <div>
          <dt className="text-xs text-muted">Input / 1M</dt>
          <dd className="mt-0.5 font-mono">{formatPrice(model.inputPricePerMTokUsd)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Output / 1M</dt>
          <dd className="mt-0.5 font-mono">{formatPrice(model.outputPricePerMTokUsd)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Context</dt>
          <dd className="mt-0.5 font-mono">{formatTokenCount(model.contextWindow)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Providers</dt>
          <dd className="mt-0.5 font-mono">{model.providers.length}</dd>
        </div>
      </dl>

      <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
        <Tag>{MODEL_TYPE_LABELS[model.modelType]}</Tag>
        {visibleCapabilities.map((capability) => (
          <Tag key={capability.slug}>{capability.name}</Tag>
        ))}
        {model.capabilities.length > visibleCapabilities.length ? (
          <Tag>+{model.capabilities.length - visibleCapabilities.length}</Tag>
        ) : null}
        {model.isOpenWeights ? <Tag tone="primary">Open weights</Tag> : null}
      </div>
    </article>
  );
}
