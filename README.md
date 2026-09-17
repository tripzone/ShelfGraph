# ShelfGraph

A minimalist, data-dense reading tracker: an archive of books you've read, a
priority-sorted to-read queue, and recommendations — all synced across devices
via Firebase, with book data pulled from Google Books.

The propensity-scoring logic (how much you'll like a book) is intentionally a
placeholder right now — see [LLM scoring](#llm-scoring-not-yet-implemented) below.

## Stack

- **Frontend**: Vite + React + TypeScript, Tailwind CSS v4, React Router, Zustand, dnd-kit
- **Backend**: Firebase Auth (Google Sign-In), Firestore, Cloud Functions (Node/TS)
- **Book data**: Google Books API — searched directly from the client for latency, cached into Firestore on add

## One-time setup

### 1. Create the Firebase project

```
npx firebase login
npx firebase projects:create   # or use an existing project
npx firebase use --add         # link this directory to that project
```

In the [Firebase Console](https://console.firebase.google.com/) for that project:

- **Authentication** → Sign-in method → enable **Google**
- **Firestore Database** → create a database (production mode is fine; `firestore.rules` locks it down)
- **Project settings** → Your apps → add a **Web app** → copy the config values

### 2. Get a Google Books API key

In [Google Cloud Console](https://console.cloud.google.com/) (same or linked project):

- Enable the **Books API**
- Create an API key, then restrict it (Application restrictions → HTTP referrers) to your dev/prod domains — this key is used directly from the browser by design (see the search flow), so restricting it is what keeps it safe.

### 3. Configure environment variables

```
cp .env.example .env
```

Fill in the Firebase web app config and the Google Books API key from the steps above.

### 4. Install dependencies

```
npm install
cd functions && npm install && cd ..
```

## Running locally

```
npm run dev
```

This talks to your real Firebase project by default. To use the local emulators instead (recommended while iterating on Cloud Functions, so you don't need a deployed backend):

```
npm run emulators              # starts Auth + Firestore + Functions emulators
```

...and set `VITE_USE_FIREBASE_EMULATORS=true` in `.env` before `npm run dev`.

Optionally seed 10 mock books once you've signed in once and have a uid (visible in the emulator UI's Auth tab, or in your browser's Firebase Auth state):

```
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run seed -- <your-uid>
```

## Deploying

```
npm run build
firebase deploy
```

This deploys Hosting, Firestore rules/indexes, and Cloud Functions together.

## LLM scoring — not yet implemented

`functions/src/scoring/stubProvider.ts` returns a deterministic placeholder
score (based on genre overlap with your rated books) so the whole app — queue
badges, recommendation cards, the score-breakdown card in the detail modal —
works end-to-end today. When the real scoring design is ready, swap the
implementation used in `functions/src/index.ts` for a real `ScoreProvider`;
nothing in the frontend, Firestore schema, or the `scoreBook` /
`generateRecommendations` callable contracts needs to change.

## Project structure

```
src/
  firebase/       # Firebase SDK setup, auth helpers, Firestore CRUD, callable wrappers
  api/googleBooks.ts   # direct client-side Google Books search
  hooks/          # useAuth, useLibrary, useQueue, useRecommendations, useBookSearch, ...
  store/uiStore.ts     # zustand: detail modal, bottom sheet, toasts
  components/
    layout/       # TabBar, SearchBar
    read/         # Tab 1 — cover grid + detail modal
    toread/       # Tab 2 — draggable priority queue
    recommendations/  # Tab 3 — discovery grid
    search/       # Autocomplete dropdown, two-stage bottom sheet, toasts
    shared/       # DetailModal reused across all three tabs

functions/src/
  index.ts        # scoreBook, generateRecommendations callables
  scoring/        # ScoreProvider interface + placeholder implementation
  googleBooks.ts  # server-side Google Books search (candidate discovery)
```
