import { Check, Minus } from "lucide-react";
import { buildCapabilityMatrix } from "@/lib/compare";
import type { ModelDetail } from "@/lib/queries/models";
import { MODALITIES, MODALITY_LABELS } from "@/lib/schemas/model-search";

function PresenceCell({ present }: { present: boolean }) {
  return (
    <td className="px-3 py-2.5 text-center">
      {present ? (
        <Check className="mx-auto size-4 text-success" aria-hidden="true" />
      ) : (
        <Minus className="mx-auto size-4 text-muted" aria-hidden="true" />
      )}
      <span className="sr-only">{present ? "Recorded" : "Not recorded"}</span>
    </td>
  );
}

/**
 * Presence matrices for modalities and capabilities. These answer "what is
 * recorded?" rather than "what is best?" — there is no meaningful winner for a
 * set of feature tags, so nothing is highlighted as a best value.
 */
export function CapabilityCompare({ models }: { models: ModelDetail[] }) {
  const capabilityRows = buildCapabilityMatrix(models);
  const modalityRows = MODALITIES.filter((modality) =>
    models.some((model) => model.modalities.includes(modality)),
  );

  return (
    <section
      aria-labelledby="compare-features-heading"
      className="overflow-hidden rounded-xl border border-border bg-surface"
    >
      <header className="border-b border-border px-4 py-4 lg:px-5">
        <h2 id="compare-features-heading" className="text-base font-semibold tracking-tight">
          Modalities and capabilities
        </h2>
        <p className="mt-1 text-xs leading-5 text-muted">
          Modalities are the input types recorded in the dataset. Capabilities are recorded product
          features, not quality claims. A dash means the feature is not recorded; it does not prove
          the model lacks it.
        </p>
      </header>

      <div className="grid divide-y divide-border xl:grid-cols-2 xl:divide-x xl:divide-y-0">
        <div>
          <div className="flex items-baseline justify-between gap-2 px-4 pb-1 pt-4 lg:px-5">
            <h3 className="text-sm font-semibold">Input modalities</h3>
            <span className="text-[11px] text-muted">{modalityRows.length} recorded</span>
          </div>

          {modalityRows.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted lg:px-5">
              No input modalities are recorded for the selected models.
            </p>
          ) : (
            <div className="overflow-x-auto pb-2">
              <table className="w-full min-w-[28rem] border-collapse text-left text-xs">
                <caption className="sr-only">
                  Recorded input modalities for the selected models
                </caption>
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="w-36 px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-muted lg:px-5"
                    >
                      Modality
                    </th>
                    {models.map((model) => (
                      <th
                        key={model.slug}
                        scope="col"
                        className="px-3 py-2 text-center text-[11px] font-medium text-foreground"
                      >
                        {model.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {modalityRows.map((modality) => (
                    <tr key={modality}>
                      <th
                        scope="row"
                        className="px-4 py-2.5 text-left font-normal text-muted-strong lg:px-5"
                      >
                        {MODALITY_LABELS[modality]}
                      </th>
                      {models.map((model) => (
                        <PresenceCell
                          key={model.slug}
                          present={model.modalities.includes(modality)}
                        />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-2 px-4 pb-1 pt-4 lg:px-5">
            <h3 className="text-sm font-semibold">Capabilities</h3>
            <span className="text-[11px] text-muted">{capabilityRows.length} recorded</span>
          </div>

          {capabilityRows.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted lg:px-5">
              No normalized capabilities are recorded for the selected models.
            </p>
          ) : (
            <div className="overflow-x-auto pb-2">
              <table className="w-full min-w-[28rem] border-collapse text-left text-xs">
                <caption className="sr-only">
                  Recorded capabilities for the selected models
                </caption>
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="w-44 px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-muted lg:px-5"
                    >
                      Capability
                    </th>
                    {models.map((model) => (
                      <th
                        key={model.slug}
                        scope="col"
                        className="px-3 py-2 text-center text-[11px] font-medium text-foreground"
                      >
                        {model.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {capabilityRows.map((capability) => (
                    <tr key={capability.slug}>
                      <th scope="row" className="px-4 py-2.5 text-left font-normal lg:px-5">
                        <span className="block text-muted-strong">{capability.name}</span>
                        <span className="mt-0.5 block text-[10px] text-muted">
                          {capability.category}
                        </span>
                      </th>
                      {models.map((model, index) => (
                        <PresenceCell
                          key={model.slug}
                          present={capability.present[index] ?? false}
                        />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
