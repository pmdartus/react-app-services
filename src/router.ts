import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import type { AppServices } from './services/app/bootstrapApp'

/** Created once the app services exist, so route hooks always get a real `context.app`. */
export function createAppRouter(app: AppServices) {
  return createRouter({
    routeTree,
    defaultPreload: 'intent',
    scrollRestoration: true,
    context: { app },
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
