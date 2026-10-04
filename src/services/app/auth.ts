import type { StorageService } from './storage'
import type { Session } from '../session/session'
import type { Disposable } from '../shared/disposable'
import { Store } from '../shared/store'
import { fakeLatency } from '../shared/delay'
import { failIfRequested } from '../shared/demoFlags'
import { logger as rootLogger } from '../global/logger'

const logger = rootLogger.scope('app')

export interface User {
  id: string
  email: string
  name: string
  token: string
}

/**
 * Signing in opens a session, signing out closes it. Auth owns the session the
 * same way `encounters` owns a recording: it holds the instance in its state.
 */
export type AuthState = { status: 'signedOut' } | { status: 'signedIn'; user: User; session: Session }

/** Fake authentication. Any email works; the user is persisted across reloads. */
export interface AuthService extends Disposable {
  init(): Promise<void>
  subscribe(listener: () => void): () => void
  getState(): AuthState
  login(email: string): Promise<void>
  logout(): Promise<void>
}

export interface AuthDependencies {
  storage: StorageService
  /** Creates the session scope for a user. Passed in by `bootstrapApp`, which knows how to build it. */
  openSession: (user: User) => Session
}

const USER_KEY = 'auth.user'

class Auth extends Store<AuthState> implements AuthService {
  constructor(private readonly deps: AuthDependencies) {
    super({ status: 'signedOut' })
    logger.created('auth')
  }

  init() {
    return logger.traceInit('auth', async () => {
      await fakeLatency(200, 400) // pretend we're validating the stored token
      failIfRequested('auth')

      const user = this.deps.storage.get<User>(USER_KEY)
      if (user) {
        logger.info(`auth restored ${user.email} from storage`)
        this.signIn(user)
      }
    })
  }

  login = async (email: string) => {
    await fakeLatency(400, 700)
    const user: User = {
      id: email.toLowerCase(),
      email,
      name: displayNameFromEmail(email),
      token: crypto.randomUUID(),
    }
    this.deps.storage.set(USER_KEY, user)
    logger.info(`auth signed in ${email}`)
    this.signIn(user)
  }

  logout = async () => {
    this.deps.storage.remove(USER_KEY)
    logger.info('auth signed out')
    await this.closeSession()
  }

  async dispose() {
    await this.closeSession()
    this.clearListeners()
    logger.disposed('auth')
  }

  private signIn(user: User) {
    const session = this.deps.openSession(user)
    this.setState({ status: 'signedIn', user, session })
    // Not awaited: the session has its own loading state, and the UI shows placeholders meanwhile.
    void session.init()
  }

  private async closeSession() {
    const previous = this.getState()
    this.setState({ status: 'signedOut' }) // the UI stops using the session right away...
    if (previous.status === 'signedIn') await previous.session.dispose() // ...then it's torn down
  }
}

/** "claire.martin@clinic.org" → "Claire Martin" */
function displayNameFromEmail(email: string): string {
  return email
    .split('@')[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')
}

export function createAuthService(deps: AuthDependencies): AuthService {
  return new Auth(deps)
}
