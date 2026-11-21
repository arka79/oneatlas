import type { ReactNode } from "react";
import Link from "next/link";

type StatCardProps = {
  label: string;
  value: number | string;
  hint?: string;
  icon: ReactNode;
  href?: string;
};

export function StatCard({ label, value, hint, icon, href }: StatCardProps) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">{label}</span>
        <span className="text-muted" aria-hidden="true">
          {icon}
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-mono text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
        {hint ? <span className="text-xs text-muted">{hint}</span> : null}
      </div>
    </>
  );

  const classes = "block rounded-xl border border-border bg-surface p-4";

  return href ? (
    <Link
      href={href}
      className={`${classes} transition-colors hover:border-border-strong hover:bg-surface-raised`}
    >
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}
