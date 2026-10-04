import { useSyncExternalStore } from 'react'
import { useAppServices } from './AppServicesContext'

export function useNotifications() {
  const { notifier } = useAppServices()
  const toasts = useSyncExternalStore(notifier.subscribe, notifier.getState)
  return { toasts, notify: notifier.notify, dismiss: notifier.dismiss }
}
