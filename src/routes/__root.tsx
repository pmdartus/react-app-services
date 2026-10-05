import { Link, Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import type { AppServices } from '#/services/app/bootstrapApp'
import { Toasts } from '#/components/Toasts'

export interface RouterContext {
  app: AppServices
}

export const Route = createRootRouteWithContext<RouterContext>()({
  // Every navigation snapshots the auth state into the context: guards read `context.auth`, and so do
  // screens (`useAuth()`). After signing in or out, navigating (or `router.invalidate()`) refreshes it.
  beforeLoad: ({ context }) => ({ auth: context.app.auth.getState() }),
  component: () => (
    <>
      <Outlet />
      <Toasts />
    </>
  ),
  notFoundComponent: NotFound,
})

function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-slate-500">
      <p>This page doesn't exist.</p>
      <Link to="/" className="font-medium text-accent hover:text-accent-dark">
        Go home
      </Link>
    </div>
  )
}
