import { rootRouteId, useRouteContext, useRouter } from '@tanstack/react-router'

/**
 * The auth state the current screens were loaded with: the root route snapshots it on every
 * navigation (see `__root.tsx`), so it always agrees with the guards that let the user in.
 */
export function useAuth() {
  return useRouteContext({ from: rootRouteId, select: (context) => context.auth })
}

/** Signs out, then leaves the authenticated screens. */
export function useLogout() {
  const router = useRouter()
  const { auth } = useRouteContext({ from: rootRouteId, select: (context) => context.app })
  return async () => {
    await auth.logout()
    await router.navigate({ to: '/login' })
    // Loaders cache session data per route: don't show it to whoever signs in next.
    router.clearCache()
  }
}
