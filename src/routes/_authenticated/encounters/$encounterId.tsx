import { createFileRoute } from '@tanstack/react-router'
import type { RouterContext } from '#/routes/__root'
import { getSessionServices } from '#/react/useSession'
import { useEncounters } from '#/react/useEncounters'
import { useRecordingSession } from '#/react/useRecordingSession'
import { useUserSettings } from '#/react/useUserSettings'
import { StatusBadge } from '#/components/StatusBadge'
import { formatElapsed, formatTime } from '#/components/format'

// Opening another encounter disposes a recording started elsewhere.
// (Visiting /settings does not: the recording keeps running in the background.)
// `onStay` covers switching from one encounter to another (same route, new params).
const openEncounter = ({ context, params }: { context: RouterContext; params: { encounterId: string } }) =>
  getSessionServices(context.app)?.encounters.openEncounter(params.encounterId)

export const Route = createFileRoute('/_authenticated/encounters/$encounterId')({
  onEnter: openEncounter,
  onStay: openEncounter,
  component: EncounterDetail,
})

function EncounterDetail() {
  const { encounterId } = Route.useParams()
  const { getById } = useEncounters()
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

      <RecordingPanel encounterId={encounter.id} />

      <section className="mt-8">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Note</h2>
          <span className="text-xs text-slate-400">
            {settings.noteTemplate === 'soap' ? 'SOAP' : 'Narrative'} · {settings.noteLanguage === 'en' ? 'English' : 'Français'}
          </span>
        </div>
        <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm leading-relaxed whitespace-pre-line text-slate-700">
          {encounter.note}
        </p>
      </section>
    </article>
  )
}

function RecordingPanel({ encounterId }: { encounterId: string }) {
  const { startRecording } = useEncounters()
  const active = useRecordingSession()
  const recording = active?.encounterId === encounterId ? active : null

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {recording?.status === 'recording' && <span className="size-2.5 animate-pulse rounded-full bg-red-500" />}
          <span className="font-mono text-lg text-slate-900 tabular-nums">
            {formatElapsed(recording?.elapsedMs ?? 0)}
          </span>
          {recording?.status === 'stopped' && <span className="text-sm text-slate-500">Recording saved</span>}
        </div>
        {recording?.status === 'recording' ? (
          <button
            onClick={recording.stop}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={() => startRecording(encounterId)}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark"
          >
            {recording ? 'Record again' : 'Record'}
          </button>
        )}
      </div>
      {recording && (
        <ol className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-sm text-slate-600">
          {recording.transcript.length === 0 && <li className="text-slate-400">Listening…</li>}
          {recording.transcript.map((line, index) => (
            <li key={index}>{line}</li>
          ))}
        </ol>
      )}
    </section>
  )
}
