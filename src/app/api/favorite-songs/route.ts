import { db } from '@/db/connection';
import { favoriteSongs } from '@/db/schema';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const allFavoriteSongs = await db.select().from(favoriteSongs);
    return NextResponse.json({ data: allFavoriteSongs }, { status: 200 });
  } catch (error) {
    console.error('Error fetching favorite songs:', error);
    return NextResponse.json({ error: 'Failed to fetch favorite songs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, songId } = await request.json();
    const newFavoriteSong = await db.insert(favoriteSongs).values({ userId, songId, createdAt: new Date() }).returning();
    return NextResponse.json({ data: newFavoriteSong }, { status: 201 });
  } catch (error) {
    console.error('Error adding favorite song:', error);
    return NextResponse.json({ error: 'Failed to add favorite song' }, { status: 500 });
  }
}