import { useEffect, useState } from 'react'
import { Link, Navigate, NavLink, Route, Routes, useParams } from 'react-router-dom'
import { ReadGrid } from '../read/ReadGrid'
import { QueueList } from '../toread/QueueList'
import { getPublicProfileByUsername, type PublicUser } from '../../firebase/profile'

type LoadState = 'loading' | 'not-found' | 'ready'

function BackHomeLink() {
  return (
    <Link
      to="/"
      aria-label="Back home"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-ink"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M19 12H5" />
        <path d="M12 19l-7-7 7-7" />
      </svg>
    </Link>
  )
}

function tabsFor(username: string) {
  return [
    { to: `/u/${username}/read`, label: 'Read' },
    { to: `/u/${username}/to-read`, label: 'To-Read' },
  ]
}

function PublicTabBar({ username }: { username: string }) {
  const tabs = tabsFor(username)
  return (
    <nav className="sticky top-0 z-20 border-b border-hairline bg-surface/95 backdrop-blur">
      <ul className="mx-auto flex max-w-3xl">
        {tabs.map((tab) => (
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
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-lg font-semibold text-ink">This profile isn't available</h1>
        <p className="text-sm text-muted">It may be private, or the username might not exist.</p>
        <Link to="/" className="mt-2 text-sm font-medium text-ink underline underline-offset-2">
          Back home
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
        <BackHomeLink />
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

      <PublicTabBar username={profile.username ?? username ?? ''} />

      <main className="pt-4">
        <Routes>
          <Route path="/" element={<Navigate to={`/u/${username}/read`} replace />} />
          <Route path="read" element={<ReadGrid uid={profile.uid} readOnly />} />
          <Route path="to-read" element={<QueueList uid={profile.uid} readOnly />} />
          <Route path="*" element={<Navigate to={`/u/${username}/read`} replace />} />
        </Routes>
      </main>
    </div>
  )
}
