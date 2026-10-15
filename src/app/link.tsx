import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { PersonPicker } from '../components/PersonPicker.tsx';
import { Avatar, Button, Chip, colors, Field, styles } from '../components/ui.tsx';
import { addLink } from '../db/queries.ts';
import { mutuals } from '../lib/graph.ts';
import { LINK_KINDS } from '../lib/types.ts';
import { useBook } from '../lib/useBook.ts';

export default function LinkScreen() {
  const { from } = useLocalSearchParams<{ from: string }>();
  const fromId = Number(from);
  const { db, book } = useBook();
  const [otherId, setOtherId] = useState<number | null>(null);
  const [kind, setKind] = useState<string>('friends');
  const [note, setNote] = useState('');
  const [picking, setPicking] = useState(true);

  if (!book) return <View style={styles.screen} />;

  const linked = book.graph.get(fromId) ?? new Set<number>();
  const candidates = book.people.filter((p) => p.id !== fromId && !linked.has(p.id));
  const shared = otherId ? mutuals(book.graph, fromId, otherId) : [];

  const save = async () => {
    if (!otherId) return;
    await addLink(db, fromId, otherId, kind, note);
    router.back();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
        <View style={{ alignItems: 'center', width: 110 }}>
          <Avatar name={book.nameOf(fromId)} color={book.colorFor(fromId)} size={56} />
          <Text style={[styles.rowTitle, { textAlign: 'center', marginTop: 6 }]}>{book.nameOf(fromId)}</Text>
        </View>
        <Text style={{ fontSize: 22, color: colors.accent }}>⟷</Text>
        <View style={{ alignItems: 'center', width: 110 }}>
          {otherId ? (
            <>
              <Avatar name={book.nameOf(otherId)} color={book.colorFor(otherId)} size={56} />
              <Text style={[styles.rowTitle, { textAlign: 'center', marginTop: 6 }]}>{book.nameOf(otherId)}</Text>
            </>
          ) : (
            <Button title="Choose…" kind="link" onPress={() => setPicking(true)} />
          )}
        </View>
      </View>

      {otherId && (
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Button title="Choose someone else" kind="link" onPress={() => setPicking(true)} />
          {shared.length > 0 && (
            <Text style={[styles.rowSub, { marginTop: 8 }]}>Both know {shared.map(book.nameOf).join(', ')}</Text>
          )}
        </View>
      )}

      <Text style={styles.label}>How they know each other</Text>
      <View style={[styles.wrap, { marginBottom: 14 }]}>
        {LINK_KINDS.map((k) => (
          <Chip key={k} label={k} selected={kind === k} onPress={() => setKind(k)} />
        ))}
      </View>
      <Field label="Note" value={note} onChangeText={setNote} placeholder="Optional" />
      <Button title="Link them" onPress={save} disabled={!otherId} />

      <PersonPicker
        visible={picking}
        title={`Who does ${book.nameOf(fromId).split(' ')[0]} know?`}
        people={candidates}
        colorFor={book.colorFor}
        onClose={() => {
          setPicking(false);
          if (!otherId) router.back();
        }}
        onPick={(p) => {
          setOtherId(p.id);
          setPicking(false);
        }}
      />
    </ScrollView>
  );
}
