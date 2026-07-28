import { sql } from "drizzle-orm";
import { check, date, integer, pgTable, primaryKey, timestamp, varchar } from "drizzle-orm/pg-core";

function slugColumn() {
    return varchar("slug", { length: 255 });
}

function visitorHashColumn() {
    return varchar("visitor_hash", { length: 64 });
}

export const blogPostStats = pgTable(
    "blog_post_stats",
    {
        slug: slugColumn().primaryKey(),
        // Vercel Web Analytics pageviews imported before the in-app counter launched.
        // Keep this independent from viewCount so an import cannot overwrite live views.
        historicalViewCount: integer("historical_view_count").notNull().default(0),
        viewCount: integer("view_count").notNull().default(0),
        likeCount: integer("like_count").notNull().default(0),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        check(
            "blog_post_stats_historical_view_count_nonnegative",
            sql`${table.historicalViewCount} >= 0`
        ),
        check("blog_post_stats_view_count_nonnegative", sql`${table.viewCount} >= 0`),
        check("blog_post_stats_like_count_nonnegative", sql`${table.likeCount} >= 0`),
    ]
);

export const blogDailyViews = pgTable(
    "blog_daily_views",
    {
        slug: slugColumn().notNull(),
        visitorHash: visitorHashColumn().notNull(),
        viewedOn: date("viewed_on", { mode: "string" }).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        primaryKey({
            name: "blog_daily_views_slug_visitor_hash_viewed_on_pk",
            columns: [table.slug, table.visitorHash, table.viewedOn],
        }),
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
