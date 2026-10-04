import { createScope, type Disposable } from '#/services/shared/disposable'
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
 * Creates, wires and initializes the app-scoped services, top to bottom.
 * Runs once, before React renders. Disposal happens in reverse creation order.
 */
export async function bootstrapApp(): Promise<AppServices> {
  const scope = createScope()
  try {
    const logger = scope.add(createLogger('app'))
    const notifier = scope.add(createNotifier({ logger }))

    const storage = scope.add(createStorageService({ logger }))
    await storage.init()

    const auth = scope.add(createAuthService({ storage, logger }))
    await auth.init()

    const session = scope.add(
      createSessionManager({
        auth,
        logger,
        bootstrapSession: (user) => bootstrapSession({ logger, storage, notifier }, user),
      }),
    )
    await session.init() // if auth restored a user, starts bootstrapping the session scope

    return { logger, storage, notifier, auth, session, dispose: scope.dispose }
  } catch (error) {
    await scope.dispose() // undo whatever was created before the failure
    throw error
  }
}
