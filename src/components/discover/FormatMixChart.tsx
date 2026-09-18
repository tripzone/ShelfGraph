import { useMemo } from 'react'
import { FORMAT_ORDER, formatLabel } from '../shared/LibraryToolbar'
import type { BookFormat, UserBook } from '../../types/book'

type FormatKey = BookFormat | 'tbd'

/** Same series colors as the reading-activity chart, so a format means one color everywhere. */
const COLOR_VAR: Record<FormatKey, string> = {
  physical: '--color-series-physical',
  ebook: '--color-series-ebook',
  audio: '--color-series-audio',
  tbd: '--color-series-unknown',
}

export interface FormatSlice {
  key: FormatKey
  label: string
  count: number
  percent: number
  colorVar: string
}

/** Percentage of finished books in each format — physical, ebook, audio, and not-yet-set. */
export function useFormatMix(books: UserBook[]): FormatSlice[] {
  return useMemo(() => {
    const total = books.length
    if (total === 0) return []
    const counts = new Map<FormatKey, number>()
    for (const book of books) {
      const key: FormatKey = book.format ?? 'tbd'
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return FORMAT_ORDER.filter((key) => (counts.get(key) ?? 0) > 0).map((key) => {
      const count = counts.get(key) ?? 0
      return {
        key,
        label: formatLabel(key === 'tbd' ? null : key),
        count,
        percent: (count / total) * 100,
        colorVar: COLOR_VAR[key],
      }
    })
  }, [books])
}

/** One bar, split into a section per format — each section's width is that format's share of the whole. */
export function FormatMixBar({ slices }: { slices: FormatSlice[] }) {
  if (slices.length === 0) return null
  return (
    <div className="flex h-6 w-full overflow-hidden rounded-full bg-hairline">
      {slices.map((slice, i) => (
        <div
          key={slice.key}
          style={{
            width: `${slice.percent}%`,
            backgroundColor: `var(${slice.colorVar})`,
            borderRight: i < slices.length - 1 ? '2px solid var(--color-surface)' : undefined,
          }}
          className="flex items-center justify-center overflow-hidden px-1"
        >
          {/* Below ~8% there's no room for even the number; below ~20% there's room for the
              number but not the label — drop pieces in that order as the section narrows. */}
          {slice.percent >= 8 && (
            <span className="truncate whitespace-nowrap text-[10px] font-semibold leading-none text-white">
              {slice.percent >= 20 ? `${slice.label} ` : ''}
              {Math.round(slice.percent)}%
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
