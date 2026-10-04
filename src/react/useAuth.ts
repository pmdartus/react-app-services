import { useSyncExternalStore } from 'react'
import { useAppServices } from './AppServicesContext'

export function useAuth() {
  const { auth } = useAppServices()
  const state = useSyncExternalStore(auth.subscribe, auth.getState)
  return { ...state, login: auth.login, logout: auth.logout }
}
