import type { AuthService, User } from './auth'
import type { StorageService } from './storage'
import { createSession, type Session } from '../session/session'
import type { Disposable } from '../shared/disposable'
import { logger as rootLogger } from '../global/logger'

/**
 * Owns the session scope, and is the one place signing in and out happens: it asks `auth` who the
 * user is, then opens or closes their session. There's a session exactly while someone is signed in.
 */
export interface SessionHost extends Disposable {
  /** Opens the session of the user `auth.init()` restored, if any. Runs after it. */
  init(): Promise<void>
  /** Signs in, then opens the user's session. Resolves once signed in, not once the session is ready. */
  signIn(email: string): Promise<void>
  /**
   * Signs out in three steps: `current()` becomes null (route guards now redirect), then
   * `beforeDispose` runs (the caller navigates away), then the session is disposed, even if it threw.
   */
  signOut(options?: { beforeDispose?: () => Promise<void> }): Promise<void>
  /** The signed-in user's session; null when signed out. The only way to reach the session services. */
  current(): Session | null
}

export interface SessionHostDependencies {
  auth: AuthService
  storage: StorageService
}

class UserSessionHost implements SessionHost {
  private readonly logger = rootLogger.scope('app')
  private session: Session | null = null

  constructor(private readonly deps: SessionHostDependencies) {
    this.logger.created('sessionHost')
  }

  async init() {
    const auth = this.deps.auth.getState()
    if (auth.status === 'signedIn') this.open(auth.user)
  }

  signIn = async (email: string) => {
    const user = await this.deps.auth.signIn(email)
    if (user) this.open(user) // null: a later sign-in or sign-out superseded this one
  }

  signOut = async ({ beforeDispose }: { beforeDispose?: () => Promise<void> } = {}) => {
    this.deps.auth.signOut()
    const previous = this.detach()
    try {
      await beforeDispose?.()
    } finally {
      await previous?.dispose()
    }
  }

  current = () => this.session

  async dispose() {
    await this.detach()?.dispose()
    this.logger.disposed('sessionHost')
  }

  private open(user: User) {
    void this.detach()?.dispose() // at most one session at a time
    // It creates the session (inner scope) and passes down what it needs from the app scope.
    this.session = createSession({ user, storage: this.deps.storage })
    // Not awaited: the router waits on `session.ready()`, and shows placeholders meanwhile.
    void this.session.init()
  }

  /** Stops handing out the current session, and returns it for the caller to dispose. */
  private detach() {
    const previous = this.session
    this.session = null
    return previous
  }
}

export function createSessionHost(deps: SessionHostDependencies): SessionHost {
  return new UserSessionHost(deps)
}
