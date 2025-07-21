import { db } from '@/db/connection.ts';
import { recentlyPlayedSongs, NewRecentlyPlayedSong } from '@/db/schema.ts';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const songs = await db.select().from(recentlyPlayedSongs).all();
    return NextResponse.json(songs);
  } catch (error: any) {
    console.error('Error fetching recently played songs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const song: NewRecentlyPlayedSong = await request.json();
    const result = await db.insert(recentlyPlayedSongs).values(song).run();
    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('Error adding recently played song:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}