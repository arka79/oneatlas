/**
 * Token-cost maths for the catalogue's documented price unit: USD per
 * 1,000,000 tokens (`inputPricePerMTokUsd` / `outputPricePerMTokUsd`).
 *
 * This module intentionally models only list-price token consumption. It does
 * not apply provider overrides, caching or batch discounts, minimum charges,
 * taxes, or any other factor that is not represented in the dataset.
 */

export const TOKENS_PER_PRICE_UNIT = 1_000_000;

/** Guardrail for the estimator form; keeps arithmetic in a sane range. */
export const MAX_ESTIMATE_TOKENS = 1_000_000_000_000;

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
};

export type TokenCostEstimate = {
  inputCost: number;
  outputCost: number;
  totalCost: number;
};

/** A usable price is a finite, non-negative USD amount per 1M tokens. */
export function isUsablePrice(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export type TokenInputResult =
  | { success: true; value: number }
  | { success: false; message: string };

/**
 * Accepts whole, non-negative token counts with optional thousands separators.
 * Decimals, signs, exponents, and blank values are rejected rather than
 * silently coerced, so an estimate never looks more precise than the input.
 */
export function parseTokenCount(raw: string, label: string): TokenInputResult {
  const normalized = raw.trim().replace(/,/g, "");

  if (normalized === "") {
    return { success: false, message: `Enter an estimated ${label} token count.` };
  }

  if (!/^\d+$/.test(normalized)) {
    return {
      success: false,
      message: "Use a whole number of tokens with digits only (no decimals or signs).",
    };
  }

  const value = Number(normalized);

  if (!Number.isSafeInteger(value) || value > MAX_ESTIMATE_TOKENS) {
    return {
      success: false,
      message: "Enter 1,000,000,000,000 tokens or fewer.",
    };
  }

  return { success: true, value };
}

/**
 * Estimates a workload's list-price cost. Returns `null` when either price is
 * missing or invalid (for example a provider override without a rate), so
 * callers can show "price unavailable" instead of a misleading $0.
 */
export function estimateTokenCost(
  usage: TokenUsage,
  inputPricePerMTokUsd: number | null | undefined,
  outputPricePerMTokUsd: number | null | undefined,
): TokenCostEstimate | null {
  if (!isUsablePrice(inputPricePerMTokUsd) || !isUsablePrice(outputPricePerMTokUsd)) {
    return null;
  }

  if (
    !Number.isFinite(usage.inputTokens) ||
    !Number.isFinite(usage.outputTokens) ||
    usage.inputTokens < 0 ||
    usage.outputTokens < 0
  ) {
    return null;
  }

  const inputCost = (usage.inputTokens / TOKENS_PER_PRICE_UNIT) * inputPricePerMTokUsd;
  const outputCost = (usage.outputTokens / TOKENS_PER_PRICE_UNIT) * outputPricePerMTokUsd;
  const totalCost = inputCost + outputCost;

  if (![inputCost, outputCost, totalCost].every(Number.isFinite)) {
    return null;
  }

  return { inputCost, outputCost, totalCost };
}
