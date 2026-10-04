import type { Disposable } from '#/services/shared/disposable'
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
  // 1. Wire.
  const logger = app.logger.scope('session')
  const apiClient = createApiClient({ user, logger })
  const userSettings = createUserSettingsService({
    userId: user.id,
    apiClient,
    storage: app.storage,
    notifier: app.notifier,
    logger,
  })
  const encounters = createEncountersService({ apiClient, notifier: app.notifier, logger })

  const services: SessionServices = {
    apiClient,
    userSettings,
    encounters,
    async dispose() {
      // Reverse creation order. `encounters` disposes its active recording first.
      await encounters.dispose()
      await userSettings.dispose()
      await apiClient.dispose()
    },
  }

  // 2. Initialize. These two are independent of each other: run them concurrently.
  try {
    await Promise.all([userSettings.init(), encounters.init()])
  } catch (error) {
    await services.dispose()
    throw error
  }

  return services
}
