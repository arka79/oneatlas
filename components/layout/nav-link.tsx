"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavLinkProps = {
  href: string;
  label: string;
  icon: ReactNode;
  onNavigate?: () => void;
};

export function NavLink({ href, label, icon, onNavigate }: NavLinkProps) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-primary/10 text-foreground"
          : "text-muted hover:bg-surface-raised hover:text-foreground"
      }`}
    >
      <span
        className={`shrink-0 ${active ? "text-primary" : "text-muted group-hover:text-foreground"}`}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}
