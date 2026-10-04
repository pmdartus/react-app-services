/**
 * Demo-only switches read once from the URL.
 *
 * `?fail=<serviceName>` makes that service (or step) throw, on the first
 * attempt only, so the Retry button can then succeed.
 */
const failingService = new URLSearchParams(window.location.search).get('fail')
let hasFailed = false

export function failIfRequested(serviceName: string): void {
  if (failingService !== serviceName || hasFailed) return
  hasFailed = true
  throw new Error(`${serviceName} failed (simulated with ?fail=${serviceName})`)
}
