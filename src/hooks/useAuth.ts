import { rootRouteId, useRouteContext, useRouter } from '@tanstack/react-router'
import type { User } from '#/services/app/auth'
import { useAppServices } from './useServices'

/**
 * The auth state the current screens were loaded with: the root route snapshots it on every
 * navigation (see `__root.tsx`), so it always agrees with the guards that let the user in.
 */
export function useAuth() {
  return useRouteContext({ from: rootRouteId, select: (context) => context.auth })
}

/** The signed-in user: available under the authenticated layout. */
export function useUser(): User {
  return useRouteContext({ from: '/_authenticated', select: (context) => context.user })
}

/** Signs out, leaves the authenticated screens, and only then disposes the session they used. */
export function useLogout() {
  const router = useRouter()
  const { sessionHost } = useAppServices()
  return () =>
    sessionHost.signOut({
      beforeDispose: async () => {
        await router.navigate({ to: '/login' })
        // Loaders cache session data per route: don't show it to whoever signs in next.
        router.clearCache()
      },
    })
}
