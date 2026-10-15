import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';

import { colors } from '../components/ui.tsx';
import { migrate } from '../db/schema.ts';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="thred.db" onInit={migrate}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: colors.accent,
          headerTitleStyle: { color: colors.text },
          headerStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'thRed' }} />
        <Stack.Screen name="person/[id]" options={{ title: '' }} />
        <Stack.Screen name="person/edit" options={{ title: 'Person', presentation: 'modal' }} />
        <Stack.Screen name="meeting" options={{ title: 'How you met', presentation: 'modal' }} />
        <Stack.Screen name="link" options={{ title: 'Link two people', presentation: 'modal' }} />
        <Stack.Screen name="areas" options={{ title: 'Life areas' }} />
        <Stack.Screen name="insights" options={{ title: 'Connections' }} />
      </Stack>
    </SQLiteProvider>
  );
}
