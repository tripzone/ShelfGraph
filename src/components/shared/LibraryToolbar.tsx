import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { useProfile } from '../../hooks/useProfile'
import {
  claimUsername,
  isUsernameAvailable,
  setProfilePublic,
  toUsernameLower,
} from '../../firebase/profile'
import { signOutUser } from '../../firebase/auth'
import type { GridSize } from '../../hooks/useGridSize'
import type { BookFormat } from '../../types/book'

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/

export type SortMode = 'custom' | 'title' | 'date' | 'genre'
export type SortDirection = 'asc' | 'desc'

const BASE_SORT_LABELS: Record<SortMode, string> = {
  custom: 'Custom',
  title: 'Title',
  date: 'Date Finished',
  genre: 'Genre',
}

const FORMAT_LABELS: Record<BookFormat, string> = {
  physical: 'Physical',
  ebook: 'Ebook',
  audio: 'Audio',
}

const GRID_SIZE_LABELS: Record<GridSize, string> = {
  xs: 'XS',
  s: 'S',
  m: 'M',
  l: 'L',
}

const FORMATS = Object.keys(FORMAT_LABELS) as BookFormat[]
const SORT_MODES = Object.keys(BASE_SORT_LABELS) as SortMode[]
const GRID_SIZES = Object.keys(GRID_SIZE_LABELS) as GridSize[]

function SortIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4v12M6 4 3 7M6 4l3 3M14 16V4m0 12 3-3m-3 3-3-3" />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4.5h14l-5 6.2V16l-4 2v-7.3z" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.5 11.2A7.3 7.3 0 0 1 8.8 2.5a7.3 7.3 0 1 0 8.7 8.7z" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

interface LibraryToolbarProps {
  sortMode: SortMode
  sortDirection: SortDirection
  onSortModeChange: (mode: SortMode) => void
  /** Label for the 'date' sort mode — what "date" means differs by tab (finished vs. added). */
  dateSortLabel?: string
  /** Label for the 'custom' sort mode — e.g. "Ranked" for the To-Read queue. */
  customSortLabel?: string
  /** Which sort modes to offer, and in what order. Defaults to all four. */
  sortModes?: SortMode[]
  genres: string[]
  genreFilter: Set<string>
  onGenreFilterChange: (next: Set<string>) => void
  formatFilter: Set<BookFormat>
  onFormatFilterChange: (next: Set<BookFormat>) => void
  gridSize: GridSize
  onGridSizeChange: (size: GridSize) => void
  reorderMode: boolean
  onExitReorderMode: () => void
  /** The signed-in owner's own uid — shows the Account section (owner view only). */
  uid?: string
  /** Current value of this tab's "show page count" preference. */
  pageCountEnabled?: boolean
  /** Provided only for the owner (undefined in read-only/visitor view) — shows the toggle. */
  onPageCountEnabledChange?: (enabled: boolean) => void
}

export function LibraryToolbar({
  sortMode,
  sortDirection,
  onSortModeChange,
  dateSortLabel,
  customSortLabel,
  sortModes = SORT_MODES,
  genres,
  genreFilter,
  onGenreFilterChange,
  formatFilter,
  onFormatFilterChange,
  gridSize,
  onGridSizeChange,
  reorderMode,
  onExitReorderMode,
  uid,
  pageCountEnabled,
  onPageCountEnabledChange,
}: LibraryToolbarProps) {
  const [openMenu, setOpenMenu] = useState<'sort' | 'filter' | 'settings' | 'profile' | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { theme, setTheme } = useTheme()
  const sortLabels = {
    ...BASE_SORT_LABELS,
    ...(dateSortLabel ? { date: dateSortLabel } : null),
    ...(customSortLabel ? { custom: customSortLabel } : null),
  }

  const { profile } = useProfile(uid)
  const [usernameInput, setUsernameInput] = useState('')
  const [usernameSeeded, setUsernameSeeded] = useState(false)
  const [checking, setChecking] = useState(false)
  const [availability, setAvailability] = useState<'available' | 'taken' | 'invalid' | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Seed the input once the profile has actually loaded, and only once —
  // further edits are the user's own typing, not the live doc.
  useEffect(() => {
    if (!usernameSeeded && profile.username != null) {
      setUsernameInput(profile.username)
      setUsernameSeeded(true)
    }
  }, [usernameSeeded, profile.username])

  useEffect(() => {
    if (!uid) return
    const trimmed = usernameInput.trim()
    if (!trimmed || trimmed === profile.username) {
      setAvailability(null)
      return
    }
    const lower = toUsernameLower(trimmed)
    if (!USERNAME_PATTERN.test(lower)) {
      setAvailability('invalid')
      return
    }
    setChecking(true)
    const timer = setTimeout(async () => {
      try {
        const available = await isUsernameAvailable(lower, uid)
        setAvailability(available ? 'available' : 'taken')
      } finally {
        setChecking(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [usernameInput, uid, profile.username])

  async function handleSaveUsername() {
    if (!uid) return
    const trimmed = usernameInput.trim()
    if (!trimmed || availability !== 'available') return
    setSaving(true)
    setSaveError(null)
    try {
      await claimUsername(uid, trimmed, profile.usernameLower)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save that username.')
    } finally {
      setSaving(false)
    }
  }

  async function handleTogglePublic() {
    if (!uid) return
    await setProfilePublic(uid, !profile.isPublic)
  }

  const canSaveUsername =
    usernameInput.trim().length > 0 &&
    usernameInput.trim() !== profile.username &&
    availability === 'available'

  if (reorderMode) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-1">
        <p className="text-xs text-muted">Drag covers to reorder</p>
        <button
          type="button"
          onClick={onExitReorderMode}
          className="rounded-full border border-hairline px-3 py-1 text-xs font-semibold text-ink"
        >
          Done
        </button>
      </div>
    )
  }

  function toggleGenre(genre: string) {
    const next = new Set(genreFilter)
    if (next.has(genre)) next.delete(genre)
    else next.add(genre)
    onGenreFilterChange(next)
  }

  function toggleFormat(format: BookFormat) {
    const next = new Set(formatFilter)
    if (next.has(format)) next.delete(format)
    else next.add(format)
    onFormatFilterChange(next)
  }

  const filterCount = genreFilter.size + formatFilter.size

  return (
    <div ref={containerRef} className="relative mx-auto flex max-w-3xl items-center gap-1 px-4 py-1">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenMenu((m) => (m === 'sort' ? null : 'sort'))}
          aria-label={`Sort: ${sortLabels[sortMode]}${
            sortMode !== 'custom' ? (sortDirection === 'asc' ? ' ascending' : ' descending') : ''
          }`}
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-ink"
        >
          <SortIcon />
        </button>
        {openMenu === 'sort' && (
          <div className="absolute left-0 top-full z-30 mt-1 w-40 rounded-lg border border-hairline bg-surface py-1 shadow-lg">
            {sortModes.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  onSortModeChange(mode)
                  setOpenMenu(null)
                }}
                className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-canvas ${
                  mode === sortMode ? 'font-semibold text-ink' : 'text-ink/80'
                }`}
              >
                {sortLabels[mode]}
                {mode === sortMode && mode !== 'custom' && (
                  <span aria-hidden="true" className="text-xs text-muted">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenMenu((m) => (m === 'filter' ? null : 'filter'))}
          aria-label={`Filter${filterCount > 0 ? ` (${filterCount} active)` : ''}`}
          className="relative flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-ink"
        >
          <FilterIcon />
          {filterCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-ink text-[9px] font-semibold text-ink-inverse">
              {filterCount}
            </span>
          )}
        </button>
        {openMenu === 'filter' && (
          <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-lg border border-hairline bg-surface p-3 shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Format</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {FORMATS.map((format) => (
                <button
                  key={format}
                  type="button"
                  onClick={() => toggleFormat(format)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                    formatFilter.has(format)
                      ? 'border-ink bg-ink text-ink-inverse'
                      : 'border-hairline text-ink'
                  }`}
                >
                  {FORMAT_LABELS[format]}
                </button>
              ))}
            </div>

            {genres.length > 0 && (
              <>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  Genre
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {genres.map((genre) => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => toggleGenre(genre)}
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                        genreFilter.has(genre)
                          ? 'border-ink bg-ink text-ink-inverse'
                          : 'border-hairline text-ink'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </>
            )}

            {filterCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  onGenreFilterChange(new Set())
                  onFormatFilterChange(new Set())
                }}
                className="mt-3 text-xs font-medium text-muted underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenMenu((m) => (m === 'settings' ? null : 'settings'))}
          aria-label="Settings"
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-ink"
        >
          <SettingsIcon />
        </button>
        {openMenu === 'settings' && (
          <div className="absolute left-0 top-full z-30 mt-1 w-48 rounded-lg border border-hairline bg-surface py-1 shadow-lg">
            <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Appearance
            </p>
            <div className="flex gap-1.5 px-3 pb-1.5 pt-0.5">
              {(['light', 'dark'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setTheme(mode)
                    setOpenMenu(null)
                  }}
                  aria-label={mode === 'dark' ? 'Dark mode' : 'Light mode'}
                  className={`flex flex-1 items-center justify-center rounded-full border py-1.5 ${
                    mode === theme
                      ? 'border-ink bg-ink text-ink-inverse'
                      : 'border-hairline text-ink'
                  }`}
                >
                  {mode === 'dark' ? <MoonIcon /> : <SunIcon />}
                </button>
              ))}
            </div>

            <div className="my-1 border-t border-hairline" />

            <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Grid Size
            </p>
            <div className="flex gap-1.5 px-3 pb-1.5 pt-0.5">
              {GRID_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    onGridSizeChange(size)
                    setOpenMenu(null)
                  }}
                  className={`flex-1 rounded-full border py-1 text-xs font-medium ${
                    size === gridSize
                      ? 'border-ink bg-ink text-ink-inverse'
                      : 'border-hairline text-ink'
                  }`}
                >
                  {GRID_SIZE_LABELS[size]}
                </button>
              ))}
            </div>

            {onPageCountEnabledChange && (
              <>
                <div className="my-1 border-t border-hairline" />
                <div className="flex items-center justify-between px-3 py-1.5">
                  <span className="text-xs font-medium text-ink">Show page count</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={pageCountEnabled}
                    onClick={() => onPageCountEnabledChange(!pageCountEnabled)}
                    className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                      pageCountEnabled ? 'bg-accent' : 'bg-hairline'
                    }`}
                  >
                    <span
                      className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        pageCountEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1">
        {uid && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu((m) => (m === 'profile' ? null : 'profile'))}
              aria-label="Profile"
              className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-hairline ring-1 ring-hairline transition-opacity hover:opacity-80"
            >
              {profile.photoURL && (
                <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
              )}
            </button>
            {openMenu === 'profile' && (
              <div className="absolute right-0 top-full z-30 mt-1 w-64 rounded-lg border border-hairline bg-surface py-1 shadow-lg">
                <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
                  Username
                </p>
                <div className="px-3 pb-1.5 pt-0.5">
                  <div className="flex gap-1.5">
                    <input
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="pick a username"
                      className="w-full rounded-md border border-hairline bg-canvas px-2 py-1 text-xs text-ink placeholder:text-muted focus:border-ink focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => void handleSaveUsername()}
                      disabled={!canSaveUsername || saving}
                      className="shrink-0 rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-ink-inverse disabled:opacity-40"
                    >
                      {saving ? '…' : saved ? '✓' : 'Save'}
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-muted">
                    {checking && 'Checking…'}
                    {!checking && availability === 'available' && (
                      <span className="text-accent">Available</span>
                    )}
                    {!checking && availability === 'taken' && (
                      <span className="text-red-600 dark:text-red-400">Already taken</span>
                    )}
                    {!checking && availability === 'invalid' && (
                      <span className="text-red-600 dark:text-red-400">
                        Lowercase letters, numbers, underscore; 3-20 chars
                      </span>
                    )}
                    {saveError && <span className="text-red-600 dark:text-red-400">{saveError}</span>}
                  </p>
                </div>

                <div className="my-1 border-t border-hairline" />

                <div className="flex items-center justify-between px-3 py-1.5">
                  <span className="text-xs font-medium text-ink">Public profile</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={profile.isPublic}
                    onClick={() => void handleTogglePublic()}
                    className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                      profile.isPublic ? 'bg-accent' : 'bg-hairline'
                    }`}
                  >
                    <span
                      className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        profile.isPublic ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                {profile.isPublic && profile.username && (
                  <p className="px-3 pb-1 text-[11px] text-muted">/u/{profile.username}</p>
                )}

                <div className="my-1 border-t border-hairline" />

                <button
                  type="button"
                  onClick={() => void signOutUser()}
                  className="block w-full px-3 py-1.5 text-left text-sm text-ink hover:bg-canvas"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
