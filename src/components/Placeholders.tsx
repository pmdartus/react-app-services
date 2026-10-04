/**
 * Grey shapes standing in for screens (or parts of screens) that are about to load.
 * Routes declare theirs with `staticData.placeholder`; components use them as `<Suspense>` fallbacks.
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

export function SettingsPlaceholder() {
  return (
    <div className="flex-1">
      <div className="mx-auto max-w-2xl space-y-6 px-6 py-8">
        <Bar className="w-32" />
        <Bar className="h-6 w-28" />
        <div className="flex gap-6 border-b border-slate-200 pb-3">
          <Bar className="w-14" />
          <Bar className="w-20" />
        </div>
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index} className="flex justify-between px-5 py-5">
              <Bar className="w-20 bg-slate-100" />
              <Bar className="w-36" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
