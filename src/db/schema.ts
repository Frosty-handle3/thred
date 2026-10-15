import type { SQLiteDatabase } from 'expo-sqlite';

const SCHEMA_VERSION = 1;

export async function migrate(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  if (current >= SCHEMA_VERSION) return;

  if (current < 1) {
    await db.execAsync(`
      CREATE TABLE areas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        color TEXT NOT NULL
      );
      CREATE TABLE people (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        notes TEXT,
        introduced_by INTEGER REFERENCES people(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE person_areas (
        person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        area_id INTEGER NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
        PRIMARY KEY (person_id, area_id)
      );
      CREATE TABLE meetings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        date_text TEXT,
        place TEXT,
        area_id INTEGER REFERENCES areas(id) ON DELETE SET NULL,
        note TEXT
      );
      CREATE TABLE links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        a_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        b_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        kind TEXT NOT NULL,
        note TEXT,
        CHECK (a_id < b_id),
        UNIQUE (a_id, b_id)
      );
      CREATE INDEX meetings_person ON meetings(person_id);
      CREATE INDEX links_b ON links(b_id);
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}
