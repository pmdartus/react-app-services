/** Anything that owns resources (timers, subscriptions, connections) and must be torn down. */
export interface Disposable {
  dispose(): void | Promise<void>
}

/**
 * Records disposables in creation order and disposes them in reverse order,
 * like a `DisposableStack`. Used by the bootstrap functions.
 */
export interface Scope extends Disposable {
  add<T extends Disposable>(disposable: T): T
}

export function createScope(): Scope {
  const stack: Disposable[] = []
  return {
    add(disposable) {
      stack.push(disposable)
      return disposable
    },
    async dispose() {
      while (stack.length > 0) {
        try {
          await stack.pop()!.dispose()
        } catch (error) {
          console.error('Error while disposing', error)
        }
      }
    },
  }
}
