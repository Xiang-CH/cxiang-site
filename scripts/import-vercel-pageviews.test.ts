import { describe, expect, it } from "vitest";
import {
    extractViewTotals,
    getVercelCliError,
    parseOptions,
    slugFromBlogPath,
} from "./import-vercel-pageviews";

describe("Vercel pageview importer", () => {
    it("uses only canonical blog paths", () => {
        expect(slugFromBlogPath("/blog/a-post")).toBe("a-post");
        expect(slugFromBlogPath("/blog/%E6%8A%80%E6%9C%AF")).toBe("技术");
        expect(slugFromBlogPath("/blog/a-post.md")).toBeNull();
        expect(slugFromBlogPath("/blog")).toBeNull();
        expect(slugFromBlogPath("/blog/a-post/extra")).toBeNull();
    });

    it("aggregates daily Vercel metrics rows by slug", () => {
        expect(
            extractViewTotals({
                data: [
                    { request_path: "/blog/a-post", vercel_analytics_pageview_count_sum: 3 },
                    { request_path: "/blog/a-post", vercel_analytics_pageview_count_sum: 5 },
                    { request_path: "/blog/a-post.md", vercel_analytics_pageview_count_sum: 8 },
                    { request_path: "/project/a-project", vercel_analytics_pageview_count_sum: 13 },
                ],
            })
        ).toEqual([{ slug: "a-post", views: 8 }]);
    });

    it("defaults to a dry run", () => {
        expect(parseOptions(["--project", "site", "--since", "2025-01-01"])).toMatchObject({
            apply: false,
            limit: 500,
            project: "site",
            since: "2025-01-01",
        });
    });

    it("keeps Vercel's JSON diagnostic when the metrics command fails", () => {
        const diagnostic = '{"error":{"code":"bad_request","message":"limit is too high"}}';
        expect(getVercelCliError(diagnostic, "", 1)).toBe(diagnostic);
        expect(getVercelCliError("", "Vercel is unavailable", 1)).toBe("Vercel is unavailable");
    });
});
