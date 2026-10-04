/**
 * Minimal reactive state holder, compatible with React's `useSyncExternalStore`:
 * `getState` returns the same reference until `setState` is called with a new value.
 */
export class Store<T> {
  #state: T
  #listeners = new Set<() => void>()

  constructor(initialState: T) {
    this.#state = initialState
  }

  getState = (): T => this.#state

  subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener)
    return () => this.#listeners.delete(listener)
  }

  protected setState(next: T): void {
    if (Object.is(next, this.#state)) return
    this.#state = next
    for (const listener of this.#listeners) listener()
  }

  /** Drop all subscribers. Call it from `dispose()`. */
  protected clearListeners(): void {
    this.#listeners.clear()
  }
}
