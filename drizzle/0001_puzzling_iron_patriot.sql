CREATE TABLE `popular_albums` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`artist` text NOT NULL,
	`play_count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `recently_played_songs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`artist` text NOT NULL,
	`played_at` integer NOT NULL
);
