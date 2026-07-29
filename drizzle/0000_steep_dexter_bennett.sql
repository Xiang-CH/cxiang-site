CREATE TABLE "blog_daily_views" (
	"slug" varchar(255) NOT NULL,
	"visitor_hash" varchar(64) NOT NULL,
	"viewed_on" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blog_daily_views_slug_visitor_hash_viewed_on_pk" PRIMARY KEY("slug","visitor_hash","viewed_on")
);
--> statement-breakpoint
CREATE TABLE "blog_likes" (
	"slug" varchar(255) NOT NULL,
	"visitor_hash" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blog_likes_slug_visitor_hash_pk" PRIMARY KEY("slug","visitor_hash")
);
--> statement-breakpoint
CREATE TABLE "blog_post_stats" (
	"slug" varchar(255) PRIMARY KEY NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blog_post_stats_view_count_nonnegative" CHECK ("blog_post_stats"."view_count" >= 0),
	CONSTRAINT "blog_post_stats_like_count_nonnegative" CHECK ("blog_post_stats"."like_count" >= 0)
);
