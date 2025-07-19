import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const playlists = sqliteTable('playlists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const favoriteSongs = sqliteTable('favorite_songs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull(),
  songId: text('song_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});