import { Store } from '../shared/store'

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

export interface NotifierOptions {
  autoDismissMs: number
}

class ToastNotifier extends Store<Toast[]> implements Notifier {
  private nextId = 1

  constructor(private readonly options: NotifierOptions) {
    super([])
  }

  notify = (toast: Omit<Toast, 'id'>) => {
    const id = this.nextId++
    this.setState([...this.getState(), { id, ...toast }])
    setTimeout(() => this.dismiss(id), this.options.autoDismissMs)
  }

  dismiss = (id: number) => {
    this.setState(this.getState().filter((toast) => toast.id !== id))
  }
}

/** Assigned by `initNotifier()`. Importers see it through the live binding, so don't use it while modules load. */
export let notifier: Notifier

/** Called once by the app's entry point, before anything notifies. Creates the notifier. */
export function initNotifier(options: NotifierOptions) {
  if (notifier) throw new Error('notifier is already initialized')
  notifier = new ToastNotifier(options)
}
