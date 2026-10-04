import { use, useSyncExternalStore } from 'react'
import { useSessionServices } from '#/context/SessionServicesContext'

export function useEncounters() {
  const { encounters } = useSessionServices()
  const state = useSyncExternalStore(encounters.subscribe, encounters.getState)
  return {
    ...state,
    getById: encounters.getById,
    startRecording: encounters.startRecording,
    invalidateNote: encounters.invalidateNote,
  }
}

/** Suspends until the note is loaded: render it under a `<Suspense>` with a placeholder. */
export function useEncounterNote(id: string): string {
  const { encounters } = useSessionServices()
  return use(encounters.getNote(id))
}
