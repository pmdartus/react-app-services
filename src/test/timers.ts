import { vi } from 'vitest'

/**
 * Runs the pending timers (services fake their latency with `setTimeout`), then returns the promise.
 * Needs `vi.useFakeTimers()`. Works for promises expected to reject too: `expect(settle(p)).rejects`.
 */
export async function settle<T>(promise: Promise<T>): Promise<T> {
  promise.catch(() => {}) // the caller handles it: don't report it as unhandled while the timers run
  await vi.runAllTimersAsync()
  return promise
}
