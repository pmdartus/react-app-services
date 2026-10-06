import type { ApiClient, UserSettings } from './apiClient'
import type { StorageService } from '../app/storage'
import type { Disposable } from '../shared/disposable'
import { Store } from '../shared/store'
import { failIfRequested } from '../shared/demoFlags'
import { logger as rootLogger } from '../global/logger'
import type { Notifier } from '../global/notifier'
import type { ReportError } from '../global/errorReporter'

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
  notifier: Notifier
  reportError: ReportError
}

class UserSettingsStore extends Store<UserSettings> implements UserSettingsService {
  private readonly logger = rootLogger.scope('session')
  // The fake backend forgets everything on logout, so local storage stands in for persistence.
  private readonly storageKey: string

  constructor(private readonly deps: UserSettingsDependencies) {
    super({ noteLanguage: 'en', noteTemplate: 'soap' })
    this.storageKey = `userSettings.${deps.userId}`
    this.logger.created('userSettings')
  }

  init() {
    return this.logger.traceInit('userSettings', async () => {
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
      this.deps.reportError(error, { action: 'userSettings.update' })
      this.deps.notifier.notify({ kind: 'error', message: `Could not save: ${(error as Error).message}` })
    }
  }

  dispose() {
    this.clearListeners()
    this.logger.disposed('userSettings')
  }
}

export function createUserSettingsService(deps: UserSettingsDependencies): UserSettingsService {
  return new UserSettingsStore(deps)
}
