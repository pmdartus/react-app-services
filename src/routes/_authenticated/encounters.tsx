import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { useEncounters } from '#/hooks/useEncounters'
import { StatusBadge } from '#/components/StatusBadge'
import { formatTime } from '#/components/format'

export const Route = createFileRoute('/_authenticated/encounters')({
  component: EncountersLayout,
})

function EncountersLayout() {
  const { list } = useEncounters()
  return (
    <>
      <aside className="flex w-80 shrink-0 flex-col border-r border-slate-200 bg-white">
        <h2 className="px-5 pt-5 pb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Encounters
        </h2>
        <nav className="flex-1 overflow-y-auto px-2 pb-4">
          {list.map((encounter) => (
            <Link
              key={encounter.id}
              to="/encounters/$encounterId"
              params={{ encounterId: encounter.id }}
              className="mb-1 block rounded-lg px-3 py-3 hover:bg-slate-50"
              activeProps={{ className: 'bg-accent-light/60 hover:bg-accent-light/60' }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-900">{encounter.patientName}</span>
                <span className="text-xs text-slate-400">{formatTime(encounter.startedAt)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="truncate text-sm text-slate-500">{encounter.reason}</span>
                <StatusBadge status={encounter.status} />
              </div>
            </Link>
          ))}
        </nav>
      </aside>
      <section className="min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </section>
    </>
  )
}
