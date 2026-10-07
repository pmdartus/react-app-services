import { beforeEach, describe, expect, it, vi } from 'vitest'
import { testUser } from '#/test/fixtures'
import { mockNotifier, mockReportError, mockStorage } from '#/test/mocks'
import { settle } from '#/test/timers'
import { createAuthService } from './auth'
import { createSessionHost } from './sessionHost'

/*
 * With real sessions: the host only knows them through their public API, and so does this test.
 * A session's services are disposed exactly when its `apiClient` starts refusing requests.
 */

async function setup(stored: Record<string, unknown> = {}) {
  const storage = mockStorage(stored)
  const auth = createAuthService({ storage })
  await settle(auth.init())
  const host = createSessionHost({ auth, storage, notifier: mockNotifier(), reportError: mockReportError() })
  await host.init()
  return { host, auth }
}

/** The services of the current session, once loaded. */
function currentServices(host: Awaited<ReturnType<typeof setup>>['host']) {
  return settle(host.current()!.ready())
}

describe('sessionHost', () => {
  beforeEach(() => {
    vi.useFakeTimers() // skip the fake latencies
  })

  it('has no session while signed out', async () => {
    const { host } = await setup()
    expect(host.current()).toBeNull()
  })

  it('reopens the session of the user restored by auth', async () => {
    const { host } = await setup({ 'auth.user': testUser })

    expect(host.current()?.user).toEqual(testUser)
    await expect(currentServices(host)).resolves.toMatchObject({ apiClient: expect.anything() })
  })

  it('opens a session on sign-in, replacing the previous one', async () => {
    const { host } = await setup()

    await settle(host.signIn('first@clinic.example'))
    const first = await currentServices(host)

    await settle(host.signIn('second@clinic.example'))
    expect(host.current()?.user.email).toBe('second@clinic.example')
    await expect(settle(first.apiClient.listEncounters())).rejects.toThrow('apiClient disposed')
  })

  it('opens nothing when a sign-out supersedes the sign-in', async () => {
    const { host } = await setup()

    const signIn = host.signIn('late@clinic.example')
    await host.signOut()
    await settle(signIn)

    expect(host.current()).toBeNull()
  })

  it('on sign-out, hides the session before beforeDispose runs, and disposes it after', async () => {
    const { host, auth } = await setup()
    await settle(host.signIn('claire@clinic.example'))
    const services = await currentServices(host)

    await host.signOut({
      beforeDispose: async () => {
        expect(host.current()).toBeNull()
        expect(auth.getState().status).toBe('signedOut')
        await expect(settle(services.apiClient.listEncounters())).resolves.not.toHaveLength(0) // still usable
      },
    })

    await expect(settle(services.apiClient.listEncounters())).rejects.toThrow('apiClient disposed')
  })

  it('disposes the session even if beforeDispose throws', async () => {
    const { host } = await setup()
    await settle(host.signIn('claire@clinic.example'))
    const services = await currentServices(host)

    const signOut = host.signOut({ beforeDispose: () => Promise.reject(new Error('navigation failed')) })

    await expect(signOut).rejects.toThrow('navigation failed')
    await expect(settle(services.apiClient.listEncounters())).rejects.toThrow('apiClient disposed')
  })

  it('closes the current session when disposed', async () => {
    const { host } = await setup({ 'auth.user': testUser })
    const services = await currentServices(host)

    await host.dispose()

    expect(host.current()).toBeNull()
    await expect(settle(services.apiClient.listEncounters())).rejects.toThrow('apiClient disposed')
  })
})
