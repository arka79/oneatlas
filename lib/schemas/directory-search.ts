import { z } from "zod";
import { pageField, pageSizeField } from "@/lib/schemas/api-query";

export const directorySearchSchema = z.object({
  q: z.string().trim().max(80, "Search must be 80 characters or fewer.").optional(),
  page: pageField,
  pageSize: pageSizeField,
});

export type DirectorySearch = z.infer<typeof directorySearchSchema>;

export const DEFAULT_DIRECTORY_SEARCH: DirectorySearch = directorySearchSchema.parse({});
