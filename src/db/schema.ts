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

export const madeForYou = sqliteTable('made_for_you', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  artist: text('artist').notNull(),
  album: text('album').notNull(),
  albumArt: text('album_art').notNull(),
  duration: integer('duration').notNull(),
});

export const popularAlbums = sqliteTable('popular_albums', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  artist: text('artist').notNull(),
  album: text('album').notNull(),
  albumArt: text('album_art').notNull(),
  duration: integer('duration').notNull(),
});

export const userPlaylists = sqliteTable('user_playlists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  coverArt: text('cover_art'),
});