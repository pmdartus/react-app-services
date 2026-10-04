import { Navigate, Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { useSessionState } from '#/react/useSession'
import { TopBar } from '#/components/TopBar'
import { Spinner } from '#/components/Spinner'
import { ErrorScreen } from '#/components/ErrorScreen'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context }) => {
    if (context.app.auth.getState().status === 'signedOut') throw redirect({ to: '/login' })
  },
  component: AuthenticatedLayout,
})

/** Renders whatever the session manager says. No lifecycle logic lives here. */
function AuthenticatedLayout() {
  const session = useSessionState()
  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <main className="flex min-h-0 flex-1">
        {session.status === 'idle' && <Navigate to="/login" />}
        {session.status === 'initializing' && <Spinner label="Loading your workspace…" />}
        {session.status === 'error' && <ErrorScreen error={session.error} onRetry={session.retry} />}
        {session.status === 'ready' && <Outlet />}
      </main>
    </div>
  )
}
