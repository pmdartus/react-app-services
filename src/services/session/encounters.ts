import type { ApiClient, Encounter } from './apiClient'
import type { Disposable } from '../shared/disposable'
import { Store } from '../shared/store'
import { failIfRequested } from '../shared/demoFlags'
import { logger as rootLogger } from '../global/logger'
import { notifier } from '../global/notifier'
import { reportError } from '../global/errorReporter'
import { createRecordingSession, type RecordingSession } from '../feature/recordingSession'

const logger = rootLogger.scope('session')

export type { Encounter }

export interface EncountersState {
  list: Encounter[]
  /** The feature scope: at most one recording at a time. */
  recording: RecordingSession | null
}

export interface EncountersService extends Disposable {
  init(): Promise<void>
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
  startRecording(encounterId: string): void
  /**
   * Called by the router when an encounter is opened (or none). Starts fetching its note,
   * and disposes a recording that belongs to another encounter.
   */
  openEncounter(encounterId: string | null): void
  disposeRecording(): void
}

export interface EncountersDependencies {
  apiClient: ApiClient
}

class Encounters extends Store<EncountersState> implements EncountersService {
  private readonly notes = new Map<string, Promise<string>>()

  constructor(private readonly deps: EncountersDependencies) {
    super({ list: [], recording: null })
    logger.created('encounters')
  }

  init() {
    return logger.traceInit('encounters', async () => {
      const list = await this.deps.apiClient.listEncounters()
      this.setState({ ...this.getState(), list })
    })
  }

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

  startRecording = (encounterId: string) => {
    this.disposeRecording()
    const recording = createRecordingSession({
      encounterId,
      onComplete: () => this.markCompleted(encounterId),
    })
    this.setState({ ...this.getState(), recording })
    recording.start()
  }

  openEncounter = (encounterId: string | null) => {
    if (encounterId) void this.getNote(encounterId).catch(() => {}) // render-as-you-fetch; errors surface where it's rendered
    const { recording } = this.getState()
    if (recording && recording.encounterId !== encounterId) this.disposeRecording()
  }

  disposeRecording = () => {
    const { recording } = this.getState()
    if (!recording) return
    this.setState({ ...this.getState(), recording: null })
    recording.dispose()
  }

  dispose() {
    this.disposeRecording() // cascading teardown: the feature scope goes first
    this.clearListeners()
    logger.disposed('encounters')
  }

  private async markCompleted(encounterId: string) {
    try {
      const updated = await this.deps.apiClient.updateEncounter(encounterId, { status: 'completed' })
      const list = this.getState().list.map((e) => (e.id === encounterId ? updated : e))
      this.setState({ ...this.getState(), list })
    } catch (error) {
      reportError(error, { action: 'encounters.markCompleted', encounterId })
      notifier.notify({ kind: 'error', message: (error as Error).message })
    }
  }
}

export function createEncountersService(deps: EncountersDependencies): EncountersService {
  return new Encounters(deps)
}
