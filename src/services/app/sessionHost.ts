import type { AuthService, User } from './auth'
import type { StorageService } from './storage'
import { createSession, type Session } from '../session/session'
import type { Disposable } from '../shared/disposable'
import { logger as rootLogger } from '../global/logger'

/**
 * Owns the session scope: opens a session when a user signs in, closes it when they sign out.
 * There's a session exactly while someone is signed in.
 */
export interface SessionHost extends Disposable {
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
  private readonly unsubscribe: () => void

  constructor(private readonly deps: SessionHostDependencies) {
    // Created before `auth.init()`: a user restored from storage gets a session too.
    this.unsubscribe = deps.auth.subscribe(() => this.follow())
    this.logger.created('sessionHost')
  }

  current = () => this.session

  async dispose() {
    this.unsubscribe()
    await this.close()
    this.logger.disposed('sessionHost')
  }

  /** At most one session, for whoever is signed in. */
  private follow() {
    const auth = this.deps.auth.getState()
    const user = auth.status === 'signedIn' ? auth.user : null
    if ((this.session?.user ?? null) === user) return
    void this.close()
    if (user) this.open(user)
  }

  private open(user: User) {
    // It creates the session (inner scope) and passes down what it needs from the app scope.
    this.session = createSession({ user, storage: this.deps.storage })
    // Not awaited: the router waits on `session.ready()`, and shows placeholders meanwhile.
    void this.session.init()
  }

  private async close() {
    const previous = this.session
    this.session = null // nothing gets the session anymore...
    await previous?.dispose() // ...then it's torn down
  }
}

export function createSessionHost(deps: SessionHostDependencies): SessionHost {
  return new UserSessionHost(deps)
}
