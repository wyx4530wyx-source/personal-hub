CREATE TABLE `content_items` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`cover_key` text,
	`file_key` text,
	`file_name` text,
	`mime_type` text,
	`file_size` integer DEFAULT 0 NOT NULL,
	`gallery_keys` text DEFAULT '[]' NOT NULL,
	`published_at` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_content_items_slug` ON `content_items` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_content_items_type_created` ON `content_items` (`type`,`created_at`);