import { createScope, type Disposable } from '#/services/shared/disposable'
import type { User } from '#/services/auth'
import { createApiClient, type ApiClient } from '#/services/apiClient'
import { createUserSettingsService, type UserSettingsService } from '#/services/userSettings'
import { createEncountersService, type EncountersService } from '#/services/encounters'
import type { AppServices } from './bootstrapApp'

export interface SessionServices extends Disposable {
  apiClient: ApiClient
  userSettings: UserSettingsService
  encounters: EncountersService
}

/**
 * Creates, wires and initializes the services that only exist while signed in.
 * Called by the session manager on sign-in; disposed on sign-out.
 */
export async function bootstrapSession(
  app: Pick<AppServices, 'logger' | 'storage' | 'notifier'>,
  user: User,
): Promise<SessionServices> {
  const logger = app.logger.scope('session')
  const scope = createScope()
  try {
    const apiClient = scope.add(createApiClient({ user, logger }))
    const userSettings = scope.add(
      createUserSettingsService({
        userId: user.id,
        apiClient,
        storage: app.storage,
        notifier: app.notifier,
        logger,
      }),
    )
    const encounters = scope.add(
      createEncountersService({ apiClient, notifier: app.notifier, logger }),
    )

    // Independent of each other: initialize concurrently.
    await Promise.all([userSettings.init(), encounters.init()])

    return { apiClient, userSettings, encounters, dispose: scope.dispose }
  } catch (error) {
    await scope.dispose()
    throw error
  }
}
