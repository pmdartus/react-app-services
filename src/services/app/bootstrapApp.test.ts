import { beforeEach, describe, expect, it, vi } from 'vitest'
import { testUser } from '#/test/fixtures'
import { mockNotifier, mockReportError } from '#/test/mocks'
import { settle } from '#/test/timers'
import { bootstrapApp } from './bootstrapApp'

describe('bootstrapApp', () => {
  beforeEach(() => {
    vi.useFakeTimers() // skip the fake latencies
  })

  function bootstrap() {
    return settle(bootstrapApp({ notifier: mockNotifier(), reportError: mockReportError() }))
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
    await expect(settle(session!.ready())).resolves.toMatchObject({ apiClient: expect.anything() })
  })

  it('rejects when a service fails to initialize', async () => {
    localStorage.setItem('demo:auth.user', '{corrupted')
    await expect(bootstrap()).rejects.toThrow(SyntaxError)
  })
})
