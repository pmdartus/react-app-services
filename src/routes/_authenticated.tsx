import type { ReactNode } from 'react'
import { Outlet, createFileRoute, redirect, useChildMatches, useRouter } from '@tanstack/react-router'
import { useAuth } from '#/hooks/useAuth'
import { SessionServicesContext } from '#/context/SessionServicesContext'
import { TopBar } from '#/components/TopBar'
import { Spinner } from '#/components/Spinner'
import { ErrorScreen } from '#/components/ErrorScreen'

/**
 * Entering this layout waits for the session: `beforeLoad` awaits `session.ready()` and puts the
 * services in the route context, so every child route gets them (`context.session`), loaders included.
 * - meanwhile it shows `pendingComponent` right away (`pendingMs: 0`): on a cold load there's no
 *   previous screen to keep showing, and a delay would leave the page blank;
 * - if the session fails, it shows `errorComponent`.
 * Navigations within the layout don't wait: `ready()` returns the already resolved promise.
 */
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context }) => {
    // Also re-run on sign-out: the router is invalidated whenever auth changes (see `router.ts`).
    const auth = context.app.auth.getState()
    if (auth.status === 'signedOut') {
      throw redirect({ to: '/login' })
    }
    return { session: await auth.session.ready() }
  },
  pendingMs: 0,
  pendingMinMs: 0,
  pendingComponent: SessionPending,
  errorComponent: SessionError,
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { session } = Route.useRouteContext()
  // On sign-out, auth drops the session right away and disposes it, while the router redirects:
  // stop rendering screens that use its services meanwhile.
  const signedIn = useAuth().status === 'signedIn'
  return (
    <SessionServicesContext value={session}>
      <Shell>{signedIn && <Outlet />}</Shell>
    </SessionServicesContext>
  )
}

/**
 * The router shows the pending component of the topmost route that isn't on screen yet: this one,
 * as long as the session or any child loader is running. So it shows the placeholder of the screen
 * being opened, i.e. the `pendingComponent` of the first child route that declares one.
 * Once this layout is on screen, child routes show their own (e.g. settings → encounters).
 */
function SessionPending() {
  const router = useRouter()
  const Placeholder = useChildMatches()
    .map((match) => router.routesById[match.routeId].options.pendingComponent)
    .find((component) => component !== undefined)
  return <Shell>{Placeholder ? <Placeholder /> : <Spinner label="Loading your workspace…" />}</Shell>
}

function SessionError({ error }: { error: unknown }) {
  const auth = useAuth()
  const router = useRouter()
  const retry = () => {
    if (auth.status === 'signedIn') auth.session.retry() // start a new bootstrap...
    void router.invalidate() // ...and re-run `beforeLoad`, which waits for it
  }
  return (
    <Shell>
      <ErrorScreen error={error instanceof Error ? error : new Error(String(error))} onRetry={retry} />
    </Shell>
  )
}

/** The top bar only needs app services: it stays usable while the session loads or failed. */
function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <main className="flex min-h-0 flex-1">{children}</main>
    </div>
  )
}
