--- a/db/schema.ts
+++ b/db/schema.ts
@@ -33,3 +33,12 @@
       albumArt: text('album_art').notNull(),
       duration: integer('duration').notNull(),
 });
+
+export const userPlaylists = sqliteTable('user_playlists', {
+  id: integer('id').primaryKey({ autoIncrement: true }),
+  title: text('title').notNull(),
+  creator: text('creator').notNull(),
+  description: text('description'),
+  albumArt: text('album_art'),
+  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
+});
--- a/api/user-playlists/route.ts
+++ b/api/user-playlists/route.ts
@@ -0,0 +1,12 @@
+import { NextResponse } from 'next/server';
+import { db } from '@/db/connection.ts';
+import { userPlaylists } from '@/db/schema.ts';
+
+export async function GET() {
+  try {
+    const playlists = await db.select().from(userPlaylists);
+    return NextResponse.json(playlists);
+  } catch (error) {
+    return NextResponse.json({ error: error.message }, { status: 500 });
+  }
+}