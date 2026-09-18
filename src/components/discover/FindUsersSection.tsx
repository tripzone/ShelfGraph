import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { pinUser, searchPublicUsers, unpinUser, type PublicUser } from '../../firebase/profile'
import { usePinnedUsers } from '../../hooks/usePinnedUsers'

function PinIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 17v5" />
      <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
    </svg>
  )
}

function UserRow({
  user,
  pinned,
  onTogglePin,
}: {
  user: PublicUser
  pinned: boolean
  onTogglePin: () => void
}) {
  return (
    <li className="flex items-center gap-1 border-b border-hairline pr-2 last:border-b-0">
      <Link
        to={`/u/${user.username}`}
        className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 hover:bg-canvas"
      >
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-hairline">
          {user.photoURL && <img src={user.photoURL} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">@{user.username}</p>
          {user.displayName && <p className="truncate text-xs text-muted">{user.displayName}</p>}
        </div>
      </Link>
      <button
        type="button"
        onClick={onTogglePin}
        aria-label={pinned ? 'Unpin' : 'Pin'}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
          pinned ? 'text-accent' : 'text-muted hover:text-ink'
        }`}
      >
        <PinIcon filled={pinned} />
      </button>
    </li>
  )
}

export function FindUsersSection({ uid }: { uid: string | undefined }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PublicUser[]>([])
  const [loading, setLoading] = useState(false)
  const { pinnedUsers } = usePinnedUsers(uid)
  const pinnedUids = useMemo(() => new Set(pinnedUsers.map((u) => u.uid)), [pinnedUsers])

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        setResults(await searchPublicUsers(trimmed))
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  async function togglePin(user: PublicUser) {
    if (!uid) return
    if (pinnedUids.has(user.uid)) {
      await unpinUser(uid, user.uid)
    } else {
      await pinUser(uid, user)
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-3 py-3 sm:px-4">
      <h2 className="px-1 text-sm font-semibold text-ink">Find Users</h2>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by username…"
        className="mt-2 w-full rounded-full border border-hairline bg-canvas px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
      />

      {!query.trim() && pinnedUsers.length > 0 && (
        <div className="mt-3">
          <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">Pinned</p>
          <ul className="mt-1.5 overflow-hidden rounded-xl border border-hairline">
            {pinnedUsers.map((user) => (
              <UserRow key={user.uid} user={user} pinned onTogglePin={() => togglePin(user)} />
            ))}
          </ul>
        </div>
      )}

      {loading && <p className="mt-3 px-1 text-sm text-muted">Searching…</p>}

      {!loading && query.trim() && results.length === 0 && (
        <p className="mt-3 px-1 text-sm text-muted">No public profiles match "{query.trim()}".</p>
      )}

      {results.length > 0 && (
        <ul className="mt-2 overflow-hidden rounded-xl border border-hairline">
          {results.map((user) => (
            <UserRow
              key={user.uid}
              user={user}
              pinned={pinnedUids.has(user.uid)}
              onTogglePin={() => togglePin(user)}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
