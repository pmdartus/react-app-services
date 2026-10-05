import type { ApiClient, Encounter } from './apiClient'
import type { Disposable } from '../shared/disposable'
import { Store } from '../shared/store'
import { failIfRequested } from '../shared/demoFlags'
import { logger as rootLogger } from '../global/logger'

export type { Encounter }

export interface EncountersState {
  list: Encounter[]
}

export interface EncountersService extends Disposable {
  /**
   * Loads the list, on first call. Called by the router before showing the encounters screens.
   * Returns the same promise while it's loading or once loaded. A failed load is forgotten, so calling again retries it.
   */
  loadList(): Promise<void>
  subscribe(listener: () => void): () => void
  getState(): EncountersState
  getById(id: string): Encounter | undefined
  /**
   * Fetched on first call, then cached for the rest of the session (notes are read-only here).
   * Returns the *same* promise every time, so a component can `use()` it and suspend while it loads.
   * A failed fetch stays cached (React re-renders after a rejection and must see the same promise)
   * until `invalidateNote()`.
   */
  getNote(id: string): Promise<string>
  /** Drops a cached note, so the next `getNote()` fetches it again. Used to retry a failed fetch. */
  invalidateNote(id: string): void
  /** Called by the router when an encounter is opened. Starts fetching its note. */
  openEncounter(encounterId: string): void
}

export interface EncountersDependencies {
  apiClient: ApiClient
}

class Encounters extends Store<EncountersState> implements EncountersService {
  private readonly logger = rootLogger.scope('session')
  private list: Promise<void> | null = null
  private readonly notes = new Map<string, Promise<string>>()

  constructor(private readonly deps: EncountersDependencies) {
    super({ list: [] })
    this.logger.created('encounters')
  }

  loadList = () => (this.list ??= this.fetchList())

  getById = (id: string) => this.getState().list.find((encounter) => encounter.id === id)

  getNote = (id: string) => {
    let note = this.notes.get(id)
    if (!note) {
      note = this.deps.apiClient.getEncounterNote(id).then((text) => {
        failIfRequested('note')
        return text
      })
      this.notes.set(id, note)
    }
    return note
  }

  invalidateNote = (id: string) => {
    this.notes.delete(id)
  }

  openEncounter = (encounterId: string) => {
    void this.getNote(encounterId).catch(() => {}) // render-as-you-fetch; errors surface where it's rendered
  }

  dispose() {
    this.clearListeners()
    this.logger.disposed('encounters')
  }

  private async fetchList() {
    try {
      const list = await this.deps.apiClient.listEncounters()
      failIfRequested('encounters')
      this.setState({ ...this.getState(), list })
    } catch (error) {
      this.list = null // not cached: the next `loadList()` retries
      throw error
    }
  }
}

export function createEncountersService(deps: EncountersDependencies): EncountersService {
  return new Encounters(deps)
}
