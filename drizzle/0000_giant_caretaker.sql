CREATE TABLE `made_for_you` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`artist` text,
	`image_url` text
);
--> statement-breakpoint
CREATE TABLE `popular_albums` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`artist` text,
	`release_year` integer,
	`genre` text
);
