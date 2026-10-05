import { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useEncounterNote, useEncounters } from '#/hooks/useEncounters'
import { useUserSettings } from '#/hooks/useUserSettings'
import { StatusBadge } from '#/components/StatusBadge'
import { formatTime } from '#/components/format'
import { NotePlaceholder } from '#/components/Placeholders'
import { ErrorBoundary } from '#/components/ErrorBoundary'

export const Route = createFileRoute('/_authenticated/encounters/$encounterId')({
  // Opening an encounter starts fetching its note, and so does hovering a link to it (preload).
  // Not awaited: the page shows right away, and the note suspends until it's there.
  // `encounters` caches the note, so running this again is free.
  loader: ({ context, params }) => context.session.encounters.openEncounter(params.encounterId),
  component: EncounterDetail,
})

function EncounterDetail() {
  const { encounterId } = Route.useParams()
  const { getById, invalidateNote } = useEncounters()
  const { settings } = useUserSettings()
  const encounter = getById(encounterId)

  if (!encounter) {
    return <div className="p-10 text-sm text-slate-500">Encounter not found.</div>
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
        <ErrorBoundary
          key={encounter.id}
          fallback={(error, reset) => (
            <NoteError
              error={error}
              onRetry={() => {
                invalidateNote(encounter.id) // forget the failed fetch...
                reset() // ...and render again, which fetches it anew
              }}
            />
          )}
        >
          <Suspense fallback={<NotePlaceholder />}>
            <NoteBody encounterId={encounter.id} />
          </Suspense>
        </ErrorBoundary>
      </section>
    </article>
  )
}

function NoteBody({ encounterId }: { encounterId: string }) {
  const note = useEncounterNote(encounterId)
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
