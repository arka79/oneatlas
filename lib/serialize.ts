import { Prisma } from "@prisma/client";

/**
 * Prisma returns `Decimal` objects for numeric columns, and their default JSON
 * representation is an object with `s`, `e`, and `d` keys rather than a number.
 * Every API response and server component must go through these helpers so the
 * browser only ever receives plain numbers and ISO date strings.
 *
 * Overloads let required columns be consumed as `number` while nullable
 * columns (provider price overrides) keep their `null` case explicit.
 */
export function decimalToNumber(value: Prisma.Decimal): number;
export function decimalToNumber(value: Prisma.Decimal | null | undefined): number | null;
export function decimalToNumber(value: Prisma.Decimal | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value.toString());
  return Number.isFinite(parsed) ? parsed : null;
}

/** `@db.Date` columns are stored at UTC midnight; keep the calendar day. */
export function dateToIsoDay(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function dateToIsoTimestamp(value: Date): string {
  return value.toISOString();
}
