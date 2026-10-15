import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { PersonPicker } from '../components/PersonPicker.tsx';
import { Avatar, Chip, colors, Empty, Row, Section, styles } from '../components/ui.tsx';
import { bridges, introductionReach, samePlaceSameTime, shortestPath } from '../lib/graph.ts';
import { useBook } from '../lib/useBook.ts';

export default function InsightsScreen() {
  const { book } = useBook();
  const [ends, setEnds] = useState<[number | null, number | null]>([null, null]);
  const [picking, setPicking] = useState<0 | 1 | null>(null);

  if (!book) return <View style={styles.screen} />;

  const [from, to] = ends;
  const path = from && to ? shortestPath(book.graph, from, to) : null;
  const crossLinks = bridges(book.links, book.areasByPerson);
  const suggestions = samePlaceSameTime(book.meetings, book.graph);
  const introducers = introductionReach(book.people).slice(0, 5);
  const mostConnected = [...book.graph.entries()]
    .map(([id, set]) => ({ id, count: set.size }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const areaNames = (ids: number[]) => ids.map((id) => book.areaById.get(id)?.name).join(', ');
  const pairRow = (a: number, b: number, sub: string, key: string) => (
    <Row key={key} onPress={() => setEnds([a, b])}>
      <View style={{ flexDirection: 'row' }}>
        <Avatar name={book.nameOf(a)} color={book.colorFor(a)} size={30} />
        <View style={{ marginLeft: -8 }}>
          <Avatar name={book.nameOf(b)} color={book.colorFor(b)} size={30} />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>
          {book.nameOf(a)} & {book.nameOf(b)}
        </Text>
        <Text style={styles.rowSub}>{sub}</Text>
      </View>
    </Row>
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Section title="How are two people connected?">
        <View style={{ padding: 14 }}>
          <View style={[styles.wrap, { alignItems: 'center' }]}>
            <Chip
              label={from ? book.nameOf(from) : 'Choose person'}
              color={from ? book.colorFor(from) : undefined}
              selected={!!from}
              onPress={() => setPicking(0)}
            />
            <Text style={{ color: colors.muted, marginRight: 8, marginBottom: 8 }}>and</Text>
            <Chip
              label={to ? book.nameOf(to) : 'Choose person'}
              color={to ? book.colorFor(to) : undefined}
              selected={!!to}
              onPress={() => setPicking(1)}
            />
          </View>
          {from && to && !path && (
            <Text style={styles.rowSub}>No chain of links joins them yet.</Text>
          )}
          {path && (
            <View style={{ marginTop: 6 }}>
              <Text style={[styles.rowSub, { marginBottom: 8 }]}>
                {path.length === 2
                  ? 'They know each other directly.'
                  : `${path.length - 2} ${path.length === 3 ? 'person' : 'people'} in between:`}
              </Text>
              <View style={[styles.wrap, { alignItems: 'center' }]}>
                {path.map((id, i) => (
                  <View key={id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Chip
                      label={book.nameOf(id)}
                      color={book.colorFor(id)}
                      onPress={() => router.push(`/person/${id}`)}
                    />
                    {i < path.length - 1 && <Text style={{ color: colors.accent, marginRight: 8, marginBottom: 8 }}>→</Text>}
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </Section>

      <Section title="Bridges between parts of your life">
        {crossLinks.length === 0 && (
          <Empty>When two linked people share no life area (a uni friend dating a work colleague), they show here.</Empty>
        )}
        {crossLinks.map((b) =>
          pairRow(b.a_id, b.b_id, `${areaNames(b.aAreas)} ⟷ ${areaNames(b.bAreas)}`, `b${b.a_id}-${b.b_id}`),
        )}
      </Section>

      <Section title="Might they know each other?">
        {suggestions.length === 0 && (
          <Empty>People you met in the same place around the same time, but haven't linked, show here.</Empty>
        )}
        {suggestions.map((s) =>
          pairRow(
            s.a_id,
            s.b_id,
            `Both met in ${s.place}${s.monthsApart ? `, ${s.monthsApart} month${s.monthsApart === 1 ? '' : 's'} apart` : ', same time'}`,
            `s${s.a_id}-${s.b_id}`,
          ),
        )}
      </Section>

      {mostConnected.length > 0 && (
        <Section title="Most connected">
          {mostConnected.map(({ id, count }) => (
            <Row key={id} onPress={() => router.push(`/person/${id}`)}>
              <Avatar name={book.nameOf(id)} color={book.colorFor(id)} size={32} />
              <Text style={[styles.rowTitle, { flex: 1 }]}>{book.nameOf(id)}</Text>
              <Text style={styles.rowSub}>knows {count}</Text>
            </Row>
          ))}
        </Section>
      )}

      {introducers.length > 0 && (
        <Section title="Who opened up your network">
          {introducers.map((r) => (
            <Row key={r.id} onPress={() => router.push(`/person/${r.id}`)}>
              <Avatar name={book.nameOf(r.id)} color={book.colorFor(r.id)} size={32} />
              <Text style={[styles.rowTitle, { flex: 1 }]}>{book.nameOf(r.id)}</Text>
              <Text style={styles.rowSub}>
                led to {r.total} {r.total === 1 ? 'person' : 'people'}
              </Text>
            </Row>
          ))}
        </Section>
      )}

      <PersonPicker
        visible={picking !== null}
        title="Choose a person"
        people={book.people}
        colorFor={book.colorFor}
        onClose={() => setPicking(null)}
        onPick={(p) => {
          setEnds(picking === 0 ? [p.id, to] : [from, p.id]);
          setPicking(null);
        }}
      />
    </ScrollView>
  );
}
