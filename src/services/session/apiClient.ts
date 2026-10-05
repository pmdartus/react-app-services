import type { User } from '../app/auth'
import type { Disposable } from '../shared/disposable'
import { fakeLatency } from '../shared/delay'
import { measure } from '../shared/perf'
import { logger as rootLogger } from '../global/logger'
import { SEED_ENCOUNTERS, SEED_SETTINGS } from './apiClient.seed'

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
  getSettings(): Promise<UserSettings>
  saveSettings(settings: UserSettings): Promise<UserSettings>
}

export interface ApiClientDependencies {
  user: User
}

class FakeApiClient implements ApiClient {
  private readonly logger = rootLogger.scope('session')
  private disposed = false
  private encounters = structuredClone(SEED_ENCOUNTERS)
  private settings = structuredClone(SEED_SETTINGS)

  constructor(deps: ApiClientDependencies) {
    this.logger.created('apiClient', `token for ${deps.user.email}`)
  }

  listEncounters() {
    return this.request('GET /encounters', () => this.encounters.map(({ note: _, ...encounter }) => encounter))
  }

  getEncounterNote(id: string) {
    return this.request(`GET /encounters/${id}/note`, () => this.encounters.find((e) => e.id === id)?.note ?? '', [600, 1200])
  }

  getSettings() {
    return this.request('GET /settings', () => this.settings)
  }

  saveSettings(settings: UserSettings) {
    return this.request('PUT /settings', () => (this.settings = settings))
  }

  dispose() {
    this.disposed = true
    this.logger.disposed('apiClient')
  }

  /** Every call: check we're alive, log, wait, check again (we may have been disposed meanwhile). */
  private async request<T>(endpoint: string, handler: () => T, [min, max] = [200, 500]): Promise<T> {
    this.assertNotDisposed(endpoint)
    const start = performance.now()
    this.logger.info(`apiClient → ${endpoint}`)

    try {
      await fakeLatency(min, max)
      this.assertNotDisposed(endpoint)

      const result = structuredClone(handler())
      const ms = measure(endpoint, start, { track: 'apiClient' })
      this.logger.info(`apiClient ← ${endpoint} 200 (${Math.round(ms)}ms)`)
      return result
    } catch (error) {
      measure(`${endpoint} ✗`, start, { track: 'apiClient', color: 'error' })
      throw error
    }
  }

  private assertNotDisposed(endpoint: string) {
    if (this.disposed) throw new Error(`apiClient disposed (${endpoint})`)
  }
}

export function createApiClient(deps: ApiClientDependencies): ApiClient {
  return new FakeApiClient(deps)
}
