import { useEffect, useRef, useState } from 'react'

interface GenreComboboxProps {
  value: string
  genres: string[]
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  inputClassName: string
}

/** A text field that also offers existing catalogue genres to pick from, or lets you type a new one. */
export function GenreCombobox({
  value,
  genres,
  onChange,
  placeholder,
  className,
  inputClassName,
}: GenreComboboxProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const trimmed = value.trim()
  const matches = genres.filter((g) => g.toLowerCase().includes(trimmed.toLowerCase()))
  const exactMatch = genres.some((g) => g.toLowerCase() === trimmed.toLowerCase())
  const showDropdown = open && (matches.length > 0 || (trimmed.length > 0 && !exactMatch))

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder ?? 'Genre'}
        className={inputClassName}
      />
      {showDropdown && (
        <div className="absolute left-0 top-full z-30 mt-1 max-h-48 w-max min-w-full overflow-y-auto rounded-lg border border-hairline bg-surface py-1 shadow-lg">
          {matches.map((genre) => (
            <button
              key={genre}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(genre)
                setOpen(false)
              }}
              className="block w-full truncate px-3 py-1.5 text-left text-sm text-ink hover:bg-canvas"
            >
              {genre}
            </button>
          ))}
          {trimmed.length > 0 && !exactMatch && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setOpen(false)}
              className="block w-full truncate px-3 py-1.5 text-left text-sm font-medium text-ink hover:bg-canvas"
            >
              + Create "{trimmed}"
            </button>
          )}
        </div>
      )}
    </div>
  )
}
