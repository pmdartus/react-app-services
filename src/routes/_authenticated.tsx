import { Navigate, Outlet, createFileRoute, redirect, useMatches } from '@tanstack/react-router'
import { useSession } from '#/hooks/useSession'
import { SessionServicesContext } from '#/context/SessionServicesContext'
import { TopBar } from '#/components/TopBar'
import { Spinner } from '#/components/Spinner'
import { ErrorScreen } from '#/components/ErrorScreen'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context }) => {
    if (context.app.auth.getState().status === 'signedOut') throw redirect({ to: '/login' })
  },
  component: AuthenticatedLayout,
})

/** Renders whatever the session says. No lifecycle logic lives here. */
function AuthenticatedLayout() {
  const session = useSession()
  if (!session) return <Navigate to="/login" />

  return (
    <SessionServicesContext value={session.status === 'ready' ? session.services : null}>
      <div className="flex h-full flex-col">
        {/* Only needs app services, so it keeps working while the session loads or failed. */}
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
