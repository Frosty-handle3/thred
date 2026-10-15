import type { SQLiteDatabase } from 'expo-sqlite';

import { addArea, addLink, addMeeting, savePerson } from './queries.ts';

// A small made-up network so the connection features have something to show.
export async function loadSampleBook(db: SQLiteDatabase) {
  const uni = await addArea(db, 'University', '#7C5CFF');
  const work = await addArea(db, 'Work', '#0EA5E9');
  const football = await addArea(db, 'Football club', '#16A34A');
  const family = await addArea(db, 'Family', '#F97316');

  const person = (name: string, areaIds: number[], introduced_by: number | null = null) =>
    savePerson(db, { name, areaIds, introduced_by });

  const sam = await person('Sam Carter', [uni]);
  const priya = await person('Priya Shah', [uni, work], sam);
  const leo = await person('Leo Martin', [work], priya);
  const mia = await person('Mia Lopez', [football]);
  const tom = await person('Tom Reid', [uni], sam);
  const zoe = await person('Zoe Brooks', [football]);
  const ana = await person('Ana Hughes', [family]);

  await addMeeting(db, { person_id: sam, date_text: '2018-09', place: 'Leeds', area_id: uni, note: 'Freshers week' });
  await addMeeting(db, { person_id: tom, date_text: '2018-10', place: 'Leeds', area_id: uni, note: null });
  await addMeeting(db, { person_id: priya, date_text: '2019-02', place: 'Leeds', area_id: uni, note: "Sam's flatmate" });
  await addMeeting(db, { person_id: leo, date_text: '2022-03', place: 'Manchester', area_id: work, note: 'First day at the job' });
  await addMeeting(db, { person_id: mia, date_text: '2022-05', place: 'Manchester', area_id: football, note: 'Sunday league' });
  await addMeeting(db, { person_id: zoe, date_text: '2022-07', place: 'Manchester', area_id: football, note: null });
  await addMeeting(db, { person_id: ana, date_text: '2000', place: 'Bristol', area_id: family, note: 'Cousin' });

  await addLink(db, sam, priya, 'friends');
  await addLink(db, sam, tom, 'classmates');
  await addLink(db, tom, priya, 'friends');
  await addLink(db, priya, leo, 'colleagues');
  await addLink(db, leo, mia, 'partners');
  await addLink(db, mia, zoe, 'teammates');
}
