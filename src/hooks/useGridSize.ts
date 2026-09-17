import { useState } from 'react'

export type GridSize = 'xs' | 's' | 'm' | 'l'
const STORAGE_KEY = 'gridSize'
const VALID_SIZES: GridSize[] = ['xs', 's', 'm', 'l']

function resolveInitialGridSize(): GridSize {
  const stored = localStorage.getItem(STORAGE_KEY)
  return (VALID_SIZES as string[]).includes(stored ?? '') ? (stored as GridSize) : 'm'
}

/** Read-grid tile density, persisted like the theme preference. */
export function useGridSize() {
  const [gridSize, setGridSizeState] = useState<GridSize>(resolveInitialGridSize)

  function setGridSize(next: GridSize) {
    localStorage.setItem(STORAGE_KEY, next)
    setGridSizeState(next)
  }

  return { gridSize, setGridSize }
}
