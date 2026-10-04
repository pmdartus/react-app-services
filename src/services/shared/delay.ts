export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Fake network/disk latency between `min` and `max` milliseconds. */
export function fakeLatency(min: number, max: number): Promise<void> {
  return delay(min + Math.random() * (max - min))
}
