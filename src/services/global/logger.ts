/**
 * Colored, scope-prefixed console logger.
 *
 * A module singleton: import `logger` from anywhere (services, routes, components).
 * It has no dependencies, no async setup and nothing to tear down, so wiring it
 * through every constructor would only add noise.
 */
export interface Logger {
  info(message: string, ...data: unknown[]): void
  error(message: string, ...data: unknown[]): void
  created(service: string, detail?: string): void
  disposed(service: string): void
  /** Logs "init" start, then success with its duration, or failure. */
  traceInit<T>(service: string, init: () => Promise<T>): Promise<T>
  /** A child logger whose lines are prefixed with another scope, e.g. `[session]`. */
  scope(name: string): Logger
}

const SCOPE_COLORS: Record<string, string> = {
  global: '#0891b2',
  app: '#2563eb',
  session: '#7c3aed',
  feature: '#ea580c',
}
const GRAY = '#64748b'
const GREEN = '#16a34a'
const RED = '#dc2626'

class ConsoleLogger implements Logger {
  constructor(private readonly scopeName: string) {}

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
      this.print(GREEN, `${service} ✓ init (${Math.round(performance.now() - start)}ms)`)
      return result
    } catch (error) {
      this.print(RED, `${service} ✗ init failed: ${(error as Error).message}`)
      throw error
    }
  }

  scope(name: string): Logger {
    return new ConsoleLogger(name)
  }

  private print(color: string, message: string, data: unknown[] = []) {
    const scopeColor = SCOPE_COLORS[this.scopeName] ?? GRAY
    console.log(
      `%c[${this.scopeName}]%c ${message}`,
      `color: ${scopeColor}; font-weight: 600`,
      `color: ${color}`,
      ...data,
    )
  }
}

export const logger: Logger = new ConsoleLogger('global')
