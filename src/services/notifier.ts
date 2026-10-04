import type { Logger } from './logger'
import type { Disposable } from './shared/disposable'
import { Store } from './shared/store'

export interface Toast {
  id: number
  kind: 'success' | 'info' | 'error'
  message: string
}

/** Toast notifications. Plain TypeScript, so any service can call `notify()`. */
export interface NotifierService extends Disposable {
  subscribe(listener: () => void): () => void
  getState(): Toast[]
  notify(toast: Omit<Toast, 'id'>): void
  dismiss(id: number): void
}

export interface NotifierDependencies {
  logger: Logger
}

const AUTO_DISMISS_MS = 4000

class Notifier extends Store<Toast[]> implements NotifierService {
  private nextId = 1
  private readonly timers = new Set<ReturnType<typeof setTimeout>>()

  constructor(private readonly deps: NotifierDependencies) {
    super([])
    deps.logger.created('notifier')
  }

  notify = (toast: Omit<Toast, 'id'>) => {
    const id = this.nextId++
    this.setState([...this.getState(), { id, ...toast }])

    const timer = setTimeout(() => {
      this.timers.delete(timer)
      this.dismiss(id)
    }, AUTO_DISMISS_MS)
    this.timers.add(timer)
  }

  dismiss = (id: number) => {
    this.setState(this.getState().filter((toast) => toast.id !== id))
  }

  dispose() {
    for (const timer of this.timers) clearTimeout(timer)
    this.clearListeners()
    this.deps.logger.disposed('notifier')
  }
}

export function createNotifier(deps: NotifierDependencies): NotifierService {
  return new Notifier(deps)
}
