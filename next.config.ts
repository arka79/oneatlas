import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Database-backed pages are rendered dynamically on purpose, so the new
  // `cacheComponents` / `partialPrefetching` defaults are left off for now.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
