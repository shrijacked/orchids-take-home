import Database from 'better-sqlite3';

const db = new Database('sqlite.db');

db.prepare(`CREATE TABLE IF NOT EXISTS recently_played (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT NOT NULL,
  album_art TEXT NOT NULL,
  duration INTEGER NOT NULL,
  played_at INTEGER NOT NULL
)`).run();

console.log('Synced schema: recently_played table ensured.'); 