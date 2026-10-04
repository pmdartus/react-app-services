import type { Disposable } from '#/services/shared/disposable'
import { createLogger, type Logger } from '#/services/logger'
import { createNotifier, type NotifierService } from '#/services/notifier'
import { createStorageService, type StorageService } from '#/services/storage'
import { createAuthService, type AuthService } from '#/services/auth'
import { createSessionManager, type SessionManager } from '#/services/session'
import { bootstrapSession } from './bootstrapSession'

export interface AppServices extends Disposable {
  logger: Logger
  storage: StorageService
  notifier: NotifierService
  auth: AuthService
  session: SessionManager
}

/**
 * Creates, wires and initializes the app-scoped services. Runs once, before React renders.
 * Resolves only when every service is initialized.
 */
export async function bootstrapApp(): Promise<AppServices> {
  // 1. Wire: constructors only store their dependencies, nothing runs yet.
  const logger = createLogger('app')
  const notifier = createNotifier({ logger })
  const storage = createStorageService({ logger })
  const auth = createAuthService({ storage, logger })
  const session = createSessionManager({
    auth,
    logger,
    bootstrapSession: (user) => bootstrapSession({ logger, storage, notifier }, user),
  })

  const services: AppServices = {
    logger,
    storage,
    notifier,
    auth,
    session,
    async dispose() {
      // Reverse creation order.
      await session.dispose()
      await auth.dispose()
      await storage.dispose()
      await notifier.dispose()
      await logger.dispose()
    },
  }

  // 2. Initialize, in dependency order.
  try {
    await storage.init()
    await auth.init() // restores the user from storage
    await session.init() // if a user was restored, starts bootstrapping the session scope
  } catch (error) {
    await services.dispose()
    throw error
  }

  return services
}
