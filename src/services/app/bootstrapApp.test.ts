import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeNotifier, fakeReportError, testUser } from '#/test/fakes'
import { bootstrapApp } from './bootstrapApp'

describe('bootstrapApp', () => {
  beforeEach(() => {
    vi.useFakeTimers() // skip the fake latencies
  })

  async function bootstrap() {
    const app = bootstrapApp({ notifier: fakeNotifier(), reportError: fakeReportError() })
    await vi.runAllTimersAsync()
    return app
  }

  it('starts signed out, with no session, on a fresh browser', async () => {
    const app = await bootstrap()

    expect(app.auth.getState()).toEqual({ status: 'signedOut' })
    expect(app.sessionHost.current()).toBeNull()
  })

  it('restores the persisted user and opens their session', async () => {
    localStorage.setItem('demo:auth.user', JSON.stringify(testUser))

    const app = await bootstrap()

    expect(app.auth.getState()).toEqual({ status: 'signedIn', user: testUser })
    const session = app.sessionHost.current()
    expect(session?.user).toEqual(testUser)
    await expect(session!.ready()).resolves.toMatchObject({ apiClient: expect.anything() })
  })

  it('rejects when a service fails to initialize', async () => {
    localStorage.setItem('demo:auth.user', '{corrupted')

    const app = bootstrapApp({ notifier: fakeNotifier(), reportError: fakeReportError() })
    const assertion = expect(app).rejects.toThrow(SyntaxError)
    await vi.runAllTimersAsync()
    await assertion
  })
})
