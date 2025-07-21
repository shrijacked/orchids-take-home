import { db } from './connection.ts';
import { recentlyPlayedSongs } from './schema.ts';

async function seed() {
  try {
    await db.insert(recentlyPlayedSongs).values([
      { title: 'Song 1', artist: 'Artist 1', playedAt: new Date() },
      { title: 'Song 2', artist: 'Artist 2', playedAt: new Date() },
      { title: 'Song 3', artist: 'Artist 3', playedAt: new Date() },
    ]).run();
    console.log("Seeded recently played songs successfully!");
  } catch (error) {
    console.error("Error seeding recently played songs:", error);
  }
}

seed();