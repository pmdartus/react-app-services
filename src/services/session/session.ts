import type { User } from '../app/auth'
import type { StorageService } from '../app/storage'
import type { Disposable } from '../shared/disposable'
import { Store } from '../shared/store'
import { logger as rootLogger } from '../global/logger'
import { reportError } from '../global/errorReporter'
import { bootstrapSession, type SessionServices } from './bootstrapSession'

const logger = rootLogger.scope('session')

export type SessionState =
  | { status: 'loading' }
  | { status: 'ready'; services: SessionServices }
  | { status: 'error'; error: Error }

/**
 * One signed-in session: from sign-in to sign-out. Created and disposed by `auth`.
 * Bootstraps the session services and exposes how that's going. React only reads `getState()`.
 */
export interface Session extends Disposable {
  init(): Promise<void>
  subscribe(listener: () => void): () => void
  getState(): SessionState
  retry(): void
}

export interface SessionDependencies {
  user: User
  storage: StorageService
}

class UserSession extends Store<SessionState> implements Session {
  // A session is single-use: once disposed (sign-out), a bootstrap that finishes late is discarded.
  private disposed = false

  constructor(private readonly deps: SessionDependencies) {
    super({ status: 'loading' })
    logger.created('session', deps.user.email)
  }

  init() {
    return this.load()
  }

  retry = () => {
    if (this.getState().status !== 'error') return
    void this.load()
  }

  async dispose() {
    this.disposed = true
    const state = this.getState()
    this.clearListeners()
    if (state.status === 'ready') await state.services.dispose()
    logger.disposed('session')
  }

  private async load() {
    this.setState({ status: 'loading' })
    try {
      const services = await bootstrapSession(this.deps)
      if (this.disposed) {
        logger.info('session signed out while loading, discarding its services')
        await services.dispose()
        return
      }
      this.setState({ status: 'ready', services })
    } catch (error) {
      if (this.disposed) return
      reportError(error, { scope: 'session', user: this.deps.user.email })
      this.setState({ status: 'error', error: error as Error })
    }
  }
}

export function createSession(deps: SessionDependencies): Session {
  return new UserSession(deps)
}
