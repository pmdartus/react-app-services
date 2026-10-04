import { Link } from '@tanstack/react-router'
import { useAuth } from '#/hooks/useAuth'
import { useSession } from '#/hooks/useSession'
import { useRecordingSession } from '#/hooks/useRecordingSession'
import { formatElapsed, initials } from './format'

/** Only depends on app services, so it keeps working while the session is loading or failed. */
export function TopBar() {
  const auth = useAuth()
  const session = useSession()
  if (auth.status !== 'signedIn') return null

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-5">
      <Link to="/encounters" className="flex items-center gap-2 font-semibold text-slate-900">
        <span className="flex size-7 items-center justify-center rounded-lg bg-accent text-sm text-white">S</span>
        Scribe
      </Link>
      <div className="flex-1" />
      {session?.status === 'ready' && <RecordingPill />}
      <Link
        to="/settings"
        className="text-sm text-slate-600 hover:text-slate-900"
        activeProps={{ className: 'text-slate-900 font-medium' }}
      >
        Settings
      </Link>
      <button onClick={auth.logout} className="text-sm text-slate-600 hover:text-slate-900">
        Log out
      </button>
      <div
        title={auth.user.email}
        className="flex size-8 items-center justify-center rounded-full bg-accent-light text-xs font-semibold text-accent-dark"
      >
        {initials(auth.user.name)}
      </div>
    </header>
  )
}

/** Visible on every page: the recording outlives the encounter component. */
function RecordingPill() {
  const recording = useRecordingSession()
  if (!recording || recording.status !== 'recording') return null
  return (
    <Link
      to="/encounters/$encounterId"
      params={{ encounterId: recording.encounterId }}
      className="flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700"
    >
      <span className="size-2 animate-pulse rounded-full bg-red-500" />
      Recording {formatElapsed(recording.elapsedMs)}
    </Link>
  )
}
