import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import { Button, Chip, Field, styles } from '../components/ui.tsx';
import { addMeeting } from '../db/queries.ts';
import { isApproxDate } from '../lib/dates.ts';
import { useBook } from '../lib/useBook.ts';

export default function MeetingScreen() {
  const { personId } = useLocalSearchParams<{ personId: string }>();
  const { db, book } = useBook();
  const [place, setPlace] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [areaId, setAreaId] = useState<number | null>(null);

  if (!book) return <View style={styles.screen} />;
  const person = book.personById.get(Number(personId));

  const save = async () => {
    if (!place.trim() && !date.trim()) return Alert.alert('Add a place or a date');
    if (date.trim() && !isApproxDate(date)) {
      return Alert.alert('Check the date', 'Use a year (2019), a month (2019-06) or a day (2019-06-14).');
    }
    await addMeeting(db, { person_id: Number(personId), place, date_text: date, area_id: areaId, note });
    router.back();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {person && <Text style={[styles.rowSub, { marginBottom: 14 }]}>A time and place with {person.name}</Text>}
      <Field label="Where" value={place} onChangeText={setPlace} placeholder="e.g. Leeds, or Glastonbury" autoFocus />
      <Field
        label="When"
        value={date}
        onChangeText={setDate}
        placeholder="2019, 2019-06 or 2019-06-14"
        keyboardType="numbers-and-punctuation"
      />
      <Text style={styles.label}>Part of your life</Text>
      <View style={[styles.wrap, { marginBottom: 14 }]}>
        {book.areas.map((a) => (
          <Chip
            key={a.id}
            label={a.name}
            color={a.color}
            selected={areaId === a.id}
            onPress={() => setAreaId(areaId === a.id ? null : a.id)}
          />
        ))}
      </View>
      <Field label="Note" value={note} onChangeText={setNote} placeholder="e.g. Freshers week" />
      <Button title="Save" onPress={save} />
    </ScrollView>
  );
}
