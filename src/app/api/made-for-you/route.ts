import { NextResponse } from 'next/server';
import { db } from '@/db/connection.ts';
import { madeForYou } from '@/db/schema.ts';

export async function GET() {
  const items = await db.select().from(madeForYou);
  return NextResponse.json(items);
} 