/** Shared by the app scope (main.tsx) and the session scope (_authenticated.tsx). */
export function ErrorScreen({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div className="flex h-full flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-full bg-red-50 text-lg text-red-600">
          !
        </div>
        <h1 className="text-lg font-semibold text-slate-900">Something went wrong</h1>
        <p className="mt-2 font-mono text-sm break-words text-slate-500">
          {error instanceof Error ? error.message : String(error)}
        </p>
        <button
          onClick={onRetry}
          className="mt-6 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark"
        >
          Retry
        </button>
      </div>
    </div>
  )
}
