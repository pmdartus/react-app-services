import type { Disposable } from '../shared/disposable'
import { measured } from '../shared/perf'
import { createStorageService, type StorageService } from './storage'
import { createAuthService, type AuthService } from './auth'
import { createSessionHost, type SessionHost } from './sessionHost'
import type { Notifier } from '../global/notifier'
import type { ReportError } from '../global/errorReporter'

/** The globals services use, handed in by the entry point. React code imports them directly instead. */
export interface AppDependencies {
  notifier: Notifier
  reportError: ReportError
}

/**
 * App-scoped services: created once, before React renders, and injected.
 * (`logger`, `notifier` and `reportError` aren't here: they're globals, created by the entry point.)
 */
export interface AppServices extends Disposable {
  storage: StorageService
  /** Read-only: signing in and out goes through `sessionHost`, which keeps the session in step. */
  auth: Pick<AuthService, 'getState'>
  sessionHost: SessionHost
}

/**
 * Creates, wires and initializes the app-scoped services. Runs once, before React renders.
 * Resolves only when every service is initialized.
 */
export async function bootstrapApp({ notifier, reportError }: AppDependencies): Promise<AppServices> {
  // 1. Wire: constructors only store their dependencies, nothing runs yet.
  const storage = createStorageService()
  const auth = createAuthService({ storage })
  const sessionHost = createSessionHost({ auth, storage, notifier, reportError })

  const services: AppServices = {
    storage,
    auth,
    sessionHost,
    async dispose() {
      // Reverse creation order. `sessionHost` closes the current session first.
      await sessionHost.dispose()
      await auth.dispose()
      await storage.dispose()
    },
  }

  // 2. Initialize, in dependency order.
  try {
    await measured('bootstrapApp init', 'app', async () => {
      await storage.init()
      await auth.init() // restores the user from storage...
      await sessionHost.init() // ...and this opens their session
    })
  } catch (error) {
    await services.dispose()
    throw error
  }

  return services
}
