import { beforeEach, describe, expect, it, vi } from 'vitest'
import { testUser } from '#/test/fixtures'
import { mockNotifier, mockReportError, mockStorage } from '#/test/mocks'
import { settle } from '#/test/timers'
import { bootstrapSession } from './bootstrapSession'

describe('bootstrapSession', () => {
  beforeEach(() => {
    vi.useFakeTimers() // skip the fake network latency
  })

  function deps(storage = mockStorage()) {
    return { user: testUser, storage, notifier: mockNotifier(), reportError: mockReportError() }
  }

  it('resolves with initialized services', async () => {
    const storage = mockStorage({ [`userSettings.${testUser.id}`]: { noteLanguage: 'fr' } })

    const services = await settle(bootstrapSession(deps(storage)))

    expect(services.userSettings.getState()).toEqual({ noteLanguage: 'fr', noteTemplate: 'soap' })
    await expect(settle(services.apiClient.listEncounters())).resolves.not.toHaveLength(0)
  })

  it('makes the services unusable once disposed', async () => {
    const services = await settle(bootstrapSession(deps()))

    await services.dispose()

    await expect(services.apiClient.listEncounters()).rejects.toThrow('apiClient disposed')
  })

  it('rejects when a service fails to initialize', async () => {
    const storage = mockStorage()
    storage.get = () => {
      throw new Error('storage unavailable')
    }

    await expect(settle(bootstrapSession(deps(storage)))).rejects.toThrow('storage unavailable')
  })
})
