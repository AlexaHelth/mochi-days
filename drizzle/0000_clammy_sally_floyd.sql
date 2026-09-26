CREATE TABLE `entries` (
	`user_id` text NOT NULL,
	`day` text NOT NULL,
	`weight` real,
	`mood` integer,
	`done` text DEFAULT '[]' NOT NULL,
	PRIMARY KEY(`user_id`, `day`)
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`settings` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stars` (
	`user_id` text NOT NULL,
	`day` text NOT NULL,
	`action` text NOT NULL,
	PRIMARY KEY(`user_id`, `day`, `action`)
);
