"use strict";
// Drizzle ORM schema definitions will go here
Object.defineProperty(exports, "__esModule", { value: true });
exports.recentlyPlayed = void 0;
var sqlite_core_1 = require("drizzle-orm/sqlite-core");
exports.recentlyPlayed = (0, sqlite_core_1.sqliteTable)('recently_played', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    title: (0, sqlite_core_1.text)('title').notNull(),
    artist: (0, sqlite_core_1.text)('artist').notNull(),
    album: (0, sqlite_core_1.text)('album').notNull(),
    albumArt: (0, sqlite_core_1.text)('album_art').notNull(),
    duration: (0, sqlite_core_1.integer)('duration').notNull(),
    playedAt: (0, sqlite_core_1.integer)('played_at', { mode: 'timestamp' }).notNull(),
});
