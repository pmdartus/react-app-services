import type { Logger } from './logger'
import type { StorageService } from './storage'
import type { Disposable } from './shared/disposable'
import { Store } from './shared/store'
import { fakeLatency } from './shared/delay'
import { failIfRequested } from './shared/demoFlags'

export interface User {
  id: string
  email: string
  name: string
  token: string
}

export type AuthState = { status: 'signedOut' } | { status: 'signedIn'; user: User }

/** Fake authentication. Any email works; the user is persisted across reloads. */
export interface AuthService extends Disposable {
  init(): Promise<void>
  subscribe(listener: () => void): () => void
  getState(): AuthState
  login(email: string): Promise<void>
  logout(): void
}

export interface AuthDependencies {
  storage: StorageService
  logger: Logger
}

const USER_KEY = 'auth.user'

class Auth extends Store<AuthState> implements AuthService {
  constructor(private readonly deps: AuthDependencies) {
    super({ status: 'signedOut' })
    deps.logger.created('auth')
  }

  init() {
    return this.deps.logger.traceInit('auth', async () => {
      await fakeLatency(200, 400) // pretend we're validating the stored token
      failIfRequested('auth')

      const user = this.deps.storage.get<User>(USER_KEY)
      if (user) {
        this.deps.logger.info(`auth restored ${user.email} from storage`)
        this.setState({ status: 'signedIn', user })
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
    this.deps.logger.info(`auth signed in ${email}`)
    this.setState({ status: 'signedIn', user })
  }

  logout = () => {
    this.deps.storage.remove(USER_KEY)
    this.deps.logger.info('auth signed out')
    this.setState({ status: 'signedOut' })
  }

  dispose() {
    this.clearListeners()
    this.deps.logger.disposed('auth')
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
