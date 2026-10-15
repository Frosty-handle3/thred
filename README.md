# thRed

A personal phone book that remembers where and when you met people, which part of your life they belong to, and how they connect to each other, so you can see the threads between your connections.

Everything is stored on your phone (SQLite). Nothing is sent anywhere.

## Try it on your phone

1. Install **Expo Go** from the App Store or Google Play.
2. On a computer with Node 24 (get the LTS installer from [nodejs.org](https://nodejs.org)):
   ```bash
   npm install
   npm start
   ```
3. Scan the QR code in the terminal with your phone camera (iPhone) or the Expo Go app (Android).

On an empty phone book, tap **Try it with example people** to load a small sample network.

## What's in the prototype

- **People**: search by name, place or year, and filter by life area.
- **Person**: details, life areas, where and when you met, who they know, who introduced you, and their *connections of connections*.
- **Add / edit**: only a name is required. Dates can be approximate (`2019`, `2019-06` or `2019-06-14`).
- **Life areas**: your own colour-coded tags such as University, Work or Family.
- **Connections**:
  - the chain of people linking any two people
  - *bridges*: links between people from different parts of your life
  - *might they know each other?*: people you met in the same place within six months who aren't linked yet
  - most connected people, and who opened up the most of your network through introductions

## Code layout

| Path | What |
|---|---|
| `src/app/` | Screens (Expo Router; each file is a route) |
| `src/db/` | SQLite schema, queries and sample data |
| `src/lib/graph.ts` | Connection finding: mutuals, connections of connections, shortest path, bridges, suggestions |
| `src/components/` | Shared UI pieces |

## Checks

```bash
npm test           # connection-finding logic
npm run typecheck  # TypeScript
```
