import path from 'path';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { join } from 'path';

const sqlitePath = join(process.cwd(), 'sqlite.db');
const sqlite = new Database(path.join(process.cwd(), 'sqlite.db'));
export const db = drizzle(sqlite);