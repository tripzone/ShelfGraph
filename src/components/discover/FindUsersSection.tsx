import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { searchPublicUsers, type PublicUser } from '../../firebase/profile'

export function FindUsersSection() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PublicUser[]>([])
  const [loading, setLoading] = useState(false)

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

  return (
    <section className="mx-auto max-w-3xl px-3 py-3 sm:px-4">
      <h2 className="px-1 text-sm font-semibold text-ink">Find Users</h2>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by username…"
        className="mt-2 w-full rounded-full border border-hairline bg-canvas px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
      />

      {loading && <p className="mt-3 px-1 text-sm text-muted">Searching…</p>}

      {!loading && query.trim() && results.length === 0 && (
        <p className="mt-3 px-1 text-sm text-muted">No public profiles match "{query.trim()}".</p>
      )}

      {results.length > 0 && (
        <ul className="mt-2 overflow-hidden rounded-xl border border-hairline">
          {results.map((user) => (
            <li key={user.uid} className="border-b border-hairline last:border-b-0">
              <Link
                to={`/u/${user.username}`}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-canvas"
              >
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-hairline">
                  {user.photoURL && (
                    <img src={user.photoURL} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">@{user.username}</p>
                  {user.displayName && (
                    <p className="truncate text-xs text-muted">{user.displayName}</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
