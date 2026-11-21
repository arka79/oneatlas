"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Calculator, RotateCcw } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { bestValueIndices } from "@/lib/compare";
import { formatCount, formatCurrency, formatPrice } from "@/lib/format";
import {
  estimateTokenCost,
  isUsablePrice,
  parseTokenCount,
  type TokenUsage,
} from "@/lib/pricing";
import type { ModelDetail } from "@/lib/queries/models";

type FieldErrors = { input?: string; output?: string };

function fieldClass(invalid: boolean): string {
  return `mt-1.5 h-10 w-full rounded-lg border bg-background px-3 font-mono text-sm text-foreground transition-colors placeholder:font-sans placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 ${
    invalid
      ? "border-danger/60 focus-visible:border-danger focus-visible:ring-danger/25"
      : "border-border focus-visible:border-primary focus-visible:ring-primary/25"
  }`;
}

/**
 * List-price token estimator. The form validates whole token counts, the maths
 * lives in `lib/pricing.ts`, and missing prices are reported rather than
 * treated as free. Results are explicitly labelled as estimates.
 */
export function CostEstimator({ models }: { models: ModelDetail[] }) {
  const [inputValue, setInputValue] = useState("");
  const [outputValue, setOutputValue] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [usage, setUsage] = useState<TokenUsage | null>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (usage) resultsHeadingRef.current?.focus();
  }, [usage]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const input = parseTokenCount(inputValue, "input");
    const output = parseTokenCount(outputValue, "output");
    const nextErrors: FieldErrors = {};

    if (!input.success) nextErrors.input = input.message;
    if (!output.success) nextErrors.output = output.message;

    if (!input.success || !output.success) {
      setErrors(nextErrors);
      setFormError("");
      setUsage(null);
      return;
    }

    if (input.value === 0 && output.value === 0) {
      setErrors({});
      setFormError("Enter at least one token count greater than zero.");
      setUsage(null);
      return;
    }

    setErrors({});
    setFormError("");
    setUsage({ inputTokens: input.value, outputTokens: output.value });
  };

  const reset = () => {
    setInputValue("");
    setOutputValue("");
    setErrors({});
    setFormError("");
    setUsage(null);
  };

  const rows = usage
    ? models.map((model) => ({
        model,
        estimate: estimateTokenCost(
          usage,
          model.inputPricePerMTokUsd,
          model.outputPricePerMTokUsd,
        ),
      }))
    : [];
  const cheapestIndices = bestValueIndices(
    rows.map((row) => row.estimate?.totalCost ?? null),
    "lower",
  );
  const pricedCount = rows.filter((row) => row.estimate !== null).length;
  const unavailableCount = rows.length - pricedCount;

  return (
    <section
      aria-labelledby="cost-estimator-heading"
      className="rounded-xl border border-border bg-surface p-4 lg:p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="cost-estimator-heading" className="text-base font-semibold tracking-tight">
          Token cost estimator
        </h2>
        <span className="text-xs text-muted">USD per 1,000,000 tokens</span>
      </div>
      <p className="mt-1 text-xs leading-5 text-muted">
        Enter the token counts for one request or a whole workload. Each model&apos;s estimated cost
        uses its stored input and output list prices.
      </p>

      <Alert tone="info" title="This is an estimate, not a bill" className="mt-4">
        <p>
          Estimated cost = (input tokens ÷ 1,000,000 × input price) + (output tokens ÷ 1,000,000 ×
          output price). This uses each model&apos;s illustrative list price only; provider-specific
          overrides shown on model pages are not applied. It also excludes prompt-caching and batch
          discounts, volume agreements, minimum charges, taxes, and any other fees not represented
          in the dataset. Actual charges may differ.
        </p>
      </Alert>

      <form onSubmit={handleSubmit} noValidate className="mt-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="estimate-input-tokens"
              className="text-xs font-medium uppercase tracking-wider text-muted"
            >
              Estimated input tokens
            </label>
            <input
              id="estimate-input-tokens"
              name="inputTokens"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={inputValue}
              onChange={(event) => {
                setInputValue(event.target.value);
                setErrors((current) => ({ ...current, input: undefined }));
                setFormError("");
              }}
              aria-invalid={Boolean(errors.input)}
              aria-describedby={
                errors.input
                  ? "estimate-input-help estimate-input-error"
                  : "estimate-input-help"
              }
              placeholder="e.g. 1,000,000"
              maxLength={24}
              className={fieldClass(Boolean(errors.input))}
            />
            <p id="estimate-input-help" className="mt-1 text-[11px] leading-4 text-muted">
              Whole tokens; thousands separators are allowed.
            </p>
            {errors.input ? (
              <p id="estimate-input-error" role="alert" className="mt-1 text-xs text-danger">
                {errors.input}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="estimate-output-tokens"
              className="text-xs font-medium uppercase tracking-wider text-muted"
            >
              Estimated output tokens
            </label>
            <input
              id="estimate-output-tokens"
              name="outputTokens"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={outputValue}
              onChange={(event) => {
                setOutputValue(event.target.value);
                setErrors((current) => ({ ...current, output: undefined }));
                setFormError("");
              }}
              aria-invalid={Boolean(errors.output)}
              aria-describedby={
                errors.output
                  ? "estimate-output-help estimate-output-error"
                  : "estimate-output-help"
              }
              placeholder="e.g. 500,000"
              maxLength={24}
              className={fieldClass(Boolean(errors.output))}
            />
            <p id="estimate-output-help" className="mt-1 text-[11px] leading-4 text-muted">
              Tokens generated by the model for the same workload.
            </p>
            {errors.output ? (
              <p id="estimate-output-error" role="alert" className="mt-1 text-xs text-danger">
                {errors.output}
              </p>
            ) : null}
          </div>
        </div>

        {formError ? (
          <p role="alert" className="mt-3 text-xs text-danger">
            {formError}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm">
            <Calculator className="size-3.5" aria-hidden="true" />
            Calculate estimate
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={reset}>
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Reset
          </Button>
        </div>
      </form>

      {usage ? (
        <div className="mt-5 border-t border-border pt-4" aria-live="polite">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3
              ref={resultsHeadingRef}
              tabIndex={-1}
              className="text-sm font-semibold tracking-tight"
            >
              Estimated cost
            </h3>
            <p className="text-xs text-muted">
              {formatCount(usage.inputTokens)} input + {formatCount(usage.outputTokens)} output
              tokens
            </p>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
              <caption className="sr-only">
                Estimated token cost per selected model for the entered token counts
              </caption>
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted">
                  <th scope="col" className="px-3 py-2 font-medium">
                    Model
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Input cost
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Output cost
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Estimated total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map(({ model, estimate }, index) => {
                  const isCheapest = cheapestIndices.includes(index);

                  return (
                    <tr key={model.slug}>
                      <th scope="row" className="px-3 py-3 align-top font-normal">
                        <Link
                          href={`/models/${model.slug}`}
                          className="text-sm font-medium text-foreground transition-colors hover:text-primary"
                        >
                          {model.name}
                        </Link>
                        <span className="mt-0.5 block text-[11px] text-muted">
                          {isUsablePrice(model.inputPricePerMTokUsd) &&
                          isUsablePrice(model.outputPricePerMTokUsd)
                            ? `${formatPrice(model.inputPricePerMTokUsd)}/1M in · ${formatPrice(
                                model.outputPricePerMTokUsd,
                              )}/1M out`
                            : "List price unavailable"}
                        </span>
                      </th>
                      <td className="px-3 py-3 text-right align-top font-mono text-xs tabular-nums">
                        {estimate ? formatCurrency(estimate.inputCost) : "—"}
                      </td>
                      <td className="px-3 py-3 text-right align-top font-mono text-xs tabular-nums">
                        {estimate ? formatCurrency(estimate.outputCost) : "—"}
                      </td>
                      <td
                        className={`px-3 py-3 text-right align-top ${
                          isCheapest ? "bg-success/[0.07]" : ""
                        }`}
                      >
                        {estimate ? (
                          <span className="inline-flex flex-wrap items-center justify-end gap-1.5">
                            <span className="font-mono text-sm tabular-nums">
                              {formatCurrency(estimate.totalCost)}
                            </span>
                            {isCheapest ? <Badge variant="success">Cheapest</Badge> : null}
                          </span>
                        ) : (
                          <span className="text-xs text-muted">Price unavailable</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-2 space-y-1 text-[11px] leading-5 text-muted">
            <p>
              Amounts are rounded for display (up to six decimal places) and are not a quote,
              invoice, or billing guarantee.
            </p>
            {unavailableCount > 0 ? (
              <p>
                Cost is not estimated for {unavailableCount} model
                {unavailableCount === 1 ? "" : "s"} because the dataset has no usable list price.
              </p>
            ) : null}
            {pricedCount === 1 ? (
              <p>Only one model has a usable list price, so no cheapest value is highlighted.</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
