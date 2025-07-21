import { db } from './connection.ts';
import { madeForYou, popularAlbums } from './schema.ts';

async function seed() {
  try {
    await db.insert(madeForYou).values([
      { title: 'Song 1', artist: 'Artist A', imageUrl: 'https://example.com/image1.jpg' },
      { title: 'Song 2', artist: 'Artist B', imageUrl: 'https://example.com/image2.jpg' },
    ]);

    await db.insert(popularAlbums).values([
      { title: 'Album X', artist: 'Artist C', releaseYear: 2020, genre: 'Pop' },
      { title: 'Album Y', artist: 'Artist D', releaseYear: 2022, genre: 'Rock' },
    ]);

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seed();