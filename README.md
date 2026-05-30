# Fit Quest

Offline-first fitness RPG PWA for local workout tracking, adventure battles, XP, profiles, and progress analytics.

Fit Quest runs fully in the browser as an installable PWA. It stores workouts, local profiles, settings, Train logs, Adventure progress, achievements, and XP in IndexedDB through Dexie.

## Repository Description

Offline-first fitness RPG PWA for local workout tracking, adventure battles, XP, profiles, and progress analytics.

## Tech Stack

- React, TypeScript, Vite
- Tailwind CSS
- Dexie.js / IndexedDB
- Zustand
- date-fns, Recharts
- vite-plugin-pwa
- Vitest, React Testing Library, fake-indexeddb
- Biome

## Local Development

```bash
npm install
npm run dev
```

The dev server runs at:

```text
http://localhost:5173
```

Production checks:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Preview a production build:

```bash
npm run preview
```

## Local Data Model

Fit Quest is local-first. There is no backend, login, cloud sync, admin dashboard, or cross-device account system yet.

The local Dexie database stores:

- `profiles`
- `settings`
- `trainLogs`
- `adventureProgress`
- `workouts`
- `workoutSets`
- `workoutCardioMetrics`
- `dailySummaries`
- `activities`
- `achievements`
- `userProgress`
- `heroProgress`
- Adventure content and events
- `appMeta`

Profiles are local to a single browser/device. Train and Progress data is scoped to the active local profile. Settings changes for language, theme, and display name are persisted locally and applied immediately.

## Local-Only Limitation

Because Fit Quest currently has no backend:

- Admins cannot see all users.
- Users cannot interact with each other.
- Data does not sync between devices or browsers.
- Clearing browser/site data can delete the local database.
- Cross-device sync requires a backend later.

The data layer is kept behind repositories so a future API sync layer can be added without spreading direct IndexedDB calls through screens.

## PWA Notes

The app uses `vite-plugin-pwa` with generated service worker assets. It is intended to work offline after the first successful load and can be installed from iOS Safari through Add to Home Screen.
