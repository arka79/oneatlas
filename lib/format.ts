/**
 * Presentation-only formatting. Kept out of query modules so API responses stay
 * raw numbers and every page formats the same way.
 */

const compactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const countFormatter = new Intl.NumberFormat("en-US");

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});

/** 400000 -> "400K", 1048576 -> "1M" */
export function formatTokenCount(tokens: number): string {
  return compactNumber.format(tokens);
}

/** 1250000 -> "1,250,000"; used where exact token counts matter. */
export function formatCount(value: number): string {
  return countFormatter.format(value);
}

/** Estimated USD amounts: 0.00125 -> "$0.00125", 1250 -> "$1,250.00" */
export function formatCurrency(usd: number): string {
  return currencyFormatter.format(usd);
}

/** USD per 1M tokens: 1.25 -> "$1.25", 10 -> "$10", 0.11 -> "$0.11" */
export function formatPrice(usdPerMillionTokens: number): string {
  const fractionDigits = usdPerMillionTokens < 1 || usdPerMillionTokens % 1 !== 0 ? 2 : 0;
  return `$${usdPerMillionTokens.toFixed(fractionDigits)}`;
}

/** Accepts an ISO day or timestamp and renders it in UTC to avoid off-by-one days. */
export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate));
}

/** 89.4 with unit "%" -> "89.4%" */
export function formatScore(score: number, unit: string): string {
  const rounded = Number.isInteger(score) ? score.toString() : score.toFixed(1);
  return unit === "%" ? `${rounded}%` : `${rounded} ${unit}`;
}
