import type { ComponentProps, ReactNode } from "react";

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`rounded-xl border border-border bg-surface ${className}`} {...props} />;
}

type CardHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function CardHeader({ title, description, action, className = "" }: CardHeaderProps) {
  return (
    <div
      className={`flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4 ${className}`}
    >
      <div className="min-w-0">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {description ? <p className="mt-1 text-xs leading-5 text-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0 text-xs">{action}</div> : null}
    </div>
  );
}

export function CardContent({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`p-5 ${className}`} {...props} />;
}
