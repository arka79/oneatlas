import { z } from "zod";
import { pageField, pageSizeField, slugSchema } from "@/lib/schemas/api-query";

export const LEADERBOARD_SORTS = [
  "score-desc",
  "score-asc",
  "benchmark-asc",
  "model-asc",
  "release-date-desc",
] as const;

export type LeaderboardSort = (typeof LEADERBOARD_SORTS)[number];

export const leaderboardSearchSchema = z.object({
  /** Exact benchmark slug, e.g. `mmlu` or `swe-bench-verified`. */
  benchmark: slugSchema.optional(),
  /** Case-insensitive benchmark category, e.g. `Coding`. */
  category: z.string().trim().max(100).optional(),
  sort: z.enum(LEADERBOARD_SORTS).default("score-desc"),
  page: pageField,
  pageSize: pageSizeField,
});

export type LeaderboardSearch = z.infer<typeof leaderboardSearchSchema>;

export const DEFAULT_LEADERBOARD_SEARCH: LeaderboardSearch = leaderboardSearchSchema.parse({});
