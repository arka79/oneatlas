/**
 * Converts Next.js `searchParams` records into a URLSearchParams instance so
 * pages and API handlers parse the same request contract.
 */
export type SearchParamsInput = Record<string, string | string[] | undefined>;

export function toURLSearchParams(input: SearchParamsInput): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value)) {
      for (const entry of value) params.append(key, entry);
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }

  return params;
}
