import { toMonthIndex } from './dates.ts';
import type { Link, Meeting } from './types.ts';

// Everything here works on plain arrays so it can run (and be tested) without the phone.

export type Graph = Map<number, Set<number>>;

export function buildGraph(links: Pick<Link, 'a_id' | 'b_id'>[]): Graph {
  const g: Graph = new Map();
  const add = (from: number, to: number) => {
    if (!g.has(from)) g.set(from, new Set());
    g.get(from)!.add(to);
  };
  for (const { a_id, b_id } of links) {
    if (a_id === b_id) continue;
    add(a_id, b_id);
    add(b_id, a_id);
  }
  return g;
}

export function neighbours(g: Graph, id: number): number[] {
  return [...(g.get(id) ?? [])];
}

/** People both a and b are linked to. */
export function mutuals(g: Graph, a: number, b: number): number[] {
  const nb = g.get(b) ?? new Set<number>();
  return neighbours(g, a).filter((id) => id !== b && nb.has(id));
}

export type FriendOfFriend = { id: number; via: number[] };

/**
 * Connections of connections: people two links away from `id` who are not linked
 * to them directly, most shared connections first.
 */
export function friendsOfFriends(g: Graph, id: number): FriendOfFriend[] {
  const direct = g.get(id) ?? new Set<number>();
  const via = new Map<number, number[]>();
  for (const friend of direct) {
    for (const fof of g.get(friend) ?? []) {
      if (fof === id || direct.has(fof)) continue;
      if (!via.has(fof)) via.set(fof, []);
      via.get(fof)!.push(friend);
    }
  }
  return [...via.entries()]
    .map(([fofId, through]) => ({ id: fofId, via: through }))
    .sort((x, y) => y.via.length - x.via.length || x.id - y.id);
}

/** Shortest chain of links from a to b (inclusive), or null if they aren't connected. */
export function shortestPath(g: Graph, a: number, b: number): number[] | null {
  if (a === b) return [a];
  const prev = new Map<number, number>([[a, a]]);
  const queue = [a];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const next of g.get(cur) ?? []) {
      if (prev.has(next)) continue;
      prev.set(next, cur);
      if (next === b) {
        const path = [b];
        while (path[0] !== a) path.unshift(prev.get(path[0])!);
        return path;
      }
      queue.push(next);
    }
  }
  return null;
}

export type Bridge = { a_id: number; b_id: number; aAreas: number[]; bAreas: number[] };

/**
 * Links that cross between different parts of your life: both people belong to
 * at least one life area, but they share none.
 */
export function bridges(
  links: Pick<Link, 'a_id' | 'b_id'>[],
  areasByPerson: Map<number, number[]>,
): Bridge[] {
  const out: Bridge[] = [];
  for (const { a_id, b_id } of links) {
    const aAreas = areasByPerson.get(a_id) ?? [];
    const bAreas = areasByPerson.get(b_id) ?? [];
    if (!aAreas.length || !bAreas.length) continue;
    if (aAreas.some((x) => bAreas.includes(x))) continue;
    out.push({ a_id, b_id, aAreas, bAreas });
  }
  return out;
}

export type Suggestion = { a_id: number; b_id: number; place: string; monthsApart: number };

const normalisePlace = (p: string) => p.trim().toLowerCase();

/**
 * "Might they know each other?": pairs you met in the same place within
 * `windowMonths` of each other who aren't linked yet.
 */
export function samePlaceSameTime(
  meetings: Pick<Meeting, 'person_id' | 'place' | 'date_text'>[],
  g: Graph,
  windowMonths = 6,
): Suggestion[] {
  const byPlace = new Map<string, { person: number; month: number; place: string }[]>();
  for (const m of meetings) {
    const month = toMonthIndex(m.date_text);
    if (!m.place || month === null) continue;
    const key = normalisePlace(m.place);
    if (!byPlace.has(key)) byPlace.set(key, []);
    byPlace.get(key)!.push({ person: m.person_id, month, place: m.place.trim() });
  }

  const best = new Map<string, Suggestion>();
  for (const entries of byPlace.values()) {
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const x = entries[i];
        const y = entries[j];
        if (x.person === y.person || g.get(x.person)?.has(y.person)) continue;
        const monthsApart = Math.abs(x.month - y.month);
        if (monthsApart > windowMonths) continue;
        const [a_id, b_id] = x.person < y.person ? [x.person, y.person] : [y.person, x.person];
        const key = `${a_id}-${b_id}`;
        const existing = best.get(key);
        if (!existing || monthsApart < existing.monthsApart) {
          best.set(key, { a_id, b_id, place: x.place, monthsApart });
        }
      }
    }
  }
  return [...best.values()].sort((p, q) => p.monthsApart - q.monthsApart);
}

/** People ranked by how many others they introduced you to, directly or down the chain. */
export function introductionReach(people: { id: number; introduced_by: number | null }[]) {
  const children = new Map<number, number[]>();
  for (const p of people) {
    if (p.introduced_by === null || p.introduced_by === p.id) continue;
    if (!children.has(p.introduced_by)) children.set(p.introduced_by, []);
    children.get(p.introduced_by)!.push(p.id);
  }
  const reach = (id: number, seen: Set<number>): number => {
    let total = 0;
    for (const c of children.get(id) ?? []) {
      if (seen.has(c)) continue;
      seen.add(c);
      total += 1 + reach(c, seen);
    }
    return total;
  };
  return [...children.keys()]
    .map((id) => ({ id, direct: children.get(id)!.length, total: reach(id, new Set([id])) }))
    .sort((a, b) => b.total - a.total || b.direct - a.direct);
}
