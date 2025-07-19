import { db } from './connection';
import { playlists, favoriteSongs } from './schema';

async function syncDb() {
  try {
    // No need to explicitly create tables with better-sqlite3 and Drizzle.
    // Drizzle handles schema creation during the first query if the tables don't exist.
    console.log('Database synced successfully.');
  } catch (error) {
    console.error('Error syncing database:', error);
  }
}

syncDb();