import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const madeForYou = sqliteTable('made_for_you', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  artist: text('artist'),
  imageUrl: text('image_url'),
});

export const popularAlbums = sqliteTable('popular_albums', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  artist: text('artist'),
  releaseYear: integer('release_year'),
  genre: text('genre'),
});