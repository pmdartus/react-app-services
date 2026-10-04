import { useSyncExternalStore } from 'react'
import type { AppServices } from '#/bootstrap/bootstrapApp'
import type { SessionServices } from '#/bootstrap/bootstrapSession'
import { useAppServices } from './AppServicesContext'

export function useSessionState() {
  const { session } = useAppServices()
  const state = useSyncExternalStore(session.subscribe, session.getState)
  return { ...state, retry: session.retry }
}

/** Only use under the authenticated layout, which renders its children once the session is ready. */
export function useSessionServices(): SessionServices {
  const state = useSessionState()
  if (state.status !== 'ready') throw new Error(`Session is not ready (${state.status})`)
  return state.services
}

/** Non-React access, for router hooks (`beforeLoad`, `onEnter`, …). */
export function getSessionServices(app: AppServices): SessionServices | null {
  const state = app.session.getState()
  return state.status === 'ready' ? state.services : null
}
