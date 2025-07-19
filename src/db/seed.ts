import { db } from './connection';
import { playlists, favoriteSongs } from './schema';

async function seedDb() {
  try {
    await db.insert(playlists).values([
      { userId: 'user1', name: 'My Playlist 1', createdAt: new Date() },
      { userId: 'user1', name: 'My Playlist 2', createdAt: new Date() },
      { userId: 'user2', name: 'User 2 Playlist', createdAt: new Date() },
    ]);

    await db.insert(favoriteSongs).values([
      { userId: 'user1', songId: 'song1', createdAt: new Date() },
      { userId: 'user1', songId: 'song2', createdAt: new Date() },
      { userId: 'user2', songId: 'song3', createdAt: new Date() },
    ]);

    console.log('Database seeded successfully.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seedDb();