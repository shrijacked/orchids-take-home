import { db } from '@/db/connection.ts';
import { popularAlbums } from '@/db/schema.ts';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const albums = await db.select().from(popularAlbums).all();
    return NextResponse.json(albums);
  } catch (error) {
    console.error('Error fetching popular albums:', error);
    return NextResponse.json({ error: 'Failed to fetch popular albums' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, artist, releaseYear, genre } = await request.json();
    const newAlbum = await db.insert(popularAlbums).values({ title, artist, releaseYear, genre }).returning();
    return NextResponse.json(newAlbum);
  } catch (error) {
    console.error('Error creating popular album:', error);
    return NextResponse.json({ error: 'Failed to create popular album' }, { status: 500 });
  }
}