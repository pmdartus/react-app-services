import { useAuth } from './useAuth'
import { useOptionalStore } from './useOptionalStore'

/** The current session's state (loading / ready / error), or `null` when signed out. */
export function useSession() {
  const auth = useAuth()
  const session = auth.status === 'signedIn' ? auth.session : null
  const state = useOptionalStore(session)
  if (!session || !state) return null
  return { ...state, retry: session.retry }
}
