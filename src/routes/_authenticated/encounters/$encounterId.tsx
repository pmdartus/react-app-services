import { Await, createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { useUserSettings } from '#/hooks/useUserSettings'
import { StatusBadge } from '#/components/StatusBadge'
import { formatTime } from '#/components/format'
import { NotePlaceholder } from '#/components/Placeholders'
import { ErrorBoundary } from '#/components/ErrorBoundary'

export const Route = createFileRoute('/_authenticated/encounters/$encounterId')({
  loader: async ({ context, params, parentMatchPromise }) => {
    // Not awaited: the page shows right away, and `<Await>` shows a placeholder until the note is there.
    // Started before looking the encounter up, so it loads alongside the list on a cold load.
    const note = context.session.apiClient.getEncounterNote(params.encounterId)
    const { loaderData: list } = await parentMatchPromise
    const encounter = list?.find(({ id }) => id === params.encounterId)
    if (!encounter) {
      note.catch(() => {}) // nobody will render it
      throw notFound()
    }
    return { encounter, note }
  },
  // Notes are read-only here: keep a loaded one (and the encounter) until it's invalidated.
  staleTime: Infinity,
  notFoundComponent: () => <div className="p-10 text-sm text-slate-500">Encounter not found.</div>,
  component: EncounterDetail,
})

function EncounterDetail() {
  const { encounter, note } = Route.useLoaderData()
  const { settings } = useUserSettings()
  const router = useRouter()

  async function retryNote(reset: () => void) {
    await router.invalidate({ filter: (match) => match.routeId === Route.id }) // fetch the note anew...
    reset() // ...then render it again
  }

  return (
    <article className="mx-auto max-w-3xl px-10 py-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{encounter.patientName}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {formatTime(encounter.startedAt)} · {encounter.reason}
          </p>
        </div>
        <StatusBadge status={encounter.status} />
      </header>

      <section className="mt-8">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Note</h2>
          <span className="text-xs text-slate-400">
            {settings.noteTemplate === 'soap' ? 'SOAP' : 'Narrative'} · {settings.noteLanguage === 'en' ? 'English' : 'Français'}
          </span>
        </div>
        {/* Keyed so each encounter gets its own placeholder and its own error state. */}
        <ErrorBoundary key={encounter.id} fallback={(error, reset) => <NoteError error={error} onRetry={() => void retryNote(reset)} />}>
          <Await promise={note} fallback={<NotePlaceholder />}>
            {(text) => <NoteBody note={text} />}
          </Await>
        </ErrorBoundary>
      </section>
    </article>
  )
}

function NoteBody({ note }: { note: string }) {
  return (
    <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm leading-relaxed whitespace-pre-line text-slate-700">
      {note}
    </p>
  )
}

function NoteError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
      <span>Could not load the note: {error.message}</span>
      <button onClick={onRetry} className="font-medium underline">
        Retry
      </button>
    </div>
  )
}
