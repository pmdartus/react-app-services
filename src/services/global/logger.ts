import { measure } from '../shared/perf'

/**
 * Colored, scope-prefixed console logger.
 *
 * A module singleton: import `logger` from anywhere (services, routes, components).
 * It has no dependencies, no async setup and nothing to tear down, so wiring it
 * through every constructor would only add noise. The app creates it once, with
 * `initLogger()`, before anything logs.
 */
export interface Logger {
  info(message: string, ...data: unknown[]): void
  error(message: string, ...data: unknown[]): void
  created(service: string, detail?: string): void
  disposed(service: string): void
  /** Logs "init" start, then success with its duration, or failure. Also records a performance measure. */
  traceInit<T>(service: string, init: () => Promise<T>): Promise<T>
  /** A child logger whose lines are prefixed with another scope, e.g. `[session]`. */
  scope(name: string): Logger
}

export interface LoggerOptions {
  /** Color of each scope's `[prefix]`. The scopes belong to the app; the ones without a color are gray. */
  scopeColors: Record<string, string>
}

const GRAY = '#64748b'
const GREEN = '#16a34a'
const RED = '#dc2626'

class ConsoleLogger implements Logger {
  constructor(
    private readonly options: LoggerOptions,
    private readonly scopeName: string,
  ) {}

  info(message: string, ...data: unknown[]) {
    this.print(GRAY, message, data)
  }

  error(message: string, ...data: unknown[]) {
    this.print(RED, message, data)
  }

  created(service: string, detail?: string) {
    this.print(GRAY, `${service} + created${detail ? ` (${detail})` : ''}`)
  }

  disposed(service: string) {
    this.print(RED, `${service} ✗ disposed`)
  }

  async traceInit<T>(service: string, init: () => Promise<T>): Promise<T> {
    const start = performance.now()
    this.print(GRAY, `${service} … init`)
    try {
      const result = await init()
      const ms = measure(`${service} init`, start, { track: this.scopeName })
      this.print(GREEN, `${service} ✓ init (${Math.round(ms)}ms)`)
      return result
    } catch (error) {
      measure(`${service} init ✗`, start, { track: this.scopeName, color: 'error' })
      this.print(RED, `${service} ✗ init failed: ${(error as Error).message}`)
      throw error
    }
  }

  scope(name: string): Logger {
    return new ConsoleLogger(this.options, name)
  }

  private print(color: string, message: string, data: unknown[] = []) {
    const scopeColor = this.options.scopeColors[this.scopeName] ?? GRAY
    console.log(
      `%c[${this.scopeName}]%c ${message}`,
      `color: ${scopeColor}; font-weight: 600`,
      `color: ${color}`,
      ...data,
    )
  }
}

/** Assigned by `initLogger()`. Importers see it through the live binding, so don't use it while modules load. */
export let logger: Logger

/** Called once by the app's entry point, before anything logs. Creates the logger. */
export function initLogger(options: LoggerOptions) {
  if (logger) throw new Error('logger is already initialized')
  logger = new ConsoleLogger(options, 'global')
}
