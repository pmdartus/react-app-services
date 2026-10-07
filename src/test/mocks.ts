import { vi } from 'vitest'
import type { StorageService } from '#/services/app/storage'
import type { Notifier } from '#/services/global/notifier'
import type { ReportError } from '#/services/global/errorReporter'

/** Services receive these as dependencies, so tests hand them mocks instead of the real ones. */

/** In-memory storage, already initialized. */
export function mockStorage(initial: Record<string, unknown> = {}): StorageService {
  const data = new Map(Object.entries(initial))
  return {
    init: vi.fn(async () => {}),
    get: <T>(key: string) => data.get(key) as T | undefined,
    set: vi.fn((key: string, value: unknown) => void data.set(key, value)),
    remove: vi.fn((key: string) => void data.delete(key)),
    dispose: vi.fn(),
  }
}

export function mockNotifier(): Notifier {
  return { subscribe: () => () => {}, getState: () => [], notify: vi.fn(), dismiss: vi.fn() }
}

export function mockReportError() {
  return vi.fn<ReportError>()
}
