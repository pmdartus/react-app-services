import { logger } from './logger'

export interface ErrorReporterOptions {
  /** Attached to every report, like Sentry's `release` and `environment`. */
  tags: Record<string, string>
}

class ConsoleErrorReporter {
  constructor(private readonly options: ErrorReporterOptions) {}

  report(error: unknown, context: Record<string, unknown>) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error(`errorReporter ⚑ reported: ${message}`, { ...this.options.tags, ...context })
  }
}

let reporter: ConsoleErrorReporter | undefined

/** Called once by the app's entry point, before anything reports. Creates the reporter, like `Sentry.init()`. */
export function initErrorReporter(options: ErrorReporterOptions) {
  if (reporter) throw new Error('errorReporter is already initialized')
  reporter = new ConsoleErrorReporter(options)
}

/** What services receive (injected) to report errors. */
export type ReportError = (error: unknown, context?: Record<string, unknown>) => void

/**
 * Stand-in for Sentry, Datadog & co. A module singleton: React code that catches an error it
 * can't handle calls `reportError()` directly. Services receive it as a dependency instead.
 */
export const reportError: ReportError = (error, context = {}) => {
  if (!reporter) throw new Error('errorReporter used before initErrorReporter() was called')
  reporter.report(error, context)
}
