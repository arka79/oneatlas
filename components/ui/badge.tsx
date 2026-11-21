import type { ReactNode } from "react";

export type BadgeVariant = "neutral" | "primary" | "outline" | "success" | "warning" | "danger";

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "border-border bg-surface-raised text-muted-strong",
  primary: "border-primary/35 bg-primary/10 text-primary",
  outline: "border-border-strong text-muted",
  success: "border-success/35 bg-success/10 text-success",
  warning: "border-warning/35 bg-warning/10 text-warning",
  danger: "border-danger/35 bg-danger/10 text-danger",
};

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

export function Badge({ children, variant = "neutral", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-4 ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
