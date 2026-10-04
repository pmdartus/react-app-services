import type { Logger } from './logger'
import type { Disposable } from './shared/disposable'
import { fakeLatency } from './shared/delay'
import { failIfRequested } from './shared/demoFlags'

/** Key/value persistence. Reads are synchronous once `init()` has loaded the data. */
export interface StorageService extends Disposable {
  init(): Promise<void>
  get<T>(key: string): T | undefined
  set<T>(key: string, value: T): void
  remove(key: string): void
}

export interface StorageDependencies {
  logger: Logger
}

const PREFIX = 'demo:'

class KeyValueStorage implements StorageService {
  private readonly cache = new Map<string, unknown>()

  constructor(private readonly deps: StorageDependencies) {
    deps.logger.created('storage')
  }

  init() {
    return this.deps.logger.traceInit('storage', async () => {
      await fakeLatency(400, 800) // pretend we're reading from a slow disk
      failIfRequested('storage')

      for (const key of Object.keys(localStorage)) {
        if (key.startsWith(PREFIX)) {
          this.cache.set(key.slice(PREFIX.length), JSON.parse(localStorage.getItem(key)!))
        }
      }
    })
  }

  get<T>(key: string): T | undefined {
    return this.cache.get(key) as T | undefined
  }

  set<T>(key: string, value: T) {
    this.cache.set(key, value)
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  }

  remove(key: string) {
    this.cache.delete(key)
    localStorage.removeItem(PREFIX + key)
  }

  dispose() {
    this.cache.clear()
    this.deps.logger.disposed('storage')
  }
}

export function createStorageService(deps: StorageDependencies): StorageService {
  return new KeyValueStorage(deps)
}
