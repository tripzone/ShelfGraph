import {
  collection,
  doc,
  endAt,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  setDoc,
  startAt,
  where,
} from 'firebase/firestore'
import { db } from './config'

export interface PublicUser {
  uid: string
  username: string | null
  displayName: string | null
  photoURL: string | null
}

export function toUsernameLower(username: string): string {
  return username.trim().toLowerCase()
}

export async function isUsernameAvailable(usernameLower: string, uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'usernames', usernameLower))
  return !snap.exists() || snap.data().uid === uid
}

/** Atomically releases any previous claim, takes the new one, and updates the user doc. */
export async function claimUsername(
  uid: string,
  newUsername: string,
  previousUsernameLower: string | null,
): Promise<void> {
  const newLower = toUsernameLower(newUsername)
  if (!newLower) throw new Error('Username cannot be empty.')

  await runTransaction(db, async (tx) => {
    const newRef = doc(db, 'usernames', newLower)
    const newSnap = await tx.get(newRef)
    if (newSnap.exists() && newSnap.data().uid !== uid) {
      throw new Error('That username is already taken.')
    }
    if (previousUsernameLower && previousUsernameLower !== newLower) {
      tx.delete(doc(db, 'usernames', previousUsernameLower))
    }
    tx.set(newRef, { uid })
    tx.set(doc(db, 'users', uid), { username: newUsername.trim(), usernameLower: newLower }, { merge: true })
  })
}

export async function setProfilePublic(uid: string, isPublic: boolean): Promise<void> {
  await setDoc(doc(db, 'users', uid), { isPublic }, { merge: true })
}

export async function searchPublicUsers(prefixLower: string, max = 10): Promise<PublicUser[]> {
  const trimmed = prefixLower.trim().toLowerCase()
  if (!trimmed) return []

  const q = query(
    collection(db, 'users'),
    where('isPublic', '==', true),
    orderBy('usernameLower'),
    startAt(trimmed),
    endAt(trimmed + ''),
    limit(max),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      uid: d.id,
      username: data.username ?? null,
      displayName: data.displayName ?? null,
      photoURL: data.photoURL ?? null,
    }
  })
}

export async function getPublicProfileByUsername(username: string): Promise<PublicUser | null> {
  const lower = toUsernameLower(username)
  if (!lower) return null

  const lookup = await getDoc(doc(db, 'usernames', lower))
  if (!lookup.exists()) return null

  const uid = lookup.data().uid as string
  const userSnap = await getDoc(doc(db, 'users', uid))
  if (!userSnap.exists() || !userSnap.data().isPublic) return null

  const data = userSnap.data()
  return {
    uid,
    username: data.username ?? null,
    displayName: data.displayName ?? null,
    photoURL: data.photoURL ?? null,
  }
}
