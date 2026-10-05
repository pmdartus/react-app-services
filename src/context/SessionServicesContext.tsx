import { createContext, useContext } from 'react'
import type { SessionServices } from '#/services/session/bootstrapSession'

/**
 * Hands the session services to React. Provided by the authenticated layout, which only renders
 * once the router has waited for the session (see `_authenticated.tsx`).
 */
export const SessionServicesContext = createContext<SessionServices | null>(null)

export function useSessionServices(): SessionServices {
  const services = useContext(SessionServicesContext)
  if (!services) throw new Error('useSessionServices() must be used under the authenticated layout')
  return services
}
