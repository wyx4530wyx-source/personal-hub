CREATE TABLE `site_presence` (
	`visitor_id` text PRIMARY KEY NOT NULL,
	`last_seen` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_site_presence_last_seen` ON `site_presence` (`last_seen`);--> statement-breakpoint
CREATE TABLE `site_stats` (
	`id` integer PRIMARY KEY NOT NULL,
	`likes` integer DEFAULT 0 NOT NULL,
	`visits` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
INSERT OR IGNORE INTO `site_stats` (`id`, `likes`, `visits`) VALUES (1, 0, 0);
