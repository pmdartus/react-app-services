import type { ApiClient, UserSettings } from './apiClient'
import type { Logger } from './logger'
import type { NotifierService } from './notifier'
import type { StorageService } from './storage'
import type { Disposable } from './shared/disposable'
import { Store } from './shared/store'
import { failIfRequested } from './shared/demoFlags'

export type { UserSettings }

/** The signed-in user's preferences. Drives the Preferences tab. */
export interface UserSettingsService extends Disposable {
  init(): Promise<void>
  subscribe(listener: () => void): () => void
  getState(): UserSettings
  update(patch: Partial<UserSettings>): Promise<void>
}

export interface UserSettingsDependencies {
  userId: string
  apiClient: ApiClient
  storage: StorageService
  notifier: NotifierService
  logger: Logger
}

class UserSettingsStore extends Store<UserSettings> implements UserSettingsService {
  // The fake backend forgets everything on logout, so local storage stands in for persistence.
  private readonly storageKey: string

  constructor(private readonly deps: UserSettingsDependencies) {
    super({ noteLanguage: 'en', noteTemplate: 'soap' })
    this.storageKey = `userSettings.${deps.userId}`
    deps.logger.created('userSettings')
  }

  init() {
    return this.deps.logger.traceInit('userSettings', async () => {
      const remote = await this.deps.apiClient.getSettings()
      failIfRequested('userSettings')
      this.setState({ ...remote, ...this.deps.storage.get<UserSettings>(this.storageKey) })
    })
  }

  update = async (patch: Partial<UserSettings>) => {
    const previous = this.getState()
    this.setState({ ...previous, ...patch }) // optimistic
    try {
      const saved = await this.deps.apiClient.saveSettings(this.getState())
      this.deps.storage.set(this.storageKey, saved)
      this.deps.notifier.notify({ kind: 'success', message: 'Preferences saved' })
    } catch (error) {
      this.setState(previous)
      this.deps.notifier.notify({ kind: 'error', message: `Could not save: ${(error as Error).message}` })
    }
  }

  dispose() {
    this.clearListeners()
    this.deps.logger.disposed('userSettings')
  }
}

export function createUserSettingsService(deps: UserSettingsDependencies): UserSettingsService {
  return new UserSettingsStore(deps)
}
