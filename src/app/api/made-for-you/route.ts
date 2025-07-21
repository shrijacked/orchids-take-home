import { db } from '@/db/connection.ts';
import { madeForYou, NewMadeForYou } from '@/db/schema.ts';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const data = await db.select().from(madeForYou).all();
    return NextResponse.json(data);
  } catch (error: any) {
    console.log(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: NewMadeForYou = await request.json();
    const data = await db.insert(madeForYou).values(body).returning();
    return NextResponse.json(data);
  } catch (error: any) {
    console.log(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}