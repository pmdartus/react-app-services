import type { User } from './auth'
import type { Logger } from './logger'
import type { Disposable } from './shared/disposable'
import { fakeLatency } from './shared/delay'
import { SEED_ENCOUNTERS, SEED_SETTINGS } from './apiClient.seed'

export interface Encounter {
  id: string
  patientName: string
  startedAt: string
  reason: string
  status: 'draft' | 'completed'
  note: string
}

export interface UserSettings {
  noteLanguage: 'en' | 'fr'
  noteTemplate: 'soap' | 'narrative'
}

/** Fake backend. Exists only while signed in; unusable once disposed. */
export interface ApiClient extends Disposable {
  listEncounters(): Promise<Encounter[]>
  updateEncounter(id: string, patch: Partial<Encounter>): Promise<Encounter>
  getSettings(): Promise<UserSettings>
  saveSettings(settings: UserSettings): Promise<UserSettings>
}

export interface ApiClientDependencies {
  user: User
  logger: Logger
}

class FakeApiClient implements ApiClient {
  private disposed = false
  private encounters = structuredClone(SEED_ENCOUNTERS)
  private settings = structuredClone(SEED_SETTINGS)

  constructor(private readonly deps: ApiClientDependencies) {
    deps.logger.created('apiClient', `token for ${deps.user.email}`)
  }

  listEncounters() {
    return this.request('GET /encounters', () => this.encounters)
  }

  updateEncounter(id: string, patch: Partial<Encounter>) {
    return this.request(`PATCH /encounters/${id}`, () => {
      this.encounters = this.encounters.map((e) => (e.id === id ? { ...e, ...patch } : e))
      return this.encounters.find((e) => e.id === id)!
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
    this.deps.logger.disposed('apiClient')
  }

  /** Every call: check we're alive, log, wait, check again (we may have been disposed meanwhile). */
  private async request<T>(endpoint: string, handler: () => T): Promise<T> {
    this.assertNotDisposed(endpoint)
    const start = performance.now()
    this.deps.logger.info(`apiClient → ${endpoint}`)

    await fakeLatency(200, 500)
    this.assertNotDisposed(endpoint)

    const result = structuredClone(handler())
    this.deps.logger.info(`apiClient ← ${endpoint} 200 (${Math.round(performance.now() - start)}ms)`)
    return result
  }

  private assertNotDisposed(endpoint: string) {
    if (this.disposed) throw new Error(`apiClient disposed (${endpoint})`)
  }
}

export function createApiClient(deps: ApiClientDependencies): ApiClient {
  return new FakeApiClient(deps)
}
