import type { StorageService } from './storage'
import type { Disposable } from '../shared/disposable'
import { fakeLatency } from '../shared/delay'
import { failIfRequested } from '../shared/demoFlags'
import { logger as rootLogger } from '../global/logger'

export interface User {
  id: string
  email: string
  name: string
  token: string
}

/** Who is signed in. Plain data: the session that goes with it is owned by `sessionHost`. */
export type AuthState = { status: 'signedOut' } | { status: 'signedIn'; user: User }

/**
 * Fake authentication: who the user is, persisted across reloads. Any email works.
 * Knows nothing about sessions: `sessionHost` calls `signIn()` / `signOut()` and opens or closes
 * the session that goes with them.
 */
export interface AuthService extends Disposable {
  /** Restores the persisted user, if any. */
  init(): Promise<void>
  getState(): AuthState
  /**
   * Authenticates and persists the user. Resolves with the user, or with `null` when a later
   * `signIn()` or `signOut()` superseded this call: then it changes nothing.
   */
  signIn(email: string): Promise<User | null>
  /** Forgets the user. Also cancels an in-flight `signIn()`. */
  signOut(): void
}

export interface AuthDependencies {
  storage: StorageService
}

const USER_KEY = 'auth.user'

class Auth implements AuthService {
  private readonly logger = rootLogger.scope('app')
  private state: AuthState = { status: 'signedOut' }
  /** Bumped by every `signIn()` and `signOut()`: a `signIn()` only applies if it's still the latest call. */
  private generation = 0

  constructor(private readonly deps: AuthDependencies) {
    this.logger.created('auth')
  }

  init() {
    return this.logger.traceInit('auth', async () => {
      await fakeLatency(200, 400) // pretend we're validating the stored token
      failIfRequested('auth')

      const user = this.deps.storage.get<User>(USER_KEY)
      if (user) {
        this.logger.info(`auth restored ${user.email} from storage`)
        this.state = { status: 'signedIn', user }
      }
    })
  }

  getState = () => this.state

  signIn = async (email: string) => {
    const generation = ++this.generation
    await fakeLatency(400, 700)
    if (generation !== this.generation) {
      this.logger.info(`auth sign-in of ${email} superseded, ignored`)
      return null
    }
    const user: User = {
      id: email.toLowerCase(),
      email,
      name: displayNameFromEmail(email),
      token: crypto.randomUUID(),
    }
    this.deps.storage.set(USER_KEY, user)
    this.state = { status: 'signedIn', user }
    this.logger.info(`auth signed in ${email}`)
    return user
  }

  signOut = () => {
    this.generation++
    this.deps.storage.remove(USER_KEY)
    this.state = { status: 'signedOut' }
    this.logger.info('auth signed out')
  }

  dispose() {
    this.logger.disposed('auth')
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
