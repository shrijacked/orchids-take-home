CREATE TABLE `recently_played_songs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`artist` text NOT NULL,
	`played_at` integer NOT NULL
);
