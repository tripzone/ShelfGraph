import { useEffect, useState } from 'react'
import { useProfile } from '../../hooks/useProfile'
import { claimUsername, isUsernameAvailable, setProfilePublic, toUsernameLower } from '../../firebase/profile'
import { signOutUser } from '../../firebase/auth'
import { ReadGrid } from '../read/ReadGrid'
import { QueueList } from '../toread/QueueList'

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/

type PreviewTab = 'read' | 'to-read'

const PREVIEW_TABS: { id: PreviewTab; label: string }[] = [
  { id: 'read', label: 'Read' },
  { id: 'to-read', label: 'To-Read' },
]

export function SettingsPage({ uid }: { uid: string }) {
  const { profile, loading } = useProfile(uid)
  const [usernameInput, setUsernameInput] = useState('')
  const [checking, setChecking] = useState(false)
  const [availability, setAvailability] = useState<'available' | 'taken' | 'invalid' | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [previewTab, setPreviewTab] = useState<PreviewTab>('read')

  useEffect(() => {
    if (!loading) setUsernameInput(profile.username ?? '')
    // Only seed the field once the profile has actually loaded, and only once —
    // further edits are the user's own typing, not the live doc.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  useEffect(() => {
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
    await setProfilePublic(uid, !profile.isPublic)
  }

  const canSave =
    usernameInput.trim().length > 0 && usernameInput.trim() !== profile.username && availability === 'available'

  return (
    <div className="pb-24 pt-2">
      <div className="mx-auto max-w-md px-4">
      <h1 className="text-lg font-semibold text-ink">Settings</h1>

      <section className="mt-6">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted">Username</label>
        <div className="mt-1.5 flex gap-2">
          <input
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            placeholder="pick a username"
            className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
          />
          <button
            type="button"
            onClick={() => void handleSaveUsername()}
            disabled={!canSave || saving}
            className="shrink-0 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-ink-inverse disabled:opacity-40"
          >
            {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-muted">
          {checking && 'Checking availability…'}
          {!checking && availability === 'available' && (
            <span className="text-accent">Available</span>
          )}
          {!checking && availability === 'taken' && (
            <span className="text-red-600 dark:text-red-400">That username is taken.</span>
          )}
          {!checking && availability === 'invalid' && (
            <span className="text-red-600 dark:text-red-400">
              3-20 characters: lowercase letters, numbers, underscore only.
            </span>
          )}
          {!checking && availability === null && !saveError && 'This is how people find your profile.'}
          {saveError && <span className="text-red-600 dark:text-red-400">{saveError}</span>}
        </p>
      </section>

      <section className="mt-6 flex items-center justify-between border-t border-hairline pt-6">
        <div className="pr-4">
          <p className="text-sm font-medium text-ink">Public profile</p>
          <p className="mt-0.5 text-xs text-muted">
            When public, anyone with your profile link (or who finds you by username) can see your
            Read shelf and To-Read queue. Ratings stay visible; nothing else about your account is
            shared.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={profile.isPublic}
          onClick={() => void handleTogglePublic()}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
            profile.isPublic ? 'bg-accent' : 'bg-hairline'
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              profile.isPublic ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </section>

      {profile.isPublic && profile.username && (
        <p className="mt-3 text-xs text-muted">
          Your profile: <span className="font-medium text-ink">/u/{profile.username}</span>
        </p>
      )}

      <section className="mt-10 border-t border-hairline pt-6">
        <button
          type="button"
          onClick={() => void signOutUser()}
          className="rounded-full border border-hairline px-4 py-2 text-sm font-semibold text-ink"
        >
          Sign out
        </button>
      </section>
      </div>

      <div className="mt-10 border-t border-hairline pt-6">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-sm font-semibold text-ink">Your shelf</h2>
          <p className="mt-0.5 text-xs text-muted">
            A preview of what your Read and To-Read tabs look like to others.
          </p>
          <div className="mt-3 flex gap-4 border-b border-hairline">
            {PREVIEW_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPreviewTab(tab.id)}
                className={`relative pb-2 text-sm font-medium transition-colors ${
                  previewTab === tab.id ? 'text-ink' : 'text-muted'
                }`}
              >
                {tab.label}
                {previewTab === tab.id && (
                  <span className="absolute inset-x-0 -bottom-px h-[2px] bg-ink" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3">
          {previewTab === 'read' ? (
            <ReadGrid uid={uid} readOnly />
          ) : (
            <QueueList uid={uid} readOnly />
          )}
        </div>
      </div>
    </div>
  )
}
