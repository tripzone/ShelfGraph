import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

export interface OwnProfile {
  username: string | null
  usernameLower: string | null
  isPublic: boolean
  photoURL: string | null
  /** Last sort mode/direction chosen on the Read tab — synced across devices. */
  readSortMode: string | null
  readSortDirection: 'asc' | 'desc'
  /** Last sort mode/direction chosen on the To-Read tab — synced across devices. */
  toReadSortMode: string | null
  toReadSortDirection: 'asc' | 'desc'
}

const EMPTY_PROFILE: OwnProfile = {
  username: null,
  usernameLower: null,
  isPublic: false,
  photoURL: null,
  readSortMode: null,
  readSortDirection: 'asc',
  toReadSortMode: null,
  toReadSortDirection: 'asc',
}

/** Live view of the signed-in user's own profile fields (username, public/private). */
export function useProfile(uid: string | undefined) {
  const [profile, setProfile] = useState<OwnProfile>(EMPTY_PROFILE)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setProfile(EMPTY_PROFILE)
      setLoading(false)
      return
    }
    setLoading(true)
    return onSnapshot(doc(db, 'users', uid), (snap) => {
      const data = snap.data()
      setProfile({
        username: data?.username ?? null,
        usernameLower: data?.usernameLower ?? null,
        isPublic: data?.isPublic ?? false,
        photoURL: data?.photoURL ?? null,
        readSortMode: data?.readSortMode ?? null,
        readSortDirection: data?.readSortDirection ?? 'asc',
        toReadSortMode: data?.toReadSortMode ?? null,
        toReadSortDirection: data?.toReadSortDirection ?? 'asc',
      })
      setLoading(false)
    })
  }, [uid])

  return { profile, loading }
}
