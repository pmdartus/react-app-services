/**
 * Grey shapes standing in for screens (or parts of screens) that are about to load.
 * Routes use them as `pendingComponent` while their loader runs; components as `<Suspense>` fallbacks.
 */

function Bar({ className = '' }: { className?: string }) {
  return <div className={`h-3 animate-pulse rounded bg-slate-200 ${className}`} />
}

export function EncountersPlaceholder({ detail = false }: { detail?: boolean }) {
  return (
    <>
      <aside className="flex w-80 shrink-0 flex-col gap-1 border-r border-slate-200 bg-white px-2 pt-5">
        <Bar className="mx-3 mb-4 w-24" />
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="space-y-2.5 px-3 py-3">
            <Bar className="w-2/3" />
            <Bar className="w-1/2 bg-slate-100" />
          </div>
        ))}
      </aside>
      <section className="min-w-0 flex-1">{detail && <EncounterDetailPlaceholder />}</section>
    </>
  )
}

function EncounterDetailPlaceholder() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-10 py-8">
      <div className="space-y-3">
        <Bar className="h-6 w-56" />
        <Bar className="w-72 bg-slate-100" />
      </div>
      <div className="h-20 rounded-xl border border-slate-200 bg-white" />
      <NotePlaceholder />
    </div>
  )
}

export function NotePlaceholder() {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
      <Bar className="w-full" />
      <Bar className="w-11/12" />
      <Bar className="w-3/5" />
    </div>
  )
}
