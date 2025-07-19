// Drizzle ORM schema definitions will go here

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const recentlyPlayed = sqliteTable('recently_played', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  artist: text('artist').notNull(),
  album: text('album').notNull(),
  albumArt: text('album_art').notNull(),
  duration: integer('duration').notNull(),
  playedAt: integer('played_at', { mode: 'timestamp' }).notNull(),
}); 