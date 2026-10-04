import { useSyncExternalStore } from 'react'
import { useAppServices } from '#/context/AppServicesContext'

export function useAuth() {
  const { auth } = useAppServices()
  const state = useSyncExternalStore(auth.subscribe, auth.getState)
  return { ...state, login: auth.login, logout: auth.logout }
}
