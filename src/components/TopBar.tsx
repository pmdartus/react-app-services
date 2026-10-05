import { Link } from '@tanstack/react-router'
import { useAuth, useLogout } from '#/hooks/useAuth'
import { initials } from './format'

/** Usable while the session is loading or failed: it only needs the auth state. */
export function TopBar() {
  const auth = useAuth()
  const logout = useLogout()
  if (auth.status !== 'signedIn') return null // only shown by the authenticated layout

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-5">
      <Link to="/encounters" className="flex items-center gap-2 font-semibold text-slate-900">
        <span className="flex size-7 items-center justify-center rounded-lg bg-accent text-sm text-white">S</span>
        Scribe
      </Link>
      <div className="flex-1" />
      <Link
        to="/settings"
        className="text-sm text-slate-600 hover:text-slate-900"
        activeProps={{ className: 'text-slate-900 font-medium' }}
      >
        Settings
      </Link>
      <button onClick={logout} className="text-sm text-slate-600 hover:text-slate-900">
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
