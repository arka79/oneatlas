"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { NAV_GROUPS } from "@/components/layout/nav-items";
import { NavLink } from "@/components/layout/nav-link";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;

    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        trigger?.focus();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
      );

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-surface-raised hover:text-foreground lg:hidden"
      >
        <Menu className="size-4" aria-hidden="true" />
        <span className="sr-only">Open navigation</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            aria-hidden="true"
            onClick={close}
          />
          <div
            ref={panelRef}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-border bg-surface shadow-2xl"
          >
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <Brand />
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-raised hover:text-foreground"
              >
                <X className="size-4" aria-hidden="true" />
                <span className="sr-only">Close navigation</span>
              </button>
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
                        <NavLink
                          {...item}
                          icon={<Icon className="size-4" />}
                          onNavigate={() => setOpen(false)}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>

            <div className="border-t border-border p-4 text-[11px] leading-5 text-muted">
              Seeded illustrative data · last updated 2026-11-01
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
