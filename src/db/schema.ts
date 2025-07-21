import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const recentlyPlayedSongs = sqliteTable('recently_played_songs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  artist: text('artist').notNull(),
  playedAt: integer('played_at', { mode: 'timestamp' }).notNull(),
});

export type RecentlyPlayedSong = typeof recentlyPlayedSongs.$inferSelect;
export type NewRecentlyPlayedSong = typeof recentlyPlayedSongs.$inferInsert;
export const madeForYou = sqliteTable('made_for_you', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
});

export const popularAlbums = sqliteTable('popular_albums', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  artist: text('artist').notNull(),
  imageUrl: text('image_url'),
});

export type MadeForYou = typeof madeForYou.$inferSelect;

export type NewMadeForYou = typeof madeForYou.$inferInsert;

export type PopularAlbum = typeof popularAlbums.$inferSelect;

export type NewPopularAlbum = typeof popularAlbums.$inferInsert;
