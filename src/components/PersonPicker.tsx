import { useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Person } from '../lib/types.ts';
import { Avatar, colors, Row, styles } from './ui.tsx';

export function PersonPicker({
  visible,
  title,
  people,
  colorFor,
  onPick,
  onClose,
}: {
  visible: boolean;
  title: string;
  people: Person[];
  colorFor: (id: number) => string | undefined;
  onPick: (person: Person) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const shown = q ? people.filter((p) => p.name.toLowerCase().includes(q)) : people;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={styles.link}>Cancel</Text>
          </Pressable>
        </View>
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search"
            placeholderTextColor="#A3A0AF"
            style={styles.input}
            autoFocus
          />
        </View>
        <FlatList
          data={shown}
          keyExtractor={(p) => String(p.id)}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Row
              onPress={() => {
                setQuery('');
                onPick(item);
              }}
            >
              <Avatar name={item.name} color={colorFor(item.id)} size={34} />
              <Text style={styles.rowTitle}>{item.name}</Text>
            </Row>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No one matches.</Text>}
        />
      </SafeAreaView>
    </Modal>
  );
}
