import { useEncounters } from './useEncounters'
import { useOptionalStore } from './useOptionalStore'

/** The active recording (if any), re-rendering on every tick. */
export function useRecordingSession() {
  const { recording } = useEncounters()
  const state = useOptionalStore(recording)
  if (!recording || !state) return null
  return { ...state, encounterId: recording.encounterId, stop: recording.stop }
}
