import { test } from 'node:test';
import assert from 'node:assert/strict';

import { formatApproxDate, isApproxDate, toMonthIndex } from './dates.ts';
import {
  bridges,
  buildGraph,
  friendsOfFriends,
  introductionReach,
  mutuals,
  samePlaceSameTime,
  shortestPath,
} from './graph.ts';

// 1 Sam ─ 2 Priya ─ 3 Leo ─ 4 Mia      5 Zoe (no links)
//   └──── 6 Tom ───┘
const links = [
  { a_id: 1, b_id: 2 },
  { a_id: 2, b_id: 3 },
  { a_id: 3, b_id: 4 },
  { a_id: 1, b_id: 6 },
  { a_id: 6, b_id: 2 },
];
const g = buildGraph(links);

test('mutuals finds shared links', () => {
  assert.deepEqual(mutuals(g, 1, 2), [6]);
  assert.deepEqual(mutuals(g, 1, 3).sort(), [2]);
  assert.deepEqual(mutuals(g, 1, 5), []);
});

test('friendsOfFriends lists people two links away, most shared first', () => {
  assert.deepEqual(friendsOfFriends(g, 1), [{ id: 3, via: [2] }]);
  assert.deepEqual(friendsOfFriends(g, 4), [{ id: 2, via: [3] }]);
  assert.deepEqual(friendsOfFriends(g, 5), []);
});

test('shortestPath returns the chain of people, or null', () => {
  assert.deepEqual(shortestPath(g, 1, 4), [1, 2, 3, 4]);
  assert.deepEqual(shortestPath(g, 6, 3), [6, 2, 3]);
  assert.deepEqual(shortestPath(g, 1, 1), [1]);
  assert.equal(shortestPath(g, 1, 5), null);
});

test('bridges are links between people with no life area in common', () => {
  const areas = new Map([
    [1, [10]], // uni
    [2, [10, 20]], // uni + work
    [3, [20]], // work
    [4, [30]], // football
    [6, []],
  ]);
  assert.deepEqual(
    bridges(links, areas).map((b) => [b.a_id, b.b_id]),
    [[3, 4]],
  );
});

test('samePlaceSameTime suggests unlinked people met nearby in time', () => {
  const meetings = [
    { person_id: 1, place: 'Leeds', date_text: '2019-09' },
    { person_id: 5, place: ' leeds ', date_text: '2019-11' },
    { person_id: 2, place: 'Leeds', date_text: '2019-10' }, // linked to 1 already
    { person_id: 4, place: 'Leeds', date_text: '2023' }, // too far apart
    { person_id: 3, place: null, date_text: '2019-09' },
  ];
  const s = samePlaceSameTime(meetings, g);
  assert.deepEqual(
    s.map((x) => [x.a_id, x.b_id, x.monthsApart]),
    [
      [2, 5, 1],
      [1, 5, 2],
    ],
  );
});

test('introductionReach counts everyone reached down the chain', () => {
  const people = [
    { id: 1, introduced_by: null },
    { id: 2, introduced_by: 1 },
    { id: 3, introduced_by: 2 },
    { id: 4, introduced_by: 2 },
    { id: 5, introduced_by: 1 },
  ];
  assert.deepEqual(introductionReach(people), [
    { id: 1, direct: 2, total: 4 },
    { id: 2, direct: 2, total: 2 },
  ]);
});

test('approximate dates', () => {
  assert.ok(isApproxDate('2019'));
  assert.ok(isApproxDate('2019-06'));
  assert.ok(isApproxDate('2019-06-14'));
  assert.ok(!isApproxDate('2019-13'));
  assert.ok(!isApproxDate('June 2019'));
  assert.equal(toMonthIndex('2019-01'), 2019 * 12);
  assert.equal(formatApproxDate('2019-06'), 'Jun 2019');
  assert.equal(formatApproxDate('2019-06-04'), '4 Jun 2019');
});
