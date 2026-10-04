import { Store } from '../shared/store'
import { logger } from './logger'

export interface Toast {
  id: number
  kind: 'success' | 'info' | 'error'
  message: string
}

/**
 * Toast notifications. A module singleton: services and components import
 * `notifier` and call `notify()` directly. It's reactive, so React still
 * subscribes to it with `useSyncExternalStore` (see `useNotifications`).
 */
export interface Notifier {
  subscribe(listener: () => void): () => void
  getState(): Toast[]
  notify(toast: Omit<Toast, 'id'>): void
  dismiss(id: number): void
}

const AUTO_DISMISS_MS = 4000

class ToastNotifier extends Store<Toast[]> implements Notifier {
  private nextId = 1

  constructor() {
    super([])
    logger.created('notifier')
  }

  notify = (toast: Omit<Toast, 'id'>) => {
    const id = this.nextId++
    this.setState([...this.getState(), { id, ...toast }])
    setTimeout(() => this.dismiss(id), AUTO_DISMISS_MS)
  }

  dismiss = (id: number) => {
    this.setState(this.getState().filter((toast) => toast.id !== id))
  }
}

export const notifier: Notifier = new ToastNotifier()
