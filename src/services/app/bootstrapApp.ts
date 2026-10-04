import type { Disposable } from '../shared/disposable'
import { createStorageService, type StorageService } from './storage'
import { createAuthService, type AuthService } from './auth'

/**
 * App-scoped services: created once, before React renders, and injected.
 * (`logger`, `notifier` and `reportError` aren't here: they're global singletons, imported directly.)
 */
export interface AppServices extends Disposable {
  storage: StorageService
  auth: AuthService
}

/**
 * Creates, wires and initializes the app-scoped services. Runs once, before React renders.
 * Resolves only when every service is initialized.
 */
export async function bootstrapApp(): Promise<AppServices> {
  // 1. Wire: constructors only store their dependencies, nothing runs yet.
  const storage = createStorageService()
  const auth = createAuthService({ storage })

  const services: AppServices = {
    storage,
    auth,
    async dispose() {
      // Reverse creation order. `auth` closes the current session first.
      await auth.dispose()
      await storage.dispose()
    },
  }

  // 2. Initialize, in dependency order.
  try {
    await storage.init()
    await auth.init() // restores the user from storage, which opens a session
  } catch (error) {
    await services.dispose()
    throw error
  }

  return services
}
