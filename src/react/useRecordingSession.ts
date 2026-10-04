import { useSyncExternalStore } from 'react'
import { useEncounters } from './useEncounters'

const subscribeToNothing = () => () => {}
const getNothing = () => null

/** The active recording (if any), re-rendering on every tick. */
export function useRecordingSession() {
  const { recording } = useEncounters()
  const state = useSyncExternalStore(
    recording?.subscribe ?? subscribeToNothing,
    recording?.getState ?? getNothing,
  )
  if (!recording || !state) return null
  return { ...state, encounterId: recording.encounterId, stop: recording.stop }
}
