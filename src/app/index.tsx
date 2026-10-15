import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Avatar, Button, Chip, colors, Empty, Row, styles } from '../components/ui.tsx';
import { loadSampleBook } from '../db/sample.ts';
import { formatApproxDate } from '../lib/dates.ts';
import { useBook } from '../lib/useBook.ts';

export default function PeopleScreen() {
  const { db, book, reload } = useBook();
  const [query, setQuery] = useState('');
  const [areaFilter, setAreaFilter] = useState<number | null>(null);

  const firstMeeting = useMemo(() => {
    const map = new Map<number, { date_text: string | null; place: string | null }>();
    for (const m of book?.meetings ?? []) if (!map.has(m.person_id)) map.set(m.person_id, m);
    return map;
  }, [book]);

  if (!book) return <View style={styles.screen} />;

  const q = query.trim().toLowerCase();
  const people = book.people.filter((p) => {
    if (areaFilter !== null && !book.areasByPerson.get(p.id)?.includes(areaFilter)) return false;
    if (!q) return true;
    const met = firstMeeting.get(p.id);
    return [p.name, p.notes, met?.place, met?.date_text].some((s) => s?.toLowerCase().includes(q));
  });

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable onPress={() => router.push('/insights')} hitSlop={10}>
              <Text style={styles.link}>Connections</Text>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={() => router.push('/person/edit')} hitSlop={10}>
              <Text style={[styles.link, { fontSize: 26, lineHeight: 28 }]}>+</Text>
            </Pressable>
          ),
        }}
      />
      <FlatList
        data={people}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ marginBottom: 12 }}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search people, places, years"
              placeholderTextColor="#A3A0AF"
              style={[styles.input, { marginBottom: 12 }]}
              clearButtonMode="while-editing"
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Chip label="Everyone" selected={areaFilter === null} onPress={() => setAreaFilter(null)} />
              {book.areas.map((a) => (
                <Chip
                  key={a.id}
                  label={a.name}
                  color={a.color}
                  selected={areaFilter === a.id}
                  onPress={() => setAreaFilter(areaFilter === a.id ? null : a.id)}
                />
              ))}
              <Chip label="Edit areas" selected={false} onPress={() => router.push('/areas')} />
            </ScrollView>
          </View>
        }
        renderItem={({ item, index }) => {
          const met = firstMeeting.get(item.id);
          const areaNames = (book.areasByPerson.get(item.id) ?? [])
            .map((id) => book.areaById.get(id)?.name)
            .filter(Boolean)
            .join(' · ');
          const metLine = [met?.place, formatApproxDate(met?.date_text ?? null)].filter(Boolean).join(', ');
          const links = book.graph.get(item.id)?.size ?? 0;
          return (
            <View
              style={[
                { backgroundColor: colors.card, borderColor: colors.border, borderLeftWidth: 0.5, borderRightWidth: 0.5 },
                index === 0 && { borderTopLeftRadius: 14, borderTopRightRadius: 14, borderTopWidth: 0.5 },
                index === people.length - 1 && { borderBottomLeftRadius: 14, borderBottomRightRadius: 14, overflow: 'hidden' },
              ]}
            >
              <Row onPress={() => router.push(`/person/${item.id}`)}>
                <Avatar name={item.name} color={book.colorFor(item.id)} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{item.name}</Text>
                  {!!(areaNames || metLine) && (
                    <Text style={styles.rowSub} numberOfLines={1}>
                      {[areaNames, metLine && `met ${metLine}`].filter(Boolean).join('  ·  ')}
                    </Text>
                  )}
                </View>
                {links > 0 && <Text style={{ color: colors.muted, fontSize: 13 }}>{links} 🧵</Text>}
              </Row>
            </View>
          );
        }}
        ListEmptyComponent={
          book.people.length === 0 ? (
            <View style={[styles.card, { padding: 8 }]}>
              <Empty>
                Your phone book is empty. Add the people in your life, the part of life you know them from, and
                where and when you met. Then link people who know each other to see the threads between them.
              </Empty>
              <View style={{ paddingHorizontal: 8, paddingBottom: 8 }}>
                <Button title="Add someone" onPress={() => router.push('/person/edit')} />
                <Button
                  title="Try it with example people"
                  kind="secondary"
                  onPress={() => loadSampleBook(db).then(reload)}
                />
              </View>
            </View>
          ) : (
            <Empty>No one matches that search.</Empty>
          )
        }
      />
    </View>
  );
}
