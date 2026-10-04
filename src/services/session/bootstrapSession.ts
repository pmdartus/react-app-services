import type { Disposable } from '../shared/disposable'
import type { User } from '../app/auth'
import type { StorageService } from '../app/storage'
import { createApiClient, type ApiClient } from './apiClient'
import { createUserSettingsService, type UserSettingsService } from './userSettings'
import { createEncountersService, type EncountersService } from './encounters'

/** Session-scoped services: they only exist while signed in. */
export interface SessionServices extends Disposable {
  apiClient: ApiClient
  userSettings: UserSettingsService
  encounters: EncountersService
}

/**
 * Creates, wires and initializes the session services.
 * Called by `Session` on sign-in; disposed on sign-out.
 */
export async function bootstrapSession({ user, storage }: { user: User; storage: StorageService }): Promise<SessionServices> {
  // 1. Wire.
  const apiClient = createApiClient({ user })
  const userSettings = createUserSettingsService({ userId: user.id, apiClient, storage })
  const encounters = createEncountersService({ apiClient })

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
