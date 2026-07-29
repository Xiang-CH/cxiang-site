import { describe, expect, it } from "vitest";
import {
    extractDailyBlogPageviewRollups,
    getPreviousCompleteUtcDates,
    getUtcDayRange,
} from "./vercel-blog-analytics-utils";

describe("Vercel blog analytics rollups", () => {
    it("uses the two preceding complete UTC days", () => {
        expect(getPreviousCompleteUtcDates(new Date("2026-07-29T01:30:00-07:00"))).toEqual([
            "2026-07-27",
            "2026-07-28",
        ]);
        expect(getUtcDayRange("2026-07-28")).toEqual({
            since: "2026-07-28T00:00:00.000Z",
            until: "2026-07-28T23:59:59.999Z",
        });
    });

    it("keeps only canonical blog pageviews and combines duplicate rows", () => {
        expect(
            extractDailyBlogPageviewRollups(
                {
                    data: [
                        { requestPath: "/blog/a-post", pageviews: 3 },
                        { requestPath: "/blog/a-post", pageviews: 5 },
                        { requestPath: "/blog/a-post.md", pageviews: 8 },
                        { requestPath: "/project/a-project", pageviews: 13 },
                    ],
                },
                "2026-07-28"
            )
        ).toEqual([{ slug: "a-post", viewedOn: "2026-07-28", pageViews: 8 }]);
    });

    it("fails rather than silently omit Vercel's grouped Others result", () => {
        expect(() =>
            extractDailyBlogPageviewRollups(
                { data: [{ requestPath: "Others", pageviews: 1 }] },
                "2026-07-28"
            )
        ).toThrow("cannot safely sync");
    });
});
