import { logger } from './logger'

/**
 * Stand-in for Sentry, Datadog & co. A module singleton: any code that catches
 * an error it can't handle calls `reportError()`, React or not.
 */
export function reportError(error: unknown, context: Record<string, unknown> = {}): void {
  const message = error instanceof Error ? error.message : String(error)
  logger.error(`errorReporter ⚑ reported: ${message}`, context)
}
