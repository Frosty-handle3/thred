import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { AREA_COLORS, Button, colors, Empty, Field, Row, Section, styles } from '../components/ui.tsx';
import { addArea, deleteArea } from '../db/queries.ts';
import { useBook } from '../lib/useBook.ts';

export default function AreasScreen() {
  const { db, book, reload } = useBook();
  const [name, setName] = useState('');
  const [color, setColor] = useState(AREA_COLORS[0]!);

  if (!book) return <View style={styles.screen} />;

  const counts = new Map<number, number>();
  for (const ids of book.areasByPerson.values()) for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);

  const add = async () => {
    if (!name.trim()) return;
    await addArea(db, name, color);
    setName('');
    setColor(AREA_COLORS[(book.areas.length + 1) % AREA_COLORS.length]!);
    reload();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Section title="Your life areas">
        {book.areas.length === 0 && (
          <Empty>Areas are the parts of your life people belong to, like School, Work, Family or a club.</Empty>
        )}
        {book.areas.map((a) => (
          <Row key={a.id}>
            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: a.color }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{a.name}</Text>
              <Text style={styles.rowSub}>{counts.get(a.id) ?? 0} people</Text>
            </View>
            <Pressable
              hitSlop={10}
              onPress={() =>
                Alert.alert(`Delete ${a.name}?`, 'People stay in your phone book; they just lose this tag.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => deleteArea(db, a.id).then(reload) },
                ])
              }
            >
              <Text style={{ color: colors.muted, fontSize: 18 }}>×</Text>
            </Pressable>
          </Row>
        ))}
      </Section>

      <Section title="New area">
        <View style={{ padding: 14 }}>
          <Field label="Name" value={name} onChangeText={setName} placeholder="e.g. University" onSubmitEditing={add} />
          <Text style={styles.label}>Colour</Text>
          <View style={[styles.wrap, { gap: 10, marginBottom: 6 }]}>
            {AREA_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: c,
                  borderWidth: 3,
                  borderColor: color === c ? colors.text : 'transparent',
                }}
              />
            ))}
          </View>
          <Button title="Add area" onPress={add} disabled={!name.trim()} />
        </View>
      </Section>
    </ScrollView>
  );
}
