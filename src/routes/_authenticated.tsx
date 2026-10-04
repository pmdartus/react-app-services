import { Outlet, createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useAppServices } from '#/react/AppServicesContext'
import { useSessionState } from '#/react/useSession'
import { TopBar } from '#/components/TopBar'
import { Spinner } from '#/components/Spinner'
import { ErrorScreen } from '#/components/ErrorScreen'

/**
 * Navigating into this layout is a transition: the router waits for `beforeLoad`.
 * - for the first `pendingMs` it keeps showing the current screen (e.g. the login form);
 * - after that it shows `pendingComponent`, for at least `pendingMinMs` (no spinner flash);
 * - if `beforeLoad` throws, it shows `errorComponent`.
 * Navigations *within* the layout don't wait: the session is already ready.
 */
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context }) => {
    if (context.app.auth.getState().status === 'signedOut') throw redirect({ to: '/login' })
    await context.app.session.ready()
  },
  pendingMs: 150,
  pendingMinMs: 400,
  pendingComponent: () => (
    <Shell>
      <Spinner label="Loading your workspace…" />
    </Shell>
  ),
  errorComponent: SessionError,
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const session = useSessionState()
  return (
    // On sign-out the session goes idle right away; render nothing until the router redirects.
    <Shell>{session.status === 'ready' && <Outlet />}</Shell>
  )
}

function SessionError({ error }: { error: unknown }) {
  const { session } = useAppServices()
  const router = useRouter()
  const retry = () => {
    session.retry() // start a fresh session bootstrap...
    void router.invalidate() // ...and re-run beforeLoad, which waits for it
  }
  return (
    <Shell>
      <ErrorScreen error={error} onRetry={retry} />
    </Shell>
  )
}

/** The top bar only needs app services, so it stays usable while the session loads or fails. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <main className="flex min-h-0 flex-1">{children}</main>
    </div>
  )
}
