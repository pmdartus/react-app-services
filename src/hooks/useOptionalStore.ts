import { useSyncExternalStore } from 'react'

interface ReadableStore<T> {
  subscribe(listener: () => void): () => void
  getState(): T
}

const subscribeToNothing = () => () => {}
const getNothing = () => null

/** `useSyncExternalStore` for a store that may not exist (e.g. no session yet). */
export function useOptionalStore<T>(store: ReadableStore<T> | null): T | null {
  return useSyncExternalStore(store?.subscribe ?? subscribeToNothing, store?.getState ?? getNothing)
}
