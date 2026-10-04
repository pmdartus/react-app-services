import { useSyncExternalStore } from 'react'
import { notifier } from '#/services/global/notifier'

/** No Context needed: `notifier` is a global singleton, imported directly. */
export function useNotifications() {
  const toasts = useSyncExternalStore(notifier.subscribe, notifier.getState)
  return { toasts, notify: notifier.notify, dismiss: notifier.dismiss }
}
