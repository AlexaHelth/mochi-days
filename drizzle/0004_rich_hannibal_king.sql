CREATE TABLE `companions` (
	`user_id` text PRIMARY KEY NOT NULL,
	`state` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE `entries` ADD `partial` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `entries` ADD `feelings` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `entries` ADD `tags` text DEFAULT '[]' NOT NULL;