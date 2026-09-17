import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

export interface OwnProfile {
  username: string | null
  usernameLower: string | null
  isPublic: boolean
}

const EMPTY_PROFILE: OwnProfile = { username: null, usernameLower: null, isPublic: false }

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
      })
      setLoading(false)
    })
  }, [uid])

  return { profile, loading }
}
