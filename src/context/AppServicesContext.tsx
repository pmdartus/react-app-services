import { createContext, useContext } from 'react'
import type { AppServices } from '#/services/app/bootstrapApp'

/** Hands the already-bootstrapped app services to React. Nothing is created here. */
export const AppServicesContext = createContext<AppServices | null>(null)

export function useAppServices(): AppServices {
  const services = useContext(AppServicesContext)
  if (!services) throw new Error('useAppServices() must be used under <AppServicesContext>')
  return services
}
