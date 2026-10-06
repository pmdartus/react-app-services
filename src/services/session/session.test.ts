import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deferred, fakeNotifier, fakeReportError, fakeStorage, testUser } from '#/test/fakes'
import { bootstrapSession, type SessionServices } from './bootstrapSession'
import { createSession } from './session'

// What the session decides is when to bootstrap, retry or discard: control each bootstrap by hand.
vi.mock('./bootstrapSession', () => ({ bootstrapSession: vi.fn() }))

function fakeServices(): SessionServices {
  return { apiClient: {} as SessionServices['apiClient'], userSettings: {} as SessionServices['userSettings'], dispose: vi.fn() }
}

/** Each call to `bootstrapSession` returns the next of these, settled by the test. */
function nextBootstraps(count: number) {
  const attempts = Array.from({ length: count }, () => deferred<SessionServices>())
  for (const attempt of attempts) vi.mocked(bootstrapSession).mockReturnValueOnce(attempt.promise)
  return attempts
}

function setup() {
  const reportError = fakeReportError()
  const session = createSession({ user: testUser, storage: fakeStorage(), notifier: fakeNotifier(), reportError })
  return { session, reportError }
}

describe('session', () => {
  beforeEach(() => vi.mocked(bootstrapSession).mockReset())

  it('bootstraps once, and hands out the same services', async () => {
    const [attempt] = nextBootstraps(1)
    const services = fakeServices()
    const { session } = setup()

    const init = session.init()
    expect(session.ready()).toBe(session.ready())
    attempt.resolve(services)
    await init

    await expect(session.ready()).resolves.toBe(services)
    expect(bootstrapSession).toHaveBeenCalledOnce()
    expect(session.user).toBe(testUser)
  })

  it('reports a failed bootstrap, and retries it on demand', async () => {
    const [failed, retried] = nextBootstraps(2)
    const services = fakeServices()
    const { session, reportError } = setup()

    failed.reject(new Error('settings unavailable'))
    await session.init() // settles, even though the bootstrap failed
    await expect(session.ready()).rejects.toThrow('settings unavailable')
    expect(reportError).toHaveBeenCalledWith(expect.any(Error), { scope: 'session', user: testUser.email })

    session.retry()
    retried.resolve(services)
    await expect(session.ready()).resolves.toBe(services)
  })

  it('does not retry a bootstrap that has not failed', async () => {
    const [attempt] = nextBootstraps(1)
    const { session } = setup()
    const ready = session.ready()

    session.retry()

    expect(session.ready()).toBe(ready)
    attempt.resolve(fakeServices())
    await ready
    expect(bootstrapSession).toHaveBeenCalledOnce()
  })

  it('discards services that finish loading after sign-out', async () => {
    const [attempt] = nextBootstraps(1)
    const services = fakeServices()
    const { session, reportError } = setup()
    const ready = session.ready()

    await session.dispose()
    attempt.resolve(services)

    await expect(ready).rejects.toThrow('Signed out while the session was loading')
    expect(services.dispose).toHaveBeenCalledOnce()
    expect(reportError).not.toHaveBeenCalled()
  })

  it('disposes its services', async () => {
    const [attempt] = nextBootstraps(1)
    const services = fakeServices()
    const { session } = setup()
    attempt.resolve(services)
    await session.init()

    await session.dispose()

    expect(services.dispose).toHaveBeenCalledOnce()
  })
})
