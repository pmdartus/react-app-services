import type { User } from '../app/auth'
import type { StorageService } from '../app/storage'
import type { Disposable } from '../shared/disposable'
import { logger as rootLogger } from '../global/logger'
import { reportError } from '../global/errorReporter'
import { bootstrapSession, type SessionServices } from './bootstrapSession'

/**
 * One signed-in session: from sign-in to sign-out. Created and disposed by `sessionHost`.
 * Bootstraps the session services. The router waits on `ready()` before showing the screens that need them.
 */
export interface Session extends Disposable {
  /** Whose session it is: a user and their services always come together. */
  readonly user: User
  /** Starts the bootstrap. Resolves once it settled, whatever the outcome: failures are read from `ready()`. */
  init(): Promise<void>
  /** The services of the current attempt. Returns the same promise until `retry()` starts a new attempt. */
  ready(): Promise<SessionServices>
  /** Starts a new attempt, if the current one failed. */
  retry(): void
}

export interface SessionDependencies {
  user: User
  storage: StorageService
}

class UserSession implements Session {
  private readonly logger = rootLogger.scope('session')

  private attempt: Promise<SessionServices> | null = null
  private failed = false
  private services: SessionServices | null = null

  // A session is single-use: once disposed (sign-out), a bootstrap that finishes late is discarded.
  private disposed = false

  constructor(private readonly deps: SessionDependencies) {
    this.logger.created('session', deps.user.email)
  }

  get user() {
    return this.deps.user
  }

  async init() {
    await this.ready().catch(() => {})
  }

  ready = () => (this.attempt ??= this.load())

  retry = () => {
    if (!this.failed) return
    this.attempt = this.load()
  }

  async dispose() {
    this.disposed = true
    await this.services?.dispose()
    this.logger.disposed('session')
  }

  private async load(): Promise<SessionServices> {
    this.failed = false
    try {
      const services = await bootstrapSession(this.deps)
      if (this.disposed) {
        this.logger.info('session signed out while loading, discarding its services')
        await services.dispose()
        throw new Error('Signed out while the session was loading')
      }
      this.services = services
      return services
    } catch (error) {
      if (!this.disposed) {
        this.failed = true
        reportError(error, { scope: 'session', user: this.deps.user.email })
      }
      throw error
    }
  }
}

export function createSession(deps: SessionDependencies): Session {
  return new UserSession(deps)
}
