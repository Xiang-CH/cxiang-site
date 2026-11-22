CREATE TABLE "photos" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"photoset_id" varchar(36) NOT NULL,
	"url" text NOT NULL,
	"storage_key" text,
	"alt" varchar(500) DEFAULT '' NOT NULL,
	"caption" varchar(500),
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"size" varchar(16) DEFAULT 'medium' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "photos_width_positive" CHECK ("photos"."width" > 0),
	CONSTRAINT "photos_height_positive" CHECK ("photos"."height" > 0)
);
--> statement-breakpoint
CREATE TABLE "photosets" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"abstract" text,
	"shot_on" date,
	"published" boolean DEFAULT false NOT NULL,
	"cover_photo_id" varchar(36),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_photoset_id_photosets_id_fk" FOREIGN KEY ("photoset_id") REFERENCES "public"."photosets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "photos_photoset_id_sort_order_idx" ON "photos" USING btree ("photoset_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "photosets_slug_unique" ON "photosets" USING btree ("slug");