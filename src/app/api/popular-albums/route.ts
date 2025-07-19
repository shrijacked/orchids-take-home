import { NextResponse } from 'next/server';
import { db } from '@/db/connection.ts';
import { popularAlbums } from '@/db/schema.ts';

export async function GET() {
  const albums = await db.select().from(popularAlbums);
  return NextResponse.json(albums);
} 