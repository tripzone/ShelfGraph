import { useEffect } from 'react'
import { useUiStore } from '../../store/uiStore'

export function ToastHost() {
  const toasts = useUiStore((s) => s.toasts)
  const dismissToast = useUiStore((s) => s.dismissToast)

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 sm:bottom-6">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} id={toast.id} message={toast.message} onDismiss={dismissToast} />
      ))}
    </div>
  )
}

function ToastItem({
  id,
  message,
  onDismiss,
}: {
  id: number
  message: string
  onDismiss: (id: number) => void
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), 2400)
    return () => clearTimeout(timer)
  }, [id, onDismiss])

  return (
    <div className="pointer-events-auto animate-[fade-in_150ms_ease-out] rounded-full bg-ink px-4 py-2 text-sm font-medium text-ink-inverse shadow-lg">
      {message}
    </div>
  )
}
