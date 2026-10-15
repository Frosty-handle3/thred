import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { PersonPicker } from '../../components/PersonPicker.tsx';
import { Button, Chip, Field, styles } from '../../components/ui.tsx';
import { addMeeting, savePerson } from '../../db/queries.ts';
import { isApproxDate } from '../../lib/dates.ts';
import { useBook } from '../../lib/useBook.ts';

export default function EditPersonScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const editingId = params.id ? Number(params.id) : undefined;
  const { db, book } = useBook();

  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [areaIds, setAreaIds] = useState<number[]>([]);
  const [introducedBy, setIntroducedBy] = useState<number | null>(null);
  const [place, setPlace] = useState('');
  const [date, setDate] = useState('');
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    if (!book || loaded) return;
    const p = editingId ? book.personById.get(editingId) : undefined;
    if (p) {
      setName(p.name);
      setPhone(p.phone ?? '');
      setEmail(p.email ?? '');
      setNotes(p.notes ?? '');
      setIntroducedBy(p.introduced_by);
      setAreaIds(book.areasByPerson.get(p.id) ?? []);
    }
    setLoaded(true);
  }, [book, editingId, loaded]);

  if (!book || !loaded) return <View style={styles.screen} />;

  const toggleArea = (id: number) =>
    setAreaIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const save = async () => {
    if (!name.trim()) return Alert.alert('Add a name first');
    if (date.trim() && !isApproxDate(date)) {
      return Alert.alert('Check the date', 'Use a year (2019), a month (2019-06) or a day (2019-06-14).');
    }
    const id = await savePerson(db, { name, phone, email, notes, introduced_by: introducedBy, areaIds }, editingId);
    if (!editingId && (place.trim() || date.trim())) {
      await addMeeting(db, {
        person_id: id,
        place,
        date_text: date,
        area_id: areaIds[0] ?? null,
        note: null,
      });
    }
    if (editingId) router.back();
    else router.replace(`/person/${id}`);
  };

  const others = book.people.filter((p) => p.id !== editingId);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field label="Name" value={name} onChangeText={setName} placeholder="Full name" autoFocus={!editingId} />

        <Text style={styles.label}>Part of your life</Text>
        <View style={[styles.wrap, { marginBottom: 14 }]}>
          {book.areas.map((a) => (
            <Chip
              key={a.id}
              label={a.name}
              color={a.color}
              selected={areaIds.includes(a.id)}
              onPress={() => toggleArea(a.id)}
            />
          ))}
          <Chip label="+ New area" selected={false} onPress={() => router.push('/areas')} />
        </View>

        {!editingId && (
          <>
            <Field label="Where did you meet?" value={place} onChangeText={setPlace} placeholder="e.g. Leeds" />
            <Field
              label="When?"
              value={date}
              onChangeText={setDate}
              placeholder="2019, 2019-06 or 2019-06-14"
              keyboardType="numbers-and-punctuation"
            />
          </>
        )}

        <Text style={styles.label}>Introduced by</Text>
        <View style={[styles.wrap, { marginBottom: 14 }]}>
          {introducedBy ? (
            <Chip
              label={`${book.nameOf(introducedBy)}  ×`}
              color={book.colorFor(introducedBy)}
              selected
              onPress={() => setIntroducedBy(null)}
            />
          ) : (
            <Chip label="Choose someone" selected={false} onPress={() => setPicking(true)} />
          )}
        </View>

        <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Optional" />
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="Optional"
        />
        <Field
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Anything worth remembering"
          multiline
          style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
        />

        <Button title={editingId ? 'Save' : 'Add to phone book'} onPress={save} />

        <PersonPicker
          visible={picking}
          title="Who introduced you?"
          people={others}
          colorFor={book.colorFor}
          onClose={() => setPicking(false)}
          onPick={(p) => {
            setIntroducedBy(p.id);
            setPicking(false);
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
