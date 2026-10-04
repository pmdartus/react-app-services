import { useSyncExternalStore } from 'react'
import { useSessionServices } from './useSession'

export function useUserSettings() {
  const { userSettings } = useSessionServices()
  const settings = useSyncExternalStore(userSettings.subscribe, userSettings.getState)
  return { settings, update: userSettings.update }
}
