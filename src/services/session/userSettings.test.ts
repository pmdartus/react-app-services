import { describe, expect, it, vi } from 'vitest'
import { mockNotifier, mockReportError, mockStorage } from '#/test/mocks'
import type { ApiClient, UserSettings } from './apiClient'
import { createUserSettingsService } from './userSettings'

const REMOTE: UserSettings = { noteLanguage: 'en', noteTemplate: 'soap' }

function mockApiClient(): ApiClient {
  return {
    listEncounters: vi.fn(),
    getEncounterNote: vi.fn(),
    getSettings: vi.fn(async () => REMOTE),
    saveSettings: vi.fn(async (settings: UserSettings) => settings),
    dispose: vi.fn(),
  }
}

function setup(stored: Record<string, unknown> = {}) {
  const deps = {
    userId: 'claire',
    apiClient: mockApiClient(),
    storage: mockStorage(stored),
    notifier: mockNotifier(),
    reportError: mockReportError(),
  }
  return { userSettings: createUserSettingsService(deps), ...deps }
}

describe('userSettings', () => {
  it('loads the remote settings, overridden by the ones saved locally for this user', async () => {
    const { userSettings } = setup({
      'userSettings.claire': { noteLanguage: 'fr' },
      'userSettings.someone-else': { noteTemplate: 'narrative' },
    })

    await userSettings.init()

    expect(userSettings.getState()).toEqual({ noteLanguage: 'fr', noteTemplate: 'soap' })
  })

  it('applies an update right away, then saves it and says so', async () => {
    const { userSettings, apiClient, storage, notifier } = setup()
    await userSettings.init()
    const listener = vi.fn()
    userSettings.subscribe(listener)

    const saving = userSettings.update({ noteTemplate: 'narrative' })
    expect(userSettings.getState()).toEqual({ noteLanguage: 'en', noteTemplate: 'narrative' }) // optimistic
    expect(listener).toHaveBeenCalledOnce()
    await saving

    expect(apiClient.saveSettings).toHaveBeenCalledWith({ noteLanguage: 'en', noteTemplate: 'narrative' })
    expect(storage.get('userSettings.claire')).toEqual({ noteLanguage: 'en', noteTemplate: 'narrative' })
    expect(notifier.notify).toHaveBeenCalledWith({ kind: 'success', message: 'Preferences saved' })
  })

  it('rolls back a failed update, reports it and tells the user', async () => {
    const { userSettings, apiClient, storage, notifier, reportError } = setup()
    await userSettings.init()
    vi.mocked(apiClient.saveSettings).mockRejectedValueOnce(new Error('offline'))

    await userSettings.update({ noteLanguage: 'fr' })

    expect(userSettings.getState()).toEqual(REMOTE)
    expect(storage.set).not.toHaveBeenCalled()
    expect(reportError).toHaveBeenCalledWith(expect.any(Error), { action: 'userSettings.update' })
    expect(notifier.notify).toHaveBeenCalledWith({ kind: 'error', message: 'Could not save: offline' })
  })

  it('stops notifying subscribers once disposed', async () => {
    const { userSettings } = setup()
    await userSettings.init()
    const listener = vi.fn()
    userSettings.subscribe(listener)

    userSettings.dispose()
    await userSettings.update({ noteLanguage: 'fr' })

    expect(listener).not.toHaveBeenCalled()
  })
})
