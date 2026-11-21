import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Tag } from "@/components/models/tag";

type DirectoryCardProps = {
  href: string;
  name: string;
  description: string;
  icon: ReactNode;
  entityLabel: string;
  modelCount: number;
  meta?: string[];
  websiteUrl?: string;
};

/**
 * Shared card for lab and provider directories. Database counts and metadata
 * are passed in; the card makes no claims beyond the referenced profile.
 */
export function DirectoryCard({
  href,
  name,
  description,
  icon,
  entityLabel,
  modelCount,
  meta = [],
  websiteUrl,
}: DirectoryCardProps) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong">
      <div className="flex items-start justify-between gap-3">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-surface-raised text-muted-strong"
          aria-hidden="true"
        >
          {icon}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          {entityLabel}
        </span>
      </div>

      <div className="mt-3 flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold tracking-tight">
          <Link href={href} className="transition-colors hover:text-primary">
            {name}
          </Link>
        </h3>
        {websiteUrl ? (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`${name} website (opens in a new tab)`}
            className="mt-0.5 shrink-0 text-muted transition-colors hover:text-foreground"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        ) : null}
      </div>

      <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{description}</p>

      {meta.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {meta.map((entry) => (
            <Tag key={entry}>{entry}</Tag>
          ))}
        </div>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs">
        <span className="text-muted">
          <span className="font-mono tabular-nums text-foreground">{modelCount}</span> model
          {modelCount === 1 ? "" : "s"}
        </span>
        <Link
          href={href}
          className="inline-flex items-center gap-1 font-medium text-foreground transition-colors hover:text-primary"
        >
          View profile
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
