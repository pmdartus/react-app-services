import { rootRouteId, useRouteContext } from '@tanstack/react-router'
import type { AppServices } from '#/services/app/bootstrapApp'
import type { SessionServices } from '#/services/session/bootstrapSession'

/*
 * How components reach services. Where they're kept is an implementation detail: today it's the
 * router context, because route guards and loaders need them too (see `router.ts`, `_authenticated.tsx`).
 */

/** App-scoped services: available everywhere. */
export function useAppServices(): AppServices {
  return useRouteContext({ from: rootRouteId, select: (context) => context.app })
}

/** Session-scoped services: available under the authenticated layout, which waits for them. */
export function useSessionServices(): SessionServices {
  return useRouteContext({ from: '/_authenticated', select: (context) => context.session })
}
