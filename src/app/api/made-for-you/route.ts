import { db } from '@/db/connection.ts';
import { madeForYou } from '@/db/schema.ts';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const madeForYouSongs = await db.select().from(madeForYou).all();
    return NextResponse.json(madeForYouSongs);
  } catch (error) {
    console.error('Error fetching made for you songs:', error);
    return NextResponse.json({ error: 'Failed to fetch made for you songs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, artist, imageUrl } = await request.json();
    const newSong = await db.insert(madeForYou).values({ title, artist, imageUrl }).returning();
    return NextResponse.json(newSong);
  } catch (error) {
    console.error('Error creating made for you song:', error);
    return NextResponse.json({ error: 'Failed to create made for you song' }, { status: 500 });
  }
}