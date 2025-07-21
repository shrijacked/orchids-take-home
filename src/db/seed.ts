import { db } from './connection.ts';
import { recentlyPlayedSongs, madeForYou, popularAlbums } from './schema.ts';

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

  try {
    await db.insert(madeForYou).values([
      { title: 'Made For You 1', description: 'Description 1', imageUrl: 'url1' },
      { title: 'Made For You 2', description: 'Description 2', imageUrl: 'url2' },
      { title: 'Made For You 3', description: 'Description 3', imageUrl: 'url3' },
    ]).run();
    console.log("Seeded made for you successfully!");
  } catch (error) {
    console.error("Error seeding made for you:", error);
  }

  try {
    await db.insert(popularAlbums).values([
      { title: 'Album 1', artist: 'Artist A', imageUrl: 'album_url1' },
      { title: 'Album 2', artist: 'Artist B', imageUrl: 'album_url2' },
      { title: 'Album 3', artist: 'Artist C', imageUrl: 'album_url3' },
    ]).run();
    console.log("Seeded popular albums successfully!");
  } catch (error) {
    console.error("Error seeding popular albums:", error);
  }
}

seed();