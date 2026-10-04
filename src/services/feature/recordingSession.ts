import type { Disposable } from '../shared/disposable'
import { Store } from '../shared/store'
import { logger as rootLogger } from '../global/logger'
import { notifier } from '../global/notifier'

const logger = rootLogger.scope('feature')

export interface RecordingState {
  status: 'recording' | 'stopped'
  elapsedMs: number
  transcript: string[]
}

/** Feature-scoped service: one instance per recording, owned by `encounters`. */
export interface RecordingSession extends Disposable {
  readonly encounterId: string
  subscribe(listener: () => void): () => void
  getState(): RecordingState
  stop(): void
}

export interface RecordingSessionDependencies {
  encounterId: string
  onComplete: (transcript: string[]) => void
}

const TICK_MS = 250
const LINE_EVERY_MS = 2000
const FAKE_TRANSCRIPT = [
  'Doctor: Good morning, what brings you in today?',
  "Patient: I've been having this issue for a few weeks now.",
  'Doctor: Has it been getting worse, or staying about the same?',
  'Patient: A bit worse, especially in the evenings.',
  'Doctor: Any fever, weight loss, or trouble sleeping?',
  'Patient: No fever. Sleep is okay most nights.',
  'Doctor: Are you taking any medication at the moment?',
  'Patient: Just something over the counter, now and then.',
  "Doctor: Okay. Let's take a look, then we'll talk about next steps.",
]

class Recording extends Store<RecordingState> implements RecordingSession {
  readonly encounterId: string
  private readonly startedAt = Date.now()
  private readonly interval: ReturnType<typeof setInterval>

  constructor(private readonly deps: RecordingSessionDependencies) {
    super({ status: 'recording', elapsedMs: 0, transcript: [] })
    this.encounterId = deps.encounterId
    this.interval = setInterval(this.tick, TICK_MS)
    logger.created('recordingSession', `encounter ${deps.encounterId}`)
  }

  stop = () => {
    if (this.getState().status !== 'recording') return
    clearInterval(this.interval)
    this.setState({ ...this.getState(), status: 'stopped' })
    notifier.notify({ kind: 'success', message: 'Recording saved' })
    this.deps.onComplete(this.getState().transcript)
  }

  dispose() {
    clearInterval(this.interval)
    if (this.getState().status === 'recording') {
      notifier.notify({ kind: 'info', message: 'Recording discarded' })
    }
    this.clearListeners()
    logger.disposed('recordingSession')
  }

  private tick = () => {
    const elapsedMs = Date.now() - this.startedAt
    let { transcript } = this.getState()
    if (Math.floor(elapsedMs / LINE_EVERY_MS) > transcript.length) {
      transcript = [...transcript, FAKE_TRANSCRIPT[transcript.length % FAKE_TRANSCRIPT.length]]
    }
    this.setState({ status: 'recording', elapsedMs, transcript })
  }
}

export function createRecordingSession(deps: RecordingSessionDependencies): RecordingSession {
  return new Recording(deps)
}
