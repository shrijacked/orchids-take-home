import { db } from './connection.ts';
import { recentlyPlayed } from './schema.ts';

async function seed() {
  await db.delete(recentlyPlayed); // Clear existing data
  await db.insert(recentlyPlayed).values([
    {
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      album: 'After Hours',
      albumArt: 'https://link-to-album-art.com/blinding-lights.jpg',
      duration: 200,
      playedAt: new Date(Date.now() - 3600 * 1000),
    },
    {
      title: 'Levitating',
      artist: 'Dua Lipa',
      album: 'Future Nostalgia',
      albumArt: 'https://link-to-album-art.com/levitating.jpg',
      duration: 203,
      playedAt: new Date(Date.now() - 1800 * 1000),
    },
    {
      title: 'Watermelon Sugar',
      artist: 'Harry Styles',
      album: 'Fine Line',
      albumArt: 'https://link-to-album-art.com/watermelon-sugar.jpg',
      duration: 174,
      playedAt: new Date(Date.now() - 600 * 1000),
    },
  ]);
  console.log('Seeded recently_played table.');
}

seed(); 