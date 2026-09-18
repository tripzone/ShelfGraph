import { useMemo, useRef, useState } from 'react'
import type { BookFormat, UserBook } from '../../types/book'

type SeriesKey = BookFormat | 'unknown'

const SERIES: { key: SeriesKey; label: string; varName: string }[] = [
  { key: 'physical', label: 'Physical', varName: '--color-series-physical' },
  { key: 'ebook', label: 'Ebook', varName: '--color-series-ebook' },
  { key: 'audio', label: 'Audio', varName: '--color-series-audio' },
  { key: 'unknown', label: 'TBD', varName: '--color-series-unknown' },
]

const MIN_DATED_BOOKS = 2
const MIN_DATED_SHARE = 0.5

/** Only worth a timeline once most books actually carry a finished date. */
export function hasReadingActivityData(books: UserBook[]): boolean {
  if (books.length === 0) return false
  const dated = books.filter((b) => b.finishedYear != null).length
  return dated >= MIN_DATED_BOOKS && dated / books.length >= MIN_DATED_SHARE
}

const VIEW_W = 600
const VIEW_H = 64
const PAD_LEFT = 4
const PAD_RIGHT = 4
const PAD_TOP = 6
const PAD_BOTTOM = 16
const AXIS_Y = VIEW_H - PAD_BOTTOM

export function ReadingActivityChart({ books }: { books: UserBook[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { years, seriesData } = useMemo(() => {
    const dated = books.filter((b) => b.finishedYear != null)
    if (dated.length === 0) return { years: [] as number[], seriesData: null }

    const minYear = Math.min(...dated.map((b) => b.finishedYear!))
    const maxYear = Math.max(...dated.map((b) => b.finishedYear!))
    const yearsList = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i)

    const counts = new Map<number, Record<SeriesKey, number>>()
    for (const year of yearsList) {
      counts.set(year, { physical: 0, ebook: 0, audio: 0, unknown: 0 })
    }
    for (const book of dated) {
      const key: SeriesKey = book.format ?? 'unknown'
      counts.get(book.finishedYear!)![key]++
    }

    const data = SERIES.map((s) => ({
      ...s,
      values: yearsList.map((y) => counts.get(y)![s.key]),
    }))

    return { years: yearsList, seriesData: data }
  }, [books])

  if (!seriesData || years.length === 0) return null

  const yMax = Math.max(1, ...seriesData.flatMap((s) => s.values))
  const plotW = VIEW_W - PAD_LEFT - PAD_RIGHT
  const plotH = AXIS_Y - PAD_TOP

  function xFor(i: number) {
    return years.length === 1 ? PAD_LEFT + plotW / 2 : PAD_LEFT + (i / (years.length - 1)) * plotW
  }
  function yFor(value: number) {
    return PAD_TOP + plotH - (value / yMax) * plotH
  }

  function pathFor(values: number[]) {
    return values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(v)}`).join(' ')
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const fraction = (e.clientX - rect.left) / rect.width
    const idx = Math.round(fraction * (years.length - 1))
    setHoverIndex(Math.min(years.length - 1, Math.max(0, idx)))
  }

  const activeIndex = hoverIndex ?? years.length - 1

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <div
        ref={containerRef}
        className="relative min-w-0 flex-1"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="none" className="h-12 w-full">
          <line
            x1={PAD_LEFT}
            x2={VIEW_W - PAD_RIGHT}
            y1={AXIS_Y}
            y2={AXIS_Y}
            stroke="var(--color-hairline)"
            strokeWidth={1}
          />

          {years.map((year, i) => {
            if (years.length > 6 && i % Math.ceil(years.length / 6) !== 0 && i !== years.length - 1)
              return null
            return (
              <text
                key={year}
                x={xFor(i)}
                y={VIEW_H - 3}
                textAnchor="middle"
                className="fill-muted"
                style={{ fontSize: 10 }}
              >
                {year}
              </text>
            )
          })}

          {hoverIndex != null && (
            <line
              x1={xFor(hoverIndex)}
              x2={xFor(hoverIndex)}
              y1={PAD_TOP}
              y2={AXIS_Y}
              stroke="var(--color-muted)"
              strokeWidth={1}
              strokeDasharray="2,2"
            />
          )}

          {seriesData.map((s) => (
            <path
              key={s.key}
              d={pathFor(s.values)}
              fill="none"
              stroke={`var(${s.varName})`}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {seriesData.map((s) => (
            <g key={`${s.key}-dot`}>
              <circle
                cx={xFor(activeIndex)}
                cy={yFor(s.values[activeIndex])}
                r={4}
                fill="var(--color-surface)"
              />
              <circle
                cx={xFor(activeIndex)}
                cy={yFor(s.values[activeIndex])}
                r={3}
                fill={`var(${s.varName})`}
              />
            </g>
          ))}
        </svg>

        {hoverIndex != null && (
          <div className="pointer-events-none absolute inset-x-0 top-full z-10 flex justify-center">
            <div className="mt-1 rounded-lg border border-hairline bg-surface px-2.5 py-1.5 text-xs shadow-lg">
              <p className="font-semibold text-ink">{years[activeIndex]}</p>
              {seriesData.map((s) => (
                <p key={s.key} className="flex items-center gap-1.5 text-muted">
                  <span
                    className="inline-block h-[2px] w-3 shrink-0"
                    style={{ backgroundColor: `var(${s.varName})` }}
                  />
                  <span className="font-medium text-ink">{s.values[activeIndex]}</span>
                  {s.label}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-0.5">
        {seriesData.map((s) => (
          <span key={s.key} className="flex items-center gap-1 text-[10px] text-muted">
            <span
              className="inline-block h-[2px] w-2.5"
              style={{ backgroundColor: `var(${s.varName})` }}
            />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}
