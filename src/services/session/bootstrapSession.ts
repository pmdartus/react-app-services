import type { Disposable } from '../shared/disposable'
import { measured } from '../shared/perf'
import type { User } from '../app/auth'
import type { StorageService } from '../app/storage'
import type { Notifier } from '../global/notifier'
import type { ReportError } from '../global/errorReporter'
import { createApiClient, type ApiClient } from './apiClient'
import { createUserSettingsService, type UserSettingsService } from './userSettings'

/** Session-scoped services: they only exist while signed in. */
export interface SessionServices extends Disposable {
  apiClient: ApiClient
  userSettings: UserSettingsService
}

export interface SessionBootstrapDependencies {
  user: User
  storage: StorageService
  notifier: Notifier
  reportError: ReportError
}

/**
 * Creates, wires and initializes the session services.
 * Called by `Session` on sign-in; disposed on sign-out.
 */
export async function bootstrapSession({ user, storage, notifier, reportError }: SessionBootstrapDependencies): Promise<SessionServices> {
  // 1. Wire.
  const apiClient = createApiClient({ user })
  const userSettings = createUserSettingsService({ userId: user.id, apiClient, storage, notifier, reportError })

  const services: SessionServices = {
    apiClient,
    userSettings,
    async dispose() {
      // Reverse creation order.
      await userSettings.dispose()
      await apiClient.dispose()
    },
  }

  // 2. Initialize what every screen needs. Data that only some screens need (encounters, notes)
  // is loaded and cached by their routes instead.
  try {
    await measured('bootstrapSession init', 'session', () => userSettings.init())
  } catch (error) {
    await services.dispose()
    throw error
  }

  return services
}
