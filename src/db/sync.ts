import { db } from './connection.ts';
import { recentlyPlayedSongs, madeForYou, popularAlbums } from './schema.ts';

async function sync() {
  try {
    await db.select().from(recentlyPlayedSongs).all();
    await db.select().from(madeForYou).all();
    await db.select().from(popularAlbums).all();
    console.log("Database synced successfully!");
  } catch (error) {
    console.error("Error syncing database:", error);
  }
}

sync();