import "server-only";

import { inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { blogAnalyticsDailyRollups, blogPostStats } from "@/db/schema";
import {
    extractDailyBlogPageviewRollups,
    getPreviousCompleteUtcDates,
    getUtcDayRange,
    type DailyBlogPageviewRollup,
} from "./vercel-blog-analytics-utils";

const VERCEL_ANALYTICS_API_URL = "https://api.vercel.com/v1/query/web-analytics/visits/aggregate";
const MAX_PATH_GROUPS = 100;

/**
 * Loads the Vercel Analytics configuration from environment variables.
 *
 * @returns The Vercel token, project ID, and optional team ID.
 * @throws If `VERCEL_TOKEN` or `VERCEL_PROJECT_ID` is missing.
 */
function getVercelAnalyticsConfiguration() {
    const token = process.env.VERCEL_TOKEN;
    const projectId = process.env.VERCEL_PROJECT_ID;
    if (!token || !projectId) {
        throw new Error(
            "VERCEL_TOKEN and VERCEL_PROJECT_ID must be configured for analytics sync."
        );
    }

    return { token, projectId, teamId: process.env.VERCEL_TEAM_ID };
}

/**
 * Retrieves daily pageview rollups for blog paths on the specified date.
 *
 * @param viewedOn - The UTC calendar date to retrieve
 * @returns The pageview rollups for blog paths on `viewedOn`
 * @throws If the Vercel Analytics request fails
 */
async function fetchDailyBlogPageviewRollups(viewedOn: string) {
    const { token, projectId, teamId } = getVercelAnalyticsConfiguration();
    const { since, until } = getUtcDayRange(viewedOn);
    const params = new URLSearchParams({
        projectId,
        by: "requestPath",
        since,
        until,
        limit: String(MAX_PATH_GROUPS),
        filter: "startswith(requestPath, '/blog/')",
    });
    if (teamId) params.set("teamId", teamId);

    const response = await fetch(`${VERCEL_ANALYTICS_API_URL}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(
            `Vercel Analytics request failed (${response.status}): ${(await response.text()).slice(0, 500)}`
        );
    }

    return extractDailyBlogPageviewRollups(await response.json(), viewedOn);
}

/**
 * Replaces daily blog pageview rollups for the specified dates.
 *
 * @param viewedOnDates - Dates whose existing rollups should be replaced
 * @param rollups - Pageview rollups to store for those dates
 */
async function replaceDailyBlogPageviewRollups(
    viewedOnDates: string[],
    rollups: DailyBlogPageviewRollup[]
) {
    const db = getDb();

    await db.transaction(async (tx) => {
        await tx
            .delete(blogAnalyticsDailyRollups)
            .where(inArray(blogAnalyticsDailyRollups.viewedOn, viewedOnDates));

        if (rollups.length === 0) return;

        const slugs = [...new Set(rollups.map((rollup) => rollup.slug))];
        await tx
            .insert(blogPostStats)
            .values(slugs.map((slug) => ({ slug })))
            .onConflictDoNothing();

        await tx
            .insert(blogAnalyticsDailyRollups)
            .values(rollups)
            .onConflictDoUpdate({
                target: [blogAnalyticsDailyRollups.slug, blogAnalyticsDailyRollups.viewedOn],
                set: {
                    pageViews: sql`excluded.page_views`,
                    updatedAt: sql`NOW()`,
                },
            });
    });
}

/**
 * Synchronizes recent complete UTC days of Vercel blog pageview data with the database.
 *
 * @param now - Reference time used to determine the recent complete UTC dates.
 * @returns The synchronized dates and the number of distinct blog posts with pageview data.
 */
export async function syncRecentVercelBlogPageviews(now = new Date()) {
    const viewedOnDates = getPreviousCompleteUtcDates(now);
    const rollups = (await Promise.all(viewedOnDates.map(fetchDailyBlogPageviewRollups))).flat();

    await replaceDailyBlogPageviewRollups(viewedOnDates, rollups);

    return { dates: viewedOnDates, posts: new Set(rollups.map((rollup) => rollup.slug)).size };
}
