import type { ApiClient, Encounter } from './apiClient'
import type { Logger } from './logger'
import type { NotifierService } from './notifier'
import type { Disposable } from './shared/disposable'
import { Store } from './shared/store'
import { createRecordingSession, type RecordingSession } from './recordingSession'

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
  startRecording(encounterId: string): void
  /** A recording belongs to the open encounter: opening another one (or none) disposes it. */
  openEncounter(encounterId: string | null): void
  disposeRecording(): void
}

export interface EncountersDependencies {
  apiClient: ApiClient
  notifier: NotifierService
  logger: Logger
}

class Encounters extends Store<EncountersState> implements EncountersService {
  constructor(private readonly deps: EncountersDependencies) {
    super({ list: [], recording: null })
    deps.logger.created('encounters')
  }

  init() {
    return this.deps.logger.traceInit('encounters', async () => {
      const list = await this.deps.apiClient.listEncounters()
      this.setState({ ...this.getState(), list })
    })
  }

  getById = (id: string) => this.getState().list.find((encounter) => encounter.id === id)

  startRecording = (encounterId: string) => {
    this.disposeRecording()
    const recording = createRecordingSession({
      encounterId,
      notifier: this.deps.notifier,
      logger: this.deps.logger.scope('feature'),
      onComplete: () => this.markCompleted(encounterId),
    })
    this.setState({ ...this.getState(), recording })
  }

  openEncounter = (encounterId: string | null) => {
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
    this.deps.logger.disposed('encounters')
  }

  private async markCompleted(encounterId: string) {
    try {
      const updated = await this.deps.apiClient.updateEncounter(encounterId, { status: 'completed' })
      const list = this.getState().list.map((e) => (e.id === encounterId ? updated : e))
      this.setState({ ...this.getState(), list })
    } catch (error) {
      this.deps.notifier.notify({ kind: 'error', message: (error as Error).message })
    }
  }
}

export function createEncountersService(deps: EncountersDependencies): EncountersService {
  return new Encounters(deps)
}
