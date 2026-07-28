export const BLOG_STATS_MUTATION_CACHE_CONTROL = "no-store";

export const PUBLIC_BLOG_STATS_CACHE_HEADERS = {
    // Browsers can reuse the result briefly, while Vercel retains a much longer stale snapshot.
    "Cache-Control": "public, max-age=300",
    "CDN-Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
};
