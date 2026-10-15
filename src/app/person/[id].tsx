import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';

import { Avatar, Button, Chip, colors, Empty, Row, Section, styles } from '../../components/ui.tsx';
import { deleteLink, deleteMeeting, deletePerson } from '../../db/queries.ts';
import { formatApproxDate } from '../../lib/dates.ts';
import { friendsOfFriends } from '../../lib/graph.ts';
import { useBook } from '../../lib/useBook.ts';

export default function PersonScreen() {
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const id = Number(idParam);
  const { db, book, reload } = useBook();

  if (!book) return <View style={styles.screen} />;
  const person = book.personById.get(id);
  if (!person) {
    return (
      <View style={styles.screen}>
        <Empty>This person was removed.</Empty>
      </View>
    );
  }

  const areas = (book.areasByPerson.get(id) ?? []).map((a) => book.areaById.get(a)!).filter(Boolean);
  const meetings = book.meetings.filter((m) => m.person_id === id);
  const links = book.links
    .filter((l) => l.a_id === id || l.b_id === id)
    .map((l) => ({ ...l, other: l.a_id === id ? l.b_id : l.a_id }))
    .sort((x, y) => book.nameOf(x.other).localeCompare(book.nameOf(y.other)));
  const alsoKnows = friendsOfFriends(book.graph, id);
  const introducedBy = person.introduced_by ? book.personById.get(person.introduced_by) : undefined;
  const introduced = book.people.filter((p) => p.introduced_by === id);

  const confirmDelete = () =>
    Alert.alert(`Remove ${person.name}?`, 'Their meetings and links will be removed too.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => deletePerson(db, id).then(() => router.back()),
      },
    ]);

  const confirm = (title: string, action: () => Promise<void>) =>
    Alert.alert(title, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => action().then(reload) },
    ]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => router.push({ pathname: '/person/edit', params: { id } })} hitSlop={10}>
              <Text style={styles.link}>Edit</Text>
            </Pressable>
          ),
        }}
      />

      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Avatar name={person.name} color={book.colorFor(id)} size={84} />
        <Text style={{ fontSize: 26, fontWeight: '800', color: colors.text, marginTop: 12 }}>{person.name}</Text>
        <View style={[styles.wrap, { justifyContent: 'center', marginTop: 10 }]}>
          {areas.map((a) => (
            <Chip key={a.id} label={a.name} color={a.color} />
          ))}
        </View>
        {introducedBy && (
          <Pressable onPress={() => router.push(`/person/${introducedBy.id}`)}>
            <Text style={{ color: colors.muted, marginTop: 4 }}>
              Introduced by <Text style={{ color: colors.accent, fontWeight: '600' }}>{introducedBy.name}</Text>
            </Text>
          </Pressable>
        )}
      </View>

      {(person.phone || person.email || person.notes) && (
        <Section title="Details">
          {person.phone && (
            <Row onPress={() => Linking.openURL(`tel:${person.phone}`)}>
              <Text style={styles.rowTitle}>📞 {person.phone}</Text>
            </Row>
          )}
          {person.email && (
            <Row onPress={() => Linking.openURL(`mailto:${person.email}`)}>
              <Text style={styles.rowTitle}>✉️ {person.email}</Text>
            </Row>
          )}
          {person.notes && <Text style={[styles.empty, { color: colors.text }]}>{person.notes}</Text>}
        </Section>
      )}

      <Section
        title="Where & when"
        right={
          <Button
            title="Add"
            kind="link"
            onPress={() => router.push({ pathname: '/meeting', params: { personId: id } })}
          />
        }
      >
        {meetings.length === 0 && <Empty>Add where and when you met {person.name.split(' ')[0]}.</Empty>}
        {meetings.map((m, i) => {
          const area = m.area_id ? book.areaById.get(m.area_id) : undefined;
          return (
            <Row key={m.id} onPress={() => confirm('Remove this entry?', () => deleteMeeting(db, m.id))}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: area?.color ?? colors.border }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>
                  {[m.place, formatApproxDate(m.date_text)].filter(Boolean).join(', ') || 'Unknown'}
                  {i === 0 && <Text style={{ color: colors.muted, fontWeight: '400' }}>  · first met</Text>}
                </Text>
                {!!(area || m.note) && (
                  <Text style={styles.rowSub}>{[area?.name, m.note].filter(Boolean).join(' · ')}</Text>
                )}
              </View>
            </Row>
          );
        })}
      </Section>

      <Section
        title={`Knows (${links.length})`}
        right={<Button title="Link" kind="link" onPress={() => router.push({ pathname: '/link', params: { from: id } })} />}
      >
        {links.length === 0 && <Empty>Link {person.name.split(' ')[0]} to people they know.</Empty>}
        {links.map((l) => (
          <Row key={l.id} onPress={() => router.push(`/person/${l.other}`)}>
            <Avatar name={book.nameOf(l.other)} color={book.colorFor(l.other)} size={32} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{book.nameOf(l.other)}</Text>
              <Text style={styles.rowSub}>{l.kind}</Text>
            </View>
            <Pressable
              hitSlop={10}
              onPress={() => confirm(`Unlink ${book.nameOf(l.other)}?`, () => deleteLink(db, l.id))}
            >
              <Text style={{ color: colors.muted, fontSize: 18 }}>×</Text>
            </Pressable>
          </Row>
        ))}
      </Section>

      {alsoKnows.length > 0 && (
        <Section title="Connections of connections">
          {alsoKnows.map((f) => (
            <Row key={f.id} onPress={() => router.push(`/person/${f.id}`)}>
              <Avatar name={book.nameOf(f.id)} color={book.colorFor(f.id)} size={32} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{book.nameOf(f.id)}</Text>
                <Text style={styles.rowSub}>through {f.via.map(book.nameOf).join(', ')}</Text>
              </View>
            </Row>
          ))}
        </Section>
      )}

      {introduced.length > 0 && (
        <Section title={`Introduced you to (${introduced.length})`}>
          {introduced.map((p) => (
            <Row key={p.id} onPress={() => router.push(`/person/${p.id}`)}>
              <Avatar name={p.name} color={book.colorFor(p.id)} size={32} />
              <Text style={styles.rowTitle}>{p.name}</Text>
            </Row>
          ))}
        </Section>
      )}

      <Button title={`Remove ${person.name}`} kind="danger" onPress={confirmDelete} />
    </ScrollView>
  );
}
