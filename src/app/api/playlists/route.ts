import { db } from '@/db/connection';
import { playlists } from '@/db/schema';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const allPlaylists = await db.select().from(playlists);
    return NextResponse.json({ data: allPlaylists }, { status: 200 });
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, name } = await request.json();
    const newPlaylist = await db.insert(playlists).values({ userId, name, createdAt: new Date() }).returning();
    return NextResponse.json({ data: newPlaylist }, { status: 201 });
  } catch (error) {
    console.error('Error creating playlist:', error);
    return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 });
  }
}