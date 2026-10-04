import type { AuthService, User } from './auth'
import type { Logger } from './logger'
import type { Disposable } from './shared/disposable'
import { Store } from './shared/store'
import type { SessionServices } from '#/bootstrap/bootstrapSession'

export type SessionState =
  | { status: 'idle' }
  | { status: 'initializing' }
  | { status: 'ready'; services: SessionServices }
  | { status: 'error'; error: Error }

/**
 * Owns the auth-session scope: bootstraps the session services on sign-in and
 * disposes them on sign-out. React only reads `getState()`.
 */
export interface SessionManager extends Disposable {
  init(): Promise<void>
  subscribe(listener: () => void): () => void
  getState(): SessionState
  retry(): void
}

export interface SessionManagerDependencies {
  auth: AuthService
  logger: Logger
  bootstrapSession: (user: User) => Promise<SessionServices>
}

class Session extends Store<SessionState> implements SessionManager {
  private unsubscribeFromAuth = () => {}
  // Bumped on every start/stop. A bootstrap that finishes with a stale number
  // lost a race (e.g. logout while initializing) and must not become `ready`.
  private generation = 0

  constructor(private readonly deps: SessionManagerDependencies) {
    super({ status: 'idle' })
    deps.logger.created('session')
  }

  init() {
    return this.deps.logger.traceInit('session', async () => {
      this.unsubscribeFromAuth = this.deps.auth.subscribe(this.syncWithAuth)
      // Don't block app startup on the session scope: the UI shows its own spinner.
      void this.syncWithAuth()
    })
  }

  retry = () => {
    const auth = this.deps.auth.getState()
    if (auth.status === 'signedIn') void this.start(auth.user)
  }

  async dispose() {
    this.unsubscribeFromAuth()
    await this.stop()
    this.clearListeners()
    this.deps.logger.disposed('session')
  }

  private syncWithAuth = async () => {
    const auth = this.deps.auth.getState()
    const isActive = this.getState().status !== 'idle'
    if (auth.status === 'signedIn' && !isActive) await this.start(auth.user)
    if (auth.status === 'signedOut' && isActive) await this.stop()
  }

  private async start(user: User) {
    const generation = ++this.generation
    this.setState({ status: 'initializing' })
    try {
      const services = await this.deps.bootstrapSession(user)
      if (generation !== this.generation) {
        this.deps.logger.info('session signed out while initializing, discarding session scope')
        await services.dispose()
        return
      }
      this.setState({ status: 'ready', services })
    } catch (error) {
      if (generation !== this.generation) return
      this.setState({ status: 'error', error: error as Error })
    }
  }

  private async stop() {
    this.generation++
    const previous = this.getState()
    this.setState({ status: 'idle' }) // the UI stops using the services right away...
    if (previous.status === 'ready') {
      this.deps.logger.info('session tearing down session scope')
      await previous.services.dispose() // ...then they are disposed, in reverse order
    }
  }
}

export function createSessionManager(deps: SessionManagerDependencies): SessionManager {
  return new Session(deps)
}
