CREATE TABLE "blog_analytics_daily_rollups" (
	"slug" varchar(255) NOT NULL,
	"viewed_on" date NOT NULL,
	"page_views" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blog_analytics_daily_rollups_slug_viewed_on_pk" PRIMARY KEY("slug","viewed_on"),
	CONSTRAINT "blog_analytics_daily_rollups_page_views_nonnegative" CHECK ("blog_analytics_daily_rollups"."page_views" >= 0)
);
--> statement-breakpoint
UPDATE "blog_post_stats"
SET "historical_view_count" = "historical_view_count" + "view_count",
    "updated_at" = NOW();
--> statement-breakpoint
ALTER TABLE "blog_daily_views" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "blog_daily_views" CASCADE;--> statement-breakpoint
ALTER TABLE "blog_post_stats" DROP CONSTRAINT "blog_post_stats_view_count_nonnegative";--> statement-breakpoint
ALTER TABLE "blog_post_stats" DROP COLUMN "view_count";
