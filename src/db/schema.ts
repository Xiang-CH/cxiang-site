import { sql } from "drizzle-orm";
import {
    boolean,
    check,
    date,
    index,
    integer,
    pgTable,
    primaryKey,
    text,
    timestamp,
    uniqueIndex,
    varchar,
} from "drizzle-orm/pg-core";

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

/**
 * A curated set of photographs.
 *
 * `coverPhotoId` references `photos.id` and is intentionally not a database
 * foreign key: the cover is a derived pointer, and deleting the photo it points
 * at should leave the collection usable (the reader falls back to the first
 * photo) rather than block the delete.
 *
 * A collection can be shot over a span of time: `shotOn` is the start (or the
 * only shoot date) and `shotOnEnd` is the optional end of the range.
 */
export const photosets = pgTable(
    "photosets",
    {
        id: varchar("id", { length: 36 }).primaryKey(),
        slug: slugColumn().notNull(),
        title: varchar("title", { length: 255 }).notNull(),
        abstract: text("abstract"),
        shotOn: date("shot_on", { mode: "string" }),
        shotOnEnd: date("shot_on_end", { mode: "string" }),
        published: boolean("published").notNull().default(false),
        coverPhotoId: varchar("cover_photo_id", { length: 36 }),
        sortOrder: integer("sort_order").notNull().default(0),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [uniqueIndex("photosets_slug_unique").on(table.slug)]
);

/**
 * One cell inside a photoset: either a photograph or an explicit blank spacer.
 *
 * Placement is free-form on a fixed grid: `x`/`y` are the cell origin and
 * `w`/`h` the size in cells (see `lib/gallery-grid.ts`). Gaps that no cell
 * occupies are simply left blank, so whitespace needs no row of its own.
 *
 * `kind` distinguishes a spacer from a photo; a spacer carries no image and is
 * only ever rendered as empty space, which is why `url` stays empty for it.
 *
 * `size` is the legacy preset (`small | medium | large | wide | tall`). It is
 * kept so rows written before free-form placement still render: when `x`/`y`
 * are null the preset is converted into a rect on read.
 */
export const photos = pgTable(
    "photos",
    {
        id: varchar("id", { length: 36 }).primaryKey(),
        photosetId: varchar("photoset_id", { length: 36 })
            .notNull()
            .references(() => photosets.id, { onDelete: "cascade" }),
        /** Public CDN URL. Empty for spacers. */
        url: text("url").notNull(),
        /** Object key inside the bucket, used for deletes. */
        storageKey: text("storage_key"),
        alt: varchar("alt", { length: 500 }).notNull().default(""),
        caption: varchar("caption", { length: 500 }),
        width: integer("width").notNull(),
        height: integer("height").notNull(),
        /** `photo` or `spacer`. */
        kind: varchar("kind", { length: 16 }).notNull().default("photo"),
        /** Grid cell origin and size. Null on rows written before free-form placement. */
        x: integer("x"),
        y: integer("y"),
        w: integer("w"),
        h: integer("h"),
        size: varchar("size", { length: 16 }).notNull().default("medium"),
        sortOrder: integer("sort_order").notNull().default(0),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index("photos_photoset_id_sort_order_idx").on(table.photosetId, table.sortOrder),
        check("photos_width_positive", sql`${table.width} > 0`),
        check("photos_height_positive", sql`${table.height} > 0`),
    ]
);
