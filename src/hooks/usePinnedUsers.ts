import { useEffect, useState } from 'react'
import { subscribeToPinnedUsers, type PinnedUser } from '../firebase/profile'

export function usePinnedUsers(uid: string | undefined) {
  const [pinnedUsers, setPinnedUsers] = useState<PinnedUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setPinnedUsers([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubscribe = subscribeToPinnedUsers(uid, (users) => {
      setPinnedUsers(users)
      setLoading(false)
    })
    return unsubscribe
  }, [uid])

  return { pinnedUsers, loading }
}
