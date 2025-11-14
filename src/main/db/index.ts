import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

let db: ReturnType<typeof drizzle> | null = null;

export function getDatabase() {
  if (db) return db;

  // Database path in user data directory
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'pos-database.db');

  // Ensure directory exists
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  console.log('Database path:', dbPath);

  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  db = drizzle(sqlite, { schema });

  return db;
}

export { schema };
export type Database = ReturnType<typeof getDatabase>;
