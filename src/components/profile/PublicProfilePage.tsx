import { useEffect, useState } from 'react'
import { Navigate, NavLink, Route, Routes, useParams } from 'react-router-dom'
import { ReadGrid } from '../read/ReadGrid'
import { QueueList } from '../toread/QueueList'
import { getPublicProfileByUsername, type PublicUser } from '../../firebase/profile'

type LoadState = 'loading' | 'not-found' | 'ready'

const TABS = [
  { to: 'read', label: 'Read' },
  { to: 'to-read', label: 'To-Read' },
]

function PublicTabBar() {
  return (
    <nav className="sticky top-0 z-20 border-b border-hairline bg-surface/95 backdrop-blur">
      <ul className="mx-auto flex max-w-3xl">
        {TABS.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              className={({ isActive }) =>
                `block px-2 py-3 text-center text-[13px] font-medium tracking-wide transition-colors ${
                  isActive ? 'text-ink' : 'text-muted'
                }`
              }
            >
              {({ isActive }) => (
                <span className="relative inline-block">
                  {tab.label}
                  {isActive && <span className="absolute -bottom-3 left-0 right-0 h-[2px] bg-ink" />}
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function PublicProfilePage() {
  const { username } = useParams<{ username: string }>()
  const [state, setState] = useState<LoadState>('loading')
  const [profile, setProfile] = useState<PublicUser | null>(null)

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
        <p className="text-sm text-muted">It may be private, or the username might not exist.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-hairline">
          {profile.photoURL && (
            <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div>
          <h1 className="text-base font-semibold text-ink">
            {profile.displayName ?? `@${profile.username}`}
          </h1>
          <p className="text-sm text-muted">@{profile.username}</p>
        </div>
      </div>

      <PublicTabBar />

      <main className="pt-4">
        <Routes>
          <Route path="/" element={<Navigate to="read" replace />} />
          <Route path="read" element={<ReadGrid uid={profile.uid} readOnly />} />
          <Route path="to-read" element={<QueueList uid={profile.uid} readOnly />} />
          <Route path="*" element={<Navigate to="read" replace />} />
        </Routes>
      </main>
    </div>
  )
}
