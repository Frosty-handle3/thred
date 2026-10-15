import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';

import { type BookData, loadBook } from '../db/queries.ts';
import { buildGraph } from './graph.ts';

/** Loads the whole phone book each time the screen comes into focus. */
export function useBook() {
  const db = useSQLiteContext();
  const [data, setData] = useState<BookData | null>(null);

  const reload = useCallback(() => {
    loadBook(db).then(setData);
  }, [db]);

  useFocusEffect(reload);

  const derived = useMemo(() => {
    if (!data) return null;
    const areaById = new Map(data.areas.map((a) => [a.id, a]));
    return {
      ...data,
      graph: buildGraph(data.links),
      personById: new Map(data.people.map((p) => [p.id, p])),
      areaById,
      /** A person's colour is the colour of their first life area. */
      colorFor: (id: number) => {
        const first = data.areasByPerson.get(id)?.[0];
        return first === undefined ? undefined : areaById.get(first)?.color;
      },
      nameOf: (id: number) => data.people.find((p) => p.id === id)?.name ?? 'Someone',
    };
  }, [data]);

  return { db, book: derived, reload };
}

export type Book = NonNullable<ReturnType<typeof useBook>['book']>;
