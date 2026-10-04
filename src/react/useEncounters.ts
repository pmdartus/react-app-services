import { useSyncExternalStore } from 'react'
import { useSessionServices } from './useSession'

export function useEncounters() {
  const { encounters } = useSessionServices()
  const state = useSyncExternalStore(encounters.subscribe, encounters.getState)
  return {
    ...state,
    getById: encounters.getById,
    startRecording: encounters.startRecording,
  }
}
