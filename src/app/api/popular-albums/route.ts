import { db } from '@/db/connection.ts';
import { popularAlbums, NewPopularAlbum } from '@/db/schema.ts';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const data = await db.select().from(popularAlbums).all();
    return NextResponse.json(data);
  } catch (error: any) {
    console.log(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: NewPopularAlbum = await request.json();
    const data = await db.insert(popularAlbums).values(body).returning();
    return NextResponse.json(data);
  } catch (error: any) {
    console.log(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}