import { beforeEach, describe, expect, it, vi } from 'vitest'
import { testUser } from '#/test/fakes'
import { createApiClient } from './apiClient'

describe('apiClient', () => {
  beforeEach(() => {
    vi.useFakeTimers() // skip the fake network latency
  })

  async function settle<T>(promise: Promise<T>): Promise<T> {
    await vi.runAllTimersAsync()
    return promise
  }

  it('lists encounters without their notes', async () => {
    const api = createApiClient({ user: testUser })

    const encounters = await settle(api.listEncounters())

    expect(encounters.length).toBeGreaterThan(0)
    expect(encounters[0]).toEqual({
      id: 'enc-1',
      patientName: 'Emma Laurent',
      startedAt: expect.any(String),
      reason: 'Persistent cough',
      status: 'draft',
    })
    expect(encounters[0]).not.toHaveProperty('note')
  })

  it('fetches a note on its own, and an empty one for unknown encounters', async () => {
    const api = createApiClient({ user: testUser })

    expect(await settle(api.getEncounterNote('enc-1'))).toContain('Dry cough for 3 weeks')
    expect(await settle(api.getEncounterNote('missing'))).toBe('')
  })

  it('saves settings, and returns copies callers cannot mutate', async () => {
    const api = createApiClient({ user: testUser })

    await settle(api.saveSettings({ noteLanguage: 'fr', noteTemplate: 'narrative' }))
    const settings = await settle(api.getSettings())
    settings.noteLanguage = 'en'

    expect(await settle(api.getSettings())).toEqual({ noteLanguage: 'fr', noteTemplate: 'narrative' })
  })

  it('keeps each client’s data apart', async () => {
    const first = createApiClient({ user: testUser })
    const second = createApiClient({ user: testUser })

    await settle(first.saveSettings({ noteLanguage: 'fr', noteTemplate: 'narrative' }))

    expect(await settle(second.getSettings())).toEqual({ noteLanguage: 'en', noteTemplate: 'soap' })
  })

  it('refuses requests once disposed, in-flight ones included', async () => {
    const api = createApiClient({ user: testUser })
    const inFlight = api.listEncounters()
    const assertion = expect(inFlight).rejects.toThrow('apiClient disposed (GET /encounters)')

    api.dispose()
    await vi.runAllTimersAsync()

    await assertion
    await expect(api.getSettings()).rejects.toThrow('apiClient disposed (GET /settings)')
  })
})
