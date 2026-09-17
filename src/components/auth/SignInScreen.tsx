import { signInWithGoogle } from '../../firebase/auth'

export function SignInScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">ShelfGraph</h1>
        <p className="mt-1 text-sm text-muted">
          A predictive reading tracker. Sign in to sync your shelf everywhere.
        </p>
      </div>
      <button
        onClick={() => signInWithGoogle()}
        className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white shadow-sm"
      >
        Continue with Google
      </button>
    </div>
  )
}
