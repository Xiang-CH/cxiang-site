import { describe, expect, it } from "vitest";
import {
    formatBlogLikeCount,
    formatBlogViewCount,
    getBlogViewCountLabel,
} from "./blog-stats-format";
import {
    BLOG_STATS_MUTATION_CACHE_CONTROL,
    PUBLIC_BLOG_STATS_CACHE_HEADERS,
} from "./blog-stats-cache";

describe("blog stats presentation and caching", () => {
    it("marks view totals as approximate while leaving like totals exact", () => {
        expect(formatBlogViewCount(1234)).toBe("1,234+");
        expect(formatBlogLikeCount(1234)).toBe("1,234");
        expect(getBlogViewCountLabel(1234)).toBe("At least 1,234 views");
    });

    it("uses a long CDN cache lifetime only for public counts", () => {
        expect(PUBLIC_BLOG_STATS_CACHE_HEADERS).toEqual({
            "Cache-Control": "public, max-age=300",
            "CDN-Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        });
        expect(BLOG_STATS_MUTATION_CACHE_CONTROL).toBe("no-store");
    });
});
