import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeNotifier, fakeReportError, fakeStorage, testUser } from '#/test/fakes'
import { bootstrapSession } from './bootstrapSession'

describe('bootstrapSession', () => {
  beforeEach(() => {
    vi.useFakeTimers() // skip the fake network latency
  })

  async function settle<T>(promise: Promise<T>): Promise<T> {
    await vi.runAllTimersAsync()
    return promise
  }

  function deps(storage = fakeStorage()) {
    return { user: testUser, storage, notifier: fakeNotifier(), reportError: fakeReportError() }
  }

  it('resolves with initialized services', async () => {
    const storage = fakeStorage({ [`userSettings.${testUser.id}`]: { noteLanguage: 'fr' } })

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
    const storage = fakeStorage()
    storage.get = () => {
      throw new Error('storage unavailable')
    }

    const bootstrap = bootstrapSession(deps(storage))
    const assertion = expect(bootstrap).rejects.toThrow('storage unavailable')
    await vi.runAllTimersAsync()
    await assertion
  })
})
