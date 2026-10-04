import { createContext, useContext } from 'react'
import type { SessionServices } from '#/services/session/bootstrapSession'

/**
 * Hands the session services to React, once the session is ready.
 * Provided by the authenticated layout; `null` while the session loads or failed.
 */
export const SessionServicesContext = createContext<SessionServices | null>(null)

export function useSessionServices(): SessionServices {
  const services = useContext(SessionServicesContext)
  if (!services) throw new Error('useSessionServices() must be used once the session is ready')
  return services
}
