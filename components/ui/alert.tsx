import type { ReactNode } from "react";

type AlertTone = "info" | "warning" | "danger";

const toneClasses: Record<AlertTone, { wrapper: string; dot: string }> = {
  info: { wrapper: "border-border bg-surface", dot: "bg-info" },
  warning: { wrapper: "border-warning/35 bg-warning/10", dot: "bg-warning" },
  danger: { wrapper: "border-danger/35 bg-danger/10", dot: "bg-danger" },
};

type AlertProps = {
  tone?: AlertTone;
  title: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function Alert({ tone = "info", title, children, className = "" }: AlertProps) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={`rounded-xl border p-4 ${toneClasses[tone].wrapper} ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={`mt-1.5 size-1.5 shrink-0 rounded-full ${toneClasses[tone].dot}`}
          aria-hidden="true"
        />
        <div className="min-w-0 text-sm">
          <p className="font-medium">{title}</p>
          {children ? (
            <div className="mt-1 text-[13px] leading-6 text-muted">{children}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
