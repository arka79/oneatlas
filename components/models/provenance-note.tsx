import { formatDate } from "@/lib/format";

type IllustrativeDataNoteProps = {
  lastUpdated?: string;
  sourceUrl?: string;
  dataSource?: string;
};

/**
 * Provenance disclosure. The assignment requires seeded data to be labelled
 * rather than presented as live vendor or benchmark data, so every catalogue
 * surface links back to this note.
 */
export function IllustrativeDataNote({ lastUpdated, sourceUrl, dataSource }: IllustrativeDataNoteProps) {
  return (
    <p className="rounded-lg border border-border bg-surface px-4 py-3 text-xs leading-6 text-muted">
      <strong className="font-semibold text-foreground">Illustrative data.</strong> This catalogue is
      seeded demo data, not live vendor pricing or independently verified benchmark results.
      {lastUpdated ? <> Last updated {formatDate(lastUpdated)}.</> : null}
      {dataSource ? <> Data source: {dataSource}</> : null}
      {sourceUrl ? (
        <>
          {" "}
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-foreground underline underline-offset-2 hover:text-primary"
          >
            Source
          </a>
          .
        </>
      ) : null}
    </p>
  );
}
