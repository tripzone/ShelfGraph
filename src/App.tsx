import { Navigate, Route, Routes } from 'react-router-dom'
import { SearchBar } from './components/layout/SearchBar'
import { TabBar } from './components/layout/TabBar'
import { SignInScreen } from './components/auth/SignInScreen'
import { ReadGrid } from './components/read/ReadGrid'
import { QueueList } from './components/toread/QueueList'
import { RecommendationGrid } from './components/recommendations/RecommendationGrid'
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
  return <AuthenticatedApp />
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
        <SearchBar uid={user.uid} />
      </header>

      <TabBar />

      <main className="pt-4">
        <Routes>
          <Route path="/" element={<Navigate to="/read" replace />} />
          <Route path="/read" element={<ReadGrid uid={user.uid} />} />
          <Route path="/to-read" element={<QueueList uid={user.uid} />} />
          <Route path="/discover" element={<RecommendationGrid uid={user.uid} />} />
          <Route path="*" element={<Navigate to="/read" replace />} />
        </Routes>
      </main>

      <BottomSheet uid={user.uid} />
      <ToastHost />
    </div>
  )
}
