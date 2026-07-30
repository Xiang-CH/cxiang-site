import { sql } from "drizzle-orm";
import { check, date, integer, pgTable, primaryKey, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * Creates a slug column definition with a maximum length of 255 characters.
 *
 * @returns A `varchar` column definition named `slug`
 */
function slugColumn() {
    return varchar("slug", { length: 255 });
}

/**
 * Defines a varchar column for storing visitor hashes.
 *
 * @returns A `visitor_hash` varchar column with a maximum length of 64 characters.
 */
function visitorHashColumn() {
    return varchar("visitor_hash", { length: 64 });
}

export const blogPostStats = pgTable(
    "blog_post_stats",
    {
        slug: slugColumn().primaryKey(),
        // Vercel Web Analytics pageviews imported before daily rollups began.
        historicalViewCount: integer("historical_view_count").notNull().default(0),
        likeCount: integer("like_count").notNull().default(0),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        check(
            "blog_post_stats_historical_view_count_nonnegative",
            sql`${table.historicalViewCount} >= 0`
        ),
        check("blog_post_stats_like_count_nonnegative", sql`${table.likeCount} >= 0`),
    ]
);

export const blogAnalyticsDailyRollups = pgTable(
    "blog_analytics_daily_rollups",
    {
        slug: slugColumn().notNull(),
        viewedOn: date("viewed_on", { mode: "string" }).notNull(),
        pageViews: integer("page_views").notNull().default(0),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        primaryKey({
            name: "blog_analytics_daily_rollups_slug_viewed_on_pk",
            columns: [table.slug, table.viewedOn],
        }),
        check("blog_analytics_daily_rollups_page_views_nonnegative", sql`${table.pageViews} >= 0`),
    ]
);

export const blogLikes = pgTable(
    "blog_likes",
    {
        slug: slugColumn().notNull(),
        visitorHash: visitorHashColumn().notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        primaryKey({
            name: "blog_likes_slug_visitor_hash_pk",
            columns: [table.slug, table.visitorHash],
        }),
    ]
);
