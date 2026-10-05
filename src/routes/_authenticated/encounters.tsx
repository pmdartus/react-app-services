import { Link, Outlet, createFileRoute, useParams, useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { StatusBadge } from '#/components/StatusBadge'
import { EncountersPlaceholder } from '#/components/Placeholders'
import { ErrorScreen } from '#/components/ErrorScreen'
import { formatTime } from '#/components/format'

export const Route = createFileRoute('/_authenticated/encounters')({
  loader: ({ context }) => context.session.apiClient.listEncounters(),
  // The router caches the list: moving between encounters reuses it, and refreshes it in the
  // background once it's older than this.
  staleTime: 60_000,
  pendingMs: 0, // on a cold load there's nothing to keep showing meanwhile
  pendingMinMs: 0,
  pendingComponent: EncountersPending,
  errorComponent: EncountersError,
  component: EncountersLayout,
})

/** This layout's placeholder, plus its child's when an encounter is being opened. */
function EncountersPending() {
  const { encounterId } = useParams({ strict: false })
  return <EncountersPlaceholder detail={encounterId !== undefined} />
}

function EncountersError({ error }: ErrorComponentProps) {
  const router = useRouter()
  // Re-runs the loader.
  return <ErrorScreen error={error instanceof Error ? error : new Error(String(error))} onRetry={() => void router.invalidate()} />
}

function EncountersLayout() {
  const list = Route.useLoaderData()
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
