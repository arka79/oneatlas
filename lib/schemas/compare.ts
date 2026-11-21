import { z } from "zod";
import { SLUG_PATTERN, slugSchema } from "@/lib/schemas/api-query";

export const COMPARE_MIN_MODELS = 2;
export const COMPARE_MAX_MODELS = 4;

export const compareRequestSchema = z.object({
  slugs: z
    .array(slugSchema)
    .min(COMPARE_MIN_MODELS, `Provide at least ${COMPARE_MIN_MODELS} model slugs.`)
    .max(COMPARE_MAX_MODELS, `Provide at most ${COMPARE_MAX_MODELS} model slugs.`)
    .refine((slugs) => new Set(slugs).size === slugs.length, {
      message: "Model slugs must be unique.",
    }),
});

export type CompareRequest = z.infer<typeof compareRequestSchema>;

/**
 * Parses the `/compare?ids=slug-a,slug-b` selection. Invalid entries are
 * ignored, duplicates collapse, and the first four valid slugs win. Zero or one
 * slug is a valid page state because the picker can add more models there.
 */
export function parseCompareIds(value: string | string[] | null | undefined): string[] {
  if (!value) return [];

  const raw = Array.isArray(value) ? value.join(",") : value;

  return [
    ...new Set(
      raw
        .split(",")
        .map((slug) => slug.trim())
        .filter((slug) => SLUG_PATTERN.test(slug)),
    ),
  ].slice(0, COMPARE_MAX_MODELS);
}
