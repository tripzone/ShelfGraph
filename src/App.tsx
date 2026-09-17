import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { SearchBar } from './components/layout/SearchBar'
import { TabBar } from './components/layout/TabBar'
import { SignInScreen } from './components/auth/SignInScreen'
import { ReadGrid } from './components/read/ReadGrid'
import { QueueList } from './components/toread/QueueList'
import { DiscoverPage } from './components/discover/DiscoverPage'
import { StatsDetailPage } from './components/discover/StatsDetailPage'
import { SettingsPage } from './components/settings/SettingsPage'
import { PublicProfilePage } from './components/profile/PublicProfilePage'
import { BottomSheet } from './components/search/BottomSheet'
import { ToastHost } from './components/search/Toast'
import { useAuth } from './hooks/useAuth'
import { firebaseConfigured } from './firebase/config'

function SetupNotice() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-xl font-semibold text-ink">Connect Firebase to continue</h1>
      <p className="text-sm text-muted">
        Copy <code className="rounded bg-canvas px-1">.env.example</code> to{' '}
        <code className="rounded bg-canvas px-1">.env</code> and fill in your Firebase web app
        config and Google Books API key. See the README for setup steps.
      </p>
    </div>
  )
}

export default function App() {
  if (!firebaseConfigured) return <SetupNotice />
  return (
    <Routes>
      {/* Public profiles are viewable without signing in — this route must stay
          outside the auth gate below, which otherwise blocks every path. */}
      <Route path="/u/:username/*" element={<PublicProfilePage />} />
      <Route path="/*" element={<AuthenticatedApp />} />
    </Routes>
  )
}

function AuthenticatedApp() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted">Loading…</div>
  }

  if (!user) return <SignInScreen />

  return (
    <div className="min-h-screen pb-16 sm:pb-0">
      <header className="sticky top-0 z-40 border-b border-hairline bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
          <SearchBar uid={user.uid} />
          <Link
            to="/settings"
            aria-label="Settings"
            className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-hairline ring-1 ring-hairline transition-opacity hover:opacity-80"
          >
            {user.photoURL && (
              <img src={user.photoURL} alt="" className="h-full w-full object-cover" />
            )}
          </Link>
        </div>
      </header>

      <TabBar />

      <main className="pt-4">
        <Routes>
          <Route path="/" element={<Navigate to="/read" replace />} />
          <Route path="/read" element={<ReadGrid uid={user.uid} />} />
          <Route path="/to-read" element={<QueueList uid={user.uid} />} />
          <Route path="/discover" element={<DiscoverPage uid={user.uid} />} />
          <Route path="/discover/stats" element={<StatsDetailPage />} />
          <Route path="/settings" element={<SettingsPage uid={user.uid} />} />
          <Route path="*" element={<Navigate to="/read" replace />} />
        </Routes>
      </main>

      <BottomSheet uid={user.uid} />
      <ToastHost />
    </div>
  )
}
