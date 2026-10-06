import { useSyncExternalStore } from 'react'
import { useSessionServices } from './useServices'

export function useUserSettings() {
  const { userSettings } = useSessionServices()
  const settings = useSyncExternalStore(userSettings.subscribe, userSettings.getState)
  return { settings, update: userSettings.update }
}
