import { describe, expect, it } from "vitest";
import {
    getUtcDate,
    hasBlogStatsConfiguration,
    isValidBlogSlug,
    isVisitorId,
} from "./blog-stats-utils";

describe("blog stats helpers", () => {
    it("accepts a globally unique slug from any blog source", () => {
        expect(isValidBlogSlug("building-a-blog")).toBe(true);
        expect(isValidBlogSlug("post-2026")).toBe(true);
        expect(isValidBlogSlug("a_future_blog_source")).toBe(true);
        expect(isValidBlogSlug("技术随笔")).toBe(true);
        expect(isValidBlogSlug("blog/post")).toBe(false);
        expect(isValidBlogSlug(" ")).toBe(false);
    });

    it("uses the UTC calendar day for view deduplication", () => {
        expect(getUtcDate(new Date("2026-07-28T23:59:59-07:00"))).toBe("2026-07-29");
    });

    it("accepts only generated UUID-shaped visitor ids", () => {
        expect(isVisitorId("2d5a9df2-2e85-4a1e-93ae-4e5873199c60")).toBe(true);
        expect(isVisitorId("visitor-123")).toBe(false);
        expect(isVisitorId(undefined)).toBe(false);
    });

    it("disables statistics until both server secrets are configured", () => {
        expect(hasBlogStatsConfiguration(undefined, "secret")).toBe(false);
        expect(hasBlogStatsConfiguration("postgres://example", undefined)).toBe(false);
        expect(hasBlogStatsConfiguration("postgres://example", "secret")).toBe(true);
    });
});
