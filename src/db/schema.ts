import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const recentlyPlayedSongs = sqliteTable('recently_played_songs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  artist: text('artist').notNull(),
  playedAt: integer('played_at', { mode: 'timestamp' }).notNull(),
});

export type RecentlyPlayedSong = typeof recentlyPlayedSongs.$inferSelect;
export type NewRecentlyPlayedSong = typeof recentlyPlayedSongs.$inferInsert;