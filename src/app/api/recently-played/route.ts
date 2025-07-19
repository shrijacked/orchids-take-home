import { NextResponse } from 'next/server';
import { db } from '@/db/connection.ts';
import { recentlyPlayed } from '@/db/schema.ts';
import { desc } from 'drizzle-orm';

export async function GET() {
  // Query all recently played songs, order by playedAt descending
  const songs = await db.select().from(recentlyPlayed).orderBy(desc(recentlyPlayed.playedAt));
  return NextResponse.json(songs);
} 