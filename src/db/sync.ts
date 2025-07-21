import { db } from './connection.ts';
import { recentlyPlayedSongs } from './schema.ts';

async function sync() {
  try {
    await db.select().from(recentlyPlayedSongs).all();
    console.log("Database synced successfully!");
  } catch (error) {
    console.error("Error syncing database:", error);
  }
}

sync();