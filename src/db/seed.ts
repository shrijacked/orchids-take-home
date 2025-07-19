import { db } from './connection.ts';
import { recentlyPlayed, madeForYou, popularAlbums } from './schema.ts';

async function seed() {
  await db.delete(recentlyPlayed); // Clear existing data
  await db.delete(madeForYou);
  await db.delete(popularAlbums);

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

  await db.insert(madeForYou).values([
    {
      title: 'Discover Weekly',
      artist: 'Your weekly mixtape of fresh music',
      album: 'Weekly Discovery',
      albumArt: 'https://v3.fal.media/files/kangaroo/HRayeBi01JIqfkCjjoenp_output.png',
      duration: 210,
    },
    {
      title: 'Release Radar',
      artist: 'Catch all the latest music from artists you follow',
      album: 'New Music Friday',
      albumArt: 'https://v3.fal.media/files/panda/q7hWJCgH2Fy4cJdWqAzuk_output.png',
      duration: 195,
    },
    {
      title: 'Daily Mix 1',
      artist: 'Billie Eilish, Lorde, Clairo and more',
      album: 'Alternative Mix',
      albumArt: 'https://v3.fal.media/files/elephant/N5qDbXOpqAlIcK7kJ4BBp_output.png',
      duration: 225,
    },
    {
      title: 'Daily Mix 2',
      artist: 'Arctic Monkeys, The Strokes, Tame Impala and more',
      album: 'Indie Rock Mix',
      albumArt: 'https://v3.fal.media/files/rabbit/tAQ6AzJJdlEZW-y4eNdxO_output.png',
      duration: 240,
    },
    {
      title: 'Daily Mix 3',
      artist: 'Taylor Swift, Olivia Rodrigo, Gracie Abrams and more',
      album: 'Pop Mix',
      albumArt: 'https://v3.fal.media/files/rabbit/b11V_uidRMsa2mTr5mCfz_output.png',
      duration: 190,
    },
    {
      title: 'On Repeat',
      artist: 'The songs you can\'t get enough of',
      album: 'Your Favorites',
      albumArt: 'https://v3.fal.media/files/rabbit/mVegWQYIe0yj8NixTQQG-_output.png',
      duration: 220,
    },
  ]);

  await db.insert(popularAlbums).values([
    {
      title: "Midnights",
      artist: "Taylor Swift",
      album: "Midnights",
      albumArt: "https://v3.fal.media/files/elephant/C_rLsEbIUdbn6nQ0wz14S_output.png",
      duration: 275,
    },
    {
      title: "Harry's House",
      artist: "Harry Styles",
      album: "Harry's House",
      albumArt: "https://v3.fal.media/files/panda/kvQ0deOgoUWHP04ajVH3A_output.png",
      duration: 245,
    },
    {
      title: "SOUR",
      artist: "Olivia Rodrigo",
      album: "SOUR",
      albumArt: "https://v3.fal.media/files/elephant/0Qw6QwQwQwQwQwQwQwQwQw_output.png",
      duration: 210,
    },
    {
      title: "Future Nostalgia",
      artist: "Dua Lipa",
      album: "Future Nostalgia",
      albumArt: "https://v3.fal.media/files/kangaroo/HRayeBi01JIqfkCjjoenp_output.png",
      duration: 203,
    },
    {
      title: "Fine Line",
      artist: "Harry Styles",
      album: "Fine Line",
      albumArt: "https://v3.fal.media/files/panda/q7hWJCgH2Fy4cJdWqAzuk_output.png",
      duration: 174,
    },
    {
      title: "After Hours",
      artist: "The Weeknd",
      album: "After Hours",
      albumArt: "https://link-to-album-art.com/blinding-lights.jpg",
      duration: 200,
    },
  ]);

  console.log('Seeded all tables.');
}

seed(); 