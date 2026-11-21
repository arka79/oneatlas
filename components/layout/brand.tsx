import Link from "next/link";
import { Compass } from "lucide-react";

export function Brand() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 rounded-md">
      <span className="grid size-7 place-items-center rounded-md border border-primary/30 bg-primary/10 text-primary">
        <Compass className="size-4" aria-hidden="true" />
      </span>
      <span className="text-sm font-semibold tracking-tight">OneAtlas</span>
      <span className="rounded border border-border px-1 py-px font-mono text-[10px] uppercase tracking-wide text-muted">
        dev
      </span>
    </Link>
  );
}
