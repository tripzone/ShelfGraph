#!/usr/bin/env node
// Seeds 10 mock books into the Firestore emulator for local dev.
// Usage: FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/seed-emulator.mjs <uid>
import { initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'

const uid = process.argv[2]
if (!uid) {
  console.error('Usage: node scripts/seed-emulator.mjs <uid>')
  process.exit(1)
}
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error('Set FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 (run alongside `firebase emulators:start`)')
  process.exit(1)
}

initializeApp({ projectId: 'shelfgraph-dev' })
const db = getFirestore()

const MOCK_BOOKS = [
  { googleVolumeId: 'mock-dune', title: 'Dune', authors: ['Frank Herbert'], coverUrl: 'https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg', pageCount: 412, categories: ['Science Fiction'], description: 'Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides.', publisher: 'Ace Books', publishedDate: '1965-08-01', isbn: '9780441172719' },
  { googleVolumeId: 'mock-project-hail-mary', title: 'Project Hail Mary', authors: ['Andy Weir'], coverUrl: 'https://covers.openlibrary.org/b/isbn/9780593135204-L.jpg', pageCount: 476, categories: ['Science Fiction'], description: 'A lone astronaut must save the earth from disaster.', publisher: 'Ballantine Books', publishedDate: '2021-05-04', isbn: '9780593135204' },
  { googleVolumeId: 'mock-piranesi', title: 'Piranesi', authors: ['Susanna Clarke'], coverUrl: 'https://covers.openlibrary.org/b/isbn/9781635575637-L.jpg', pageCount: 245, categories: ['Fantasy'], description: 'Piranesi lives in the House. Perhaps he always has.', publisher: 'Bloomsbury', publishedDate: '2020-09-15', isbn: '9781635575637' },
  { googleVolumeId: 'mock-the-fifth-season', title: 'The Fifth Season', authors: ['N.K. Jemisin'], coverUrl: 'https://covers.openlibrary.org/b/isbn/9780316229296-L.jpg', pageCount: 468, categories: ['Fantasy'], description: 'This is the way the world ends, for the last time.', publisher: 'Orbit', publishedDate: '2015-08-04', isbn: '9780316229296' },
  { googleVolumeId: 'mock-educated', title: 'Educated', authors: ['Tara Westover'], coverUrl: 'https://covers.openlibrary.org/b/isbn/9780399590504-L.jpg', pageCount: 334, categories: ['Memoir'], description: 'An unforgettable memoir about a young woman kept out of school.', publisher: 'Random House', publishedDate: '2018-02-20', isbn: '9780399590504' },
  { googleVolumeId: 'mock-sapiens', title: 'Sapiens: A Brief History of Humankind', authors: ['Yuval Noah Harari'], coverUrl: 'https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg', pageCount: 443, categories: ['Nonfiction'], description: 'A groundbreaking narrative of humanity’s creation and evolution.', publisher: 'Harper', publishedDate: '2015-02-10', isbn: '9780062316097' },
  { googleVolumeId: 'mock-the-song-of-achilles', title: 'The Song of Achilles', authors: ['Madeline Miller'], coverUrl: 'https://covers.openlibrary.org/b/isbn/9780062060624-L.jpg', pageCount: 416, categories: ['Historical Fiction'], description: 'A tale of gods, kings, immortal fame, and the human heart.', publisher: 'Ecco', publishedDate: '2012-03-06', isbn: '9780062060624' },
  { googleVolumeId: 'mock-klara-and-the-sun', title: 'Klara and the Sun', authors: ['Kazuo Ishiguro'], coverUrl: 'https://covers.openlibrary.org/b/isbn/9780571364886-L.jpg', pageCount: 303, categories: ['Science Fiction'], description: 'A thrilling book about our changing world seen through an unforgettable narrator.', publisher: 'Faber & Faber', publishedDate: '2021-03-02', isbn: '9780571364886' },
  { googleVolumeId: 'mock-the-midnight-library', title: 'The Midnight Library', authors: ['Matt Haig'], coverUrl: 'https://covers.openlibrary.org/b/isbn/9780525559474-L.jpg', pageCount: 304, categories: ['Fiction'], description: 'Between life and death there is a library.', publisher: 'Viking', publishedDate: '2020-08-13', isbn: '9780525559474' },
  { googleVolumeId: 'mock-atomic-habits', title: 'Atomic Habits', authors: ['James Clear'], coverUrl: 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg', pageCount: 320, categories: ['Self-Help'], description: 'A proven framework for improving every day.', publisher: 'Avery', publishedDate: '2018-10-16', isbn: '9780735211292' },
]

const batch = db.batch()
MOCK_BOOKS.forEach((book, index) => {
  const status = index < 6 ? 'read' : 'to-read'
  const ref = db.doc(`users/${uid}/books/${book.googleVolumeId}`)
  batch.set(ref, {
    ...book,
    status,
    rating: status === 'read' ? Math.ceil(Math.random() * 5) : null,
    dateFinished: status === 'read' ? FieldValue.serverTimestamp() : null,
    order: index,
    propensityScore: null,
    propensityRationale: null,
    addedAt: FieldValue.serverTimestamp(),
  })
})

await batch.commit()
console.log(`Seeded ${MOCK_BOOKS.length} books for uid ${uid}`)
