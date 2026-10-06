import { vi } from 'vitest'
import type { User } from '#/services/app/auth'
import type { StorageService } from '#/services/app/storage'
import type { Notifier } from '#/services/global/notifier'

/** Services receive these as dependencies, so tests hand them fakes instead of the real globals. */

export const testUser: User = {
  id: 'claire.martin@clinic.example',
  email: 'claire.martin@clinic.example',
  name: 'Claire Martin',
  token: 'token',
}

export function fakeStorage(initial: Record<string, unknown> = {}): StorageService {
  const data = new Map(Object.entries(initial))
  return {
    init: vi.fn(async () => {}),
    get: <T>(key: string) => data.get(key) as T | undefined,
    set: vi.fn((key: string, value: unknown) => void data.set(key, value)),
    remove: vi.fn((key: string) => void data.delete(key)),
    dispose: vi.fn(),
  }
}

export function fakeNotifier(): Notifier {
  return { subscribe: () => () => {}, getState: () => [], notify: vi.fn(), dismiss: vi.fn() }
}

export function fakeReportError() {
  return vi.fn<(error: unknown, context?: Record<string, unknown>) => void>()
}

/** A promise settled from the outside, to control when a dependency answers. */
export function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}
