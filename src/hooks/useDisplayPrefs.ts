import { useState } from 'react'

/**
 * Cover display preferences. Each toggle is split into an "Own" and "Other" variant
 * because the sensible default differs depending on whether you're looking at your own
 * shelf or a visitor is looking at someone else's — e.g. you don't need your own page
 * counts, but a visitor browsing your Read tab probably wants to see your ratings. Once
 * the viewer changes a toggle, that choice persists (per device) independent of the
 * default — it's never stored against the profile being viewed.
 */
export interface DisplayPrefs {
  /** Read tab, own shelf: page-count icon/number + density line. Off by default. */
  showPageCountReadOwn: boolean
  /** Read tab, someone else's shelf: page-count icon/number + density line. Off by default. */
  showPageCountReadOther: boolean
  /** Read tab, own shelf: star-rating row. Off by default. */
  showStarRatingReadOwn: boolean
  /** Read tab, someone else's shelf: star-rating row. On by default. */
  showStarRatingReadOther: boolean
  /** Read tab, someone else's shelf: AI relevancy-match row. Off by default. */
  showRelevancyReadOther: boolean
  /** To-Read tab, own queue: page-count icon/number + density bar. On by default. */
  showPageCountToReadOwn: boolean
  /** To-Read tab, someone else's queue: page-count icon/number + density bar. Off by default. */
  showPageCountToReadOther: boolean
  /** To-Read tab, own queue: AI relevancy-match row. On by default. */
  showRelevancyToReadOwn: boolean
  /** To-Read tab, someone else's queue: AI relevancy-match row. Off by default. */
  showRelevancyToReadOther: boolean
}

const STORAGE_KEY = 'displayPrefs'

const DEFAULT_PREFS: DisplayPrefs = {
  showPageCountReadOwn: false,
  showPageCountReadOther: false,
  showStarRatingReadOwn: false,
  showStarRatingReadOther: true,
  showRelevancyReadOther: false,
  showPageCountToReadOwn: true,
  showPageCountToReadOther: false,
  showRelevancyToReadOwn: true,
  showRelevancyToReadOther: false,
}

function resolveInitialPrefs(): DisplayPrefs {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_PREFS
    return { ...DEFAULT_PREFS, ...JSON.parse(stored) }
  } catch {
    return DEFAULT_PREFS
  }
}

/**
 * Per-device cover display preferences. These are the viewer's own choices about what
 * to see, so they apply the same regardless of who's signed in — never stored against
 * the profile being looked at.
 */
export function useDisplayPrefs() {
  const [prefs, setPrefsState] = useState<DisplayPrefs>(resolveInitialPrefs)

  function setPref<K extends keyof DisplayPrefs>(key: K, value: DisplayPrefs[K]) {
    setPrefsState((prev) => {
      const next = { ...prev, [key]: value }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  return { prefs, setPref }
}
