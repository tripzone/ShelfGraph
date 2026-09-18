import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

export interface OwnProfile {
  username: string | null
  usernameLower: string | null
  isPublic: boolean
  photoURL: string | null
  /** Read tab: show each cover's page-count density line. Off by default. */
  showPageCountRead: boolean
  /** To-Read tab: show each cover's page-count density bar. On by default. */
  showPageCountToRead: boolean
}

const EMPTY_PROFILE: OwnProfile = {
  username: null,
  usernameLower: null,
  isPublic: false,
  photoURL: null,
  showPageCountRead: false,
  showPageCountToRead: true,
}

/**
 * Live view of a profile's fields (username, public/private, display prefs). `uid` is
 * whichever shelf is being shown — the signed-in user's own uid on their own tabs, or
 * another user's uid while viewing their public profile — so this doubles as the way
 * a visitor picks up that owner's display preferences (e.g. showPageCountRead).
 */
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
        showPageCountRead: data?.showPageCountRead ?? false,
        showPageCountToRead: data?.showPageCountToRead ?? true,
      })
      setLoading(false)
    })
  }, [uid])

  return { profile, loading }
}
