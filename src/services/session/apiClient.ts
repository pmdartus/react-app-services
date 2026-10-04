import type { User } from '../app/auth'
import type { Disposable } from '../shared/disposable'
import { fakeLatency } from '../shared/delay'
import { logger as rootLogger } from '../global/logger'
import { SEED_ENCOUNTERS, SEED_SETTINGS } from './apiClient.seed'

const logger = rootLogger.scope('session')

/** What the list shows. The note is heavier and fetched on its own, when an encounter is opened. */
export interface Encounter {
  id: string
  patientName: string
  startedAt: string
  reason: string
  status: 'draft' | 'completed'
}

export interface UserSettings {
  noteLanguage: 'en' | 'fr'
  noteTemplate: 'soap' | 'narrative'
}

/** Fake backend. Exists only while signed in; unusable once disposed. */
export interface ApiClient extends Disposable {
  listEncounters(): Promise<Encounter[]>
  getEncounterNote(id: string): Promise<string>
  updateEncounter(id: string, patch: Partial<Encounter>): Promise<Encounter>
  getSettings(): Promise<UserSettings>
  saveSettings(settings: UserSettings): Promise<UserSettings>
}

export interface ApiClientDependencies {
  user: User
}

class FakeApiClient implements ApiClient {
  private disposed = false
  private encounters = structuredClone(SEED_ENCOUNTERS)
  private settings = structuredClone(SEED_SETTINGS)

  constructor(deps: ApiClientDependencies) {
    logger.created('apiClient', `token for ${deps.user.email}`)
  }

  listEncounters() {
    return this.request('GET /encounters', () => this.encounters.map(({ note: _, ...encounter }) => encounter))
  }

  getEncounterNote(id: string) {
    return this.request(`GET /encounters/${id}/note`, () => this.encounters.find((e) => e.id === id)?.note ?? '', [600, 1200])
  }

  updateEncounter(id: string, patch: Partial<Encounter>) {
    return this.request(`PATCH /encounters/${id}`, () => {
      this.encounters = this.encounters.map((e) => (e.id === id ? { ...e, ...patch } : e))
      const { note: _, ...updated } = this.encounters.find((e) => e.id === id)!
      return updated
    })
  }

  getSettings() {
    return this.request('GET /settings', () => this.settings)
  }

  saveSettings(settings: UserSettings) {
    return this.request('PUT /settings', () => (this.settings = settings))
  }

  dispose() {
    this.disposed = true
    logger.disposed('apiClient')
  }

  /** Every call: check we're alive, log, wait, check again (we may have been disposed meanwhile). */
  private async request<T>(endpoint: string, handler: () => T, [min, max] = [200, 500]): Promise<T> {
    this.assertNotDisposed(endpoint)
    const start = performance.now()
    logger.info(`apiClient → ${endpoint}`)

    await fakeLatency(min, max)
    this.assertNotDisposed(endpoint)

    const result = structuredClone(handler())
    logger.info(`apiClient ← ${endpoint} 200 (${Math.round(performance.now() - start)}ms)`)
    return result
  }

  private assertNotDisposed(endpoint: string) {
    if (this.disposed) throw new Error(`apiClient disposed (${endpoint})`)
  }
}

export function createApiClient(deps: ApiClientDependencies): ApiClient {
  return new FakeApiClient(deps)
}
