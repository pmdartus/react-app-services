import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import type { AppServices } from './services/app/bootstrapApp'

/** Created once the app services exist, so route hooks always get a real `context.app`. */
export function createAppRouter(app: AppServices) {
  const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
    scrollRestoration: true,
    context: { app },
  })
  // Route guards read auth in `beforeLoad`, which only runs on navigation.
  // Re-run them when auth changes, so signing in or out redirects from wherever the user is.
  app.auth.subscribe(() => void router.invalidate())
  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
