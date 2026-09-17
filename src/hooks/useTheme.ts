import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
const STORAGE_KEY = 'theme'

function resolveInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return 'dark'
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

/** Manual light/dark override, persisted, defaulting to dark for first-time visitors. */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(resolveInitialTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  function setTheme(next: Theme) {
    localStorage.setItem(STORAGE_KEY, next)
    setThemeState(next)
  }

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return { theme, setTheme, toggleTheme }
}
