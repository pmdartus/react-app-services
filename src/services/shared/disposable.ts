/** Anything that owns resources (timers, subscriptions, connections) and must be torn down. */
export interface Disposable {
  dispose(): void | Promise<void>
}
