import "server-only";

import { createHmac, randomUUID } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "@/db";
import { blogAnalyticsDailyRollups, blogPostStats } from "@/db/schema";
import { hasBlogStatsConfiguration, isValidBlogSlug } from "./blog-stats-utils";

export { isValidBlogSlug, isVisitorId } from "./blog-stats-utils";

export const BLOG_STATS_VISITOR_COOKIE = "blog_stats_visitor";
export const BLOG_STATS_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

type StatsRow = {
    historical_view_count: number;
    daily_view_count: number;
    like_count: number;
    liked: boolean;
};

export type BlogStats = {
    views: number;
    likes: number;
    liked: boolean;
};

export type PublicBlogStats = Pick<BlogStats, "views" | "likes">;

export function isBlogStatsConfigured() {
    return hasBlogStatsConfiguration(
        isDatabaseConfigured() ? process.env.DATABASE_URL : undefined,
        process.env.BLOG_STATS_HASH_SECRET
    );
}

export function createVisitorId() {
    return randomUUID();
}

export async function getPublicBlogStats(
    slugs: string[]
): Promise<Record<string, PublicBlogStats>> {
    const uniqueSlugs = [...new Set(slugs)].filter(isValidBlogSlug);
    if (uniqueSlugs.length === 0) return {};

    const rows = await getDb()
        .select({
            slug: blogPostStats.slug,
            historicalViews: blogPostStats.historicalViewCount,
            dailyViews: sql<number>`COALESCE(SUM(${blogAnalyticsDailyRollups.pageViews}), 0)`,
            likes: blogPostStats.likeCount,
        })
        .from(blogPostStats)
        .leftJoin(blogAnalyticsDailyRollups, eq(blogPostStats.slug, blogAnalyticsDailyRollups.slug))
        .where(inArray(blogPostStats.slug, uniqueSlugs))
        .groupBy(blogPostStats.slug, blogPostStats.historicalViewCount, blogPostStats.likeCount);

    return Object.fromEntries(
        rows.map((row) => [
            row.slug,
            {
                views: Number(row.historicalViews) + Number(row.dailyViews),
                likes: row.likes,
            },
        ])
    );
}

function getVisitorHash(visitorId: string) {
    const secret = process.env.BLOG_STATS_HASH_SECRET;
    if (!secret) {
        throw new Error("BLOG_STATS_HASH_SECRET is not configured");
    }

    return createHmac("sha256", secret).update(visitorId).digest("hex");
}

function toStats(row: StatsRow): BlogStats {
    return {
        views: Number(row.historical_view_count) + Number(row.daily_view_count),
        likes: Number(row.like_count),
        liked: row.liked,
    };
}

async function getStats(slug: string, visitorHash: string): Promise<BlogStats> {
    const result = await getDb().execute<StatsRow>(sql`
        SELECT
            stats.historical_view_count,
            COALESCE((
                SELECT SUM(page_views)
                FROM blog_analytics_daily_rollups
                WHERE slug = stats.slug
            ), 0) AS daily_view_count,
            stats.like_count,
            EXISTS(
                SELECT 1
                FROM blog_likes
                WHERE slug = ${slug} AND visitor_hash = ${visitorHash}
            ) AS liked
        FROM blog_post_stats AS stats
        WHERE stats.slug = ${slug}
    `);

    const row = result.rows[0] ?? {
        historical_view_count: 0,
        daily_view_count: 0,
        like_count: 0,
        liked: false,
    };
    return toStats(row);
}

export async function getBlogLikeState(slug: string, visitorId: string | undefined) {
    if (!visitorId || !isBlogStatsConfigured()) return false;

    const stats = await getStats(slug, getVisitorHash(visitorId));
    return stats.liked;
}

export async function toggleBlogLike(slug: string, visitorId: string): Promise<BlogStats> {
    const visitorHash = getVisitorHash(visitorId);
    const db = getDb();

    await db.transaction(async (tx) => {
        const removedLike = await tx.execute<{ slug: string }>(sql`
            DELETE FROM blog_likes
            WHERE slug = ${slug} AND visitor_hash = ${visitorHash}
            RETURNING slug
        `);

        let likeDelta = -1;
        if (removedLike.rows.length === 0) {
            const addedLike = await tx.execute<{ slug: string }>(sql`
                INSERT INTO blog_likes (slug, visitor_hash)
                VALUES (${slug}, ${visitorHash})
                ON CONFLICT DO NOTHING
                RETURNING slug
            `);
            likeDelta = addedLike.rows.length > 0 ? 1 : 0;
        }

        if (likeDelta !== 0) {
            await tx.execute(sql`
                INSERT INTO blog_post_stats (slug, like_count)
                VALUES (${slug}, ${Math.max(likeDelta, 0)})
                ON CONFLICT (slug) DO UPDATE
                SET like_count = GREATEST(0, blog_post_stats.like_count + ${likeDelta}),
                    updated_at = NOW()
            `);
        } else {
            await tx.execute(sql`
                INSERT INTO blog_post_stats (slug)
                VALUES (${slug})
                ON CONFLICT (slug) DO NOTHING
            `);
        }
    });

    return getStats(slug, visitorHash);
}
