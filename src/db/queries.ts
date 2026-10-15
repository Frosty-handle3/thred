import type { SQLiteDatabase } from 'expo-sqlite';

import type { Area, Link, Meeting, Person } from '../lib/types.ts';

export type BookData = {
  people: Person[];
  areas: Area[];
  meetings: Meeting[];
  links: Link[];
  areasByPerson: Map<number, number[]>;
};

// A personal phone book is small, so screens load the whole book and work in memory.
export async function loadBook(db: SQLiteDatabase): Promise<BookData> {
  const [people, areas, meetings, links, personAreas] = await Promise.all([
    db.getAllAsync<Person>(
      'SELECT id, name, phone, email, notes, introduced_by FROM people ORDER BY name COLLATE NOCASE',
    ),
    db.getAllAsync<Area>('SELECT id, name, color FROM areas ORDER BY name COLLATE NOCASE'),
    db.getAllAsync<Meeting>(
      'SELECT id, person_id, date_text, place, area_id, note FROM meetings ORDER BY date_text',
    ),
    db.getAllAsync<Link>('SELECT id, a_id, b_id, kind, note FROM links'),
    db.getAllAsync<{ person_id: number; area_id: number }>('SELECT person_id, area_id FROM person_areas'),
  ]);
  const areasByPerson = new Map<number, number[]>();
  for (const { person_id, area_id } of personAreas) {
    if (!areasByPerson.has(person_id)) areasByPerson.set(person_id, []);
    areasByPerson.get(person_id)!.push(area_id);
  }
  return { people, areas, meetings, links, areasByPerson };
}

const blankToNull = (s: string | null | undefined) => (s && s.trim() ? s.trim() : null);

export type PersonInput = {
  name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  introduced_by?: number | null;
  areaIds: number[];
};

export async function savePerson(db: SQLiteDatabase, input: PersonInput, id?: number): Promise<number> {
  let personId = id ?? 0;
  await db.withTransactionAsync(async () => {
    const values = [
      input.name.trim(),
      blankToNull(input.phone),
      blankToNull(input.email),
      blankToNull(input.notes),
      input.introduced_by ?? null,
    ];
    if (id) {
      await db.runAsync(
        'UPDATE people SET name = ?, phone = ?, email = ?, notes = ?, introduced_by = ? WHERE id = ?',
        [...values, id],
      );
      await db.runAsync('DELETE FROM person_areas WHERE person_id = ?', id);
    } else {
      const res = await db.runAsync(
        'INSERT INTO people (name, phone, email, notes, introduced_by) VALUES (?, ?, ?, ?, ?)',
        values,
      );
      personId = res.lastInsertRowId;
    }
    for (const areaId of input.areaIds) {
      await db.runAsync('INSERT INTO person_areas (person_id, area_id) VALUES (?, ?)', personId, areaId);
    }
  });
  return personId;
}

export async function deletePerson(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM people WHERE id = ?', id);
}

export async function addArea(db: SQLiteDatabase, name: string, color: string): Promise<number> {
  const res = await db.runAsync('INSERT INTO areas (name, color) VALUES (?, ?)', name.trim(), color);
  return res.lastInsertRowId;
}

export async function deleteArea(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM areas WHERE id = ?', id);
}

export type MeetingInput = Omit<Meeting, 'id'>;

export async function addMeeting(db: SQLiteDatabase, m: MeetingInput) {
  await db.runAsync(
    'INSERT INTO meetings (person_id, date_text, place, area_id, note) VALUES (?, ?, ?, ?, ?)',
    m.person_id,
    blankToNull(m.date_text),
    blankToNull(m.place),
    m.area_id,
    blankToNull(m.note),
  );
}

export async function deleteMeeting(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM meetings WHERE id = ?', id);
}

export async function addLink(db: SQLiteDatabase, x: number, y: number, kind: string, note?: string) {
  const [a, b] = x < y ? [x, y] : [y, x];
  await db.runAsync(
    'INSERT INTO links (a_id, b_id, kind, note) VALUES (?, ?, ?, ?) ON CONFLICT (a_id, b_id) DO UPDATE SET kind = excluded.kind, note = excluded.note',
    a,
    b,
    kind,
    blankToNull(note),
  );
}

export async function deleteLink(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM links WHERE id = ?', id);
}
