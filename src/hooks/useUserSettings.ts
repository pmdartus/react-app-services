import { useSyncExternalStore } from 'react'
import { useRouteContext } from '@tanstack/react-router'

export function useUserSettings() {
  const { userSettings } = useRouteContext({ from: '/_authenticated', select: (context) => context.session })
  const settings = useSyncExternalStore(userSettings.subscribe, userSettings.getState)
  return { settings, update: userSettings.update }
}
