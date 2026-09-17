import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CoverTile } from '../read/CoverTile'
import { getPublicProfileByUsername, type PublicUser } from '../../firebase/profile'
import { subscribeToBooksByStatus } from '../../firebase/firestore'
import type { UserBook } from '../../types/book'

type LoadState = 'loading' | 'not-found' | 'ready'

export function PublicProfilePage() {
  const { username } = useParams<{ username: string }>()
  const [state, setState] = useState<LoadState>('loading')
  const [profile, setProfile] = useState<PublicUser | null>(null)
  const [readBooks, setReadBooks] = useState<UserBook[]>([])
  const [toReadBooks, setToReadBooks] = useState<UserBook[]>([])

  useEffect(() => {
    let cancelled = false
    setState('loading')
    setProfile(null)

    if (!username) {
      setState('not-found')
      return
    }

    getPublicProfileByUsername(username).then((found) => {
      if (cancelled) return
      if (!found) {
        setState('not-found')
        return
      }
      setProfile(found)
      setState('ready')
    })

    return () => {
      cancelled = true
    }
  }, [username])

  useEffect(() => {
    if (!profile) return
    const unsubRead = subscribeToBooksByStatus(profile.uid, 'read', setReadBooks)
    const unsubToRead = subscribeToBooksByStatus(profile.uid, 'to-read', setToReadBooks)
    return () => {
      unsubRead()
      unsubToRead()
    }
  }, [profile])

  if (state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted">
        Loading…
      </div>
    )
  }

  if (state === 'not-found' || !profile) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-2 px-6 text-center">
        <h1 className="text-lg font-semibold text-ink">This profile isn't available</h1>
        <p className="text-sm text-muted">
          It may be private, or the username might not exist.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-hairline">
          {profile.photoURL && (
            <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div>
          <h1 className="text-lg font-semibold text-ink">
            {profile.displayName ?? `@${profile.username}`}
          </h1>
          <p className="text-sm text-muted">@{profile.username}</p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-ink">Read ({readBooks.length})</h2>
        {readBooks.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nothing here yet.</p>
        ) : (
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
            {readBooks.map((book) => (
              <CoverTile key={book.googleVolumeId} book={book} onClick={() => {}} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-ink">To-Read ({toReadBooks.length})</h2>
        {toReadBooks.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nothing here yet.</p>
        ) : (
          <ul className="mt-3 overflow-hidden rounded-xl border border-hairline">
            {toReadBooks.map((book) => (
              <li
                key={book.googleVolumeId}
                className="flex items-center gap-3 border-b border-hairline px-3 py-2 last:border-b-0"
              >
                <div className="h-12 w-8 shrink-0 overflow-hidden rounded bg-hairline">
                  {book.coverUrl && (
                    <img src={book.coverUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <span className="min-w-0 flex-1 truncate text-sm text-ink">{book.title}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
