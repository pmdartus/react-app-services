import { useNotifications } from '#/react/useNotifications'

const KIND_STYLES = {
  success: 'border-l-emerald-500',
  info: 'border-l-slate-400',
  error: 'border-l-red-500',
}

export function Toasts() {
  const { toasts, dismiss } = useNotifications()
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-80 flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`pointer-events-auto flex items-start justify-between gap-3 rounded-lg border border-l-4 border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-md ${KIND_STYLES[toast.kind]}`}
        >
          <span>{toast.message}</span>
          <button onClick={() => dismiss(toast.id)} className="text-slate-400 hover:text-slate-600" aria-label="Dismiss">
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
