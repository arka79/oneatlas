import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-xl border border-dashed border-border bg-surface/50 px-6 py-14 text-center ${className}`}
    >
      {icon ? (
        <span
          className="mx-auto grid size-10 place-items-center rounded-lg border border-border bg-surface-raised text-muted"
          aria-hidden="true"
        >
          {icon}
        </span>
      ) : null}
      <h2 className="mt-4 text-base font-semibold tracking-tight">{title}</h2>
      {description ? (
        <div className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-muted">{description}</div>
      ) : null}
      {action ? <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}
