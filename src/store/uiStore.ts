import { create } from 'zustand'
import type { BookMetadata } from '../types/book'

export type BottomSheetStage = 'closed' | 'peek' | 'full'

interface Toast {
  id: number
  message: string
}

interface UiState {
  // Read/To-Read/Recommendations detail modal
  detailBookId: string | null
  openDetail: (volumeId: string) => void
  closeDetail: () => void

  // Global search ingestion bottom sheet
  sheetStage: BottomSheetStage
  sheetBook: BookMetadata | null
  openSheet: (book: BookMetadata) => void
  expandSheet: () => void
  collapseSheet: () => void
  closeSheet: () => void

  // Toasts
  toasts: Toast[]
  pushToast: (message: string) => void
  dismissToast: (id: number) => void
}

let toastCounter = 0

export const useUiStore = create<UiState>((set) => ({
  detailBookId: null,
  openDetail: (volumeId) => set({ detailBookId: volumeId }),
  closeDetail: () => set({ detailBookId: null }),

  sheetStage: 'closed',
  sheetBook: null,
  openSheet: (book) => set({ sheetStage: 'peek', sheetBook: book }),
  expandSheet: () => set({ sheetStage: 'full' }),
  collapseSheet: () => set({ sheetStage: 'peek' }),
  closeSheet: () => set({ sheetStage: 'closed', sheetBook: null }),

  toasts: [],
  pushToast: (message) =>
    set((state) => ({ toasts: [...state.toasts, { id: ++toastCounter, message }] })),
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))
