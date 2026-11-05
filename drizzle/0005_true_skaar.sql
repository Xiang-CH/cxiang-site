ALTER TABLE "photos" ADD COLUMN "kind" varchar(16) DEFAULT 'photo' NOT NULL;--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN "x" integer;--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN "y" integer;--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN "w" integer;--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN "h" integer;