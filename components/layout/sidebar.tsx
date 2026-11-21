import { Brand } from "@/components/layout/brand";
import { NAV_GROUPS } from "@/components/layout/nav-items";
import { NavLink } from "@/components/layout/nav-link";

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-border bg-surface/60 lg:flex">
      <div className="flex h-14 items-center border-b border-border px-4">
        <Brand />
      </div>

      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5 last:mb-0">
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/80">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ icon: Icon, ...item }) => (
                <li key={item.href}>
                  <NavLink {...item} icon={<Icon className="size-4" />} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="rounded-lg border border-border bg-surface-raised px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-xs font-medium">
            <span className="size-1.5 rounded-full bg-warning" aria-hidden="true" />
            Illustrative data
          </p>
          <p className="mt-1 text-[11px] leading-4 text-muted">
            Seed revision 2026-11-01. Not live pricing.
          </p>
        </div>
        <p className="mt-3 px-1 text-[10px] uppercase tracking-[0.12em] text-muted/70">
          v0.1 · internal preview
        </p>
      </div>
    </aside>
  );
}
