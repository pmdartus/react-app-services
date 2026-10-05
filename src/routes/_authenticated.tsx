import { Navigate, Outlet, createFileRoute, redirect, useMatches } from '@tanstack/react-router'
import { useSession } from '#/hooks/useSession'
import { SessionServicesContext } from '#/context/SessionServicesContext'
import { TopBar } from '#/components/TopBar'
import { Spinner } from '#/components/Spinner'
import { ErrorScreen } from '#/components/ErrorScreen'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context }) => {
    // Guards navigation into the layout. Signing out while inside it doesn't re-run `beforeLoad`,
    // so the layout also redirects when the session goes away (`<Navigate>` below).
    const auth = context.app.auth.getState()
    if (auth.status === 'signedOut') {
      throw redirect({ to: '/login' })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const session = useSession()
  if (!session) {
    // Signed out while inside the layout: there's no session anymore.
    return <Navigate to="/login" />
  }

  return (
    <SessionServicesContext value={session.status === 'ready' ? session.services : null}>
      <div className="flex h-full flex-col">
        {/* Works while the session loads or failed. */}
        <TopBar />
        <main className="flex min-h-0 flex-1">
          {session.status === 'loading' && <ScreenPlaceholder />}
          {session.status === 'error' && <ErrorScreen error={session.error} onRetry={session.retry} />}
          {session.status === 'ready' && <Outlet />}
        </main>
      </div>
    </SessionServicesContext>
  )
}

/** The placeholder of the screen being opened: the deepest matched route that declares one. */
function ScreenPlaceholder() {
  const Placeholder = [...useMatches()].reverse().find((match) => match.staticData.placeholder)?.staticData.placeholder
  return Placeholder ? <Placeholder /> : <Spinner label="Loading your workspace…" />
}
