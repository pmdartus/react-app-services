import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeNotifier, fakeReportError, fakeStorage, testUser } from '#/test/fakes'
import type { Session } from '../session/session'
import type { AuthService, AuthState, User } from './auth'
import { createSessionHost } from './sessionHost'

// The host's job is when sessions open and close, not what they contain: replace them with stubs.
vi.mock('../session/session', () => ({
  createSession: vi.fn(({ user }: { user: User }): Session => ({
    user,
    init: vi.fn(async () => {}),
    ready: vi.fn(),
    retry: vi.fn(),
    dispose: vi.fn(async () => {}),
  })),
}))

function fakeAuth(initial: AuthState = { status: 'signedOut' }): AuthService {
  let state = initial
  return {
    init: vi.fn(async () => {}),
    getState: () => state,
    signIn: vi.fn(async (email: string) => {
      const user = { ...testUser, id: email, email }
      state = { status: 'signedIn', user }
      return user
    }),
    signOut: vi.fn(() => void (state = { status: 'signedOut' })),
    dispose: vi.fn(),
  }
}

function setup(auth = fakeAuth()) {
  const host = createSessionHost({ auth, storage: fakeStorage(), notifier: fakeNotifier(), reportError: fakeReportError() })
  return { host, auth }
}

describe('sessionHost', () => {
  beforeEach(() => vi.clearAllMocks())

  it('has no session while signed out', async () => {
    const { host } = setup()
    await host.init()
    expect(host.current()).toBeNull()
  })

  it('reopens the session of the user restored by auth', async () => {
    const { host } = setup(fakeAuth({ status: 'signedIn', user: testUser }))
    await host.init()

    expect(host.current()?.user).toEqual(testUser)
    expect(host.current()?.init).toHaveBeenCalledOnce()
  })

  it('opens a session on sign-in, replacing the previous one', async () => {
    const { host } = setup()

    await host.signIn('first@clinic.example')
    const first = host.current()!
    expect(first.user.email).toBe('first@clinic.example')

    await host.signIn('second@clinic.example')
    expect(host.current()!.user.email).toBe('second@clinic.example')
    expect(first.dispose).toHaveBeenCalledOnce()
  })

  it('opens nothing when auth reports the sign-in was superseded', async () => {
    const auth = fakeAuth()
    vi.mocked(auth.signIn).mockResolvedValueOnce(null)
    const { host } = setup(auth)

    await host.signIn('late@clinic.example')

    expect(host.current()).toBeNull()
  })

  it('on sign-out, hides the session before beforeDispose runs, and disposes it after', async () => {
    const { host, auth } = setup()
    await host.signIn('claire@clinic.example')
    const session = host.current()!

    const seen: unknown[] = []
    await host.signOut({
      beforeDispose: async () => {
        seen.push(host.current(), auth.getState().status, vi.mocked(session.dispose).mock.calls.length)
      },
    })

    expect(seen).toEqual([null, 'signedOut', 0])
    expect(session.dispose).toHaveBeenCalledOnce()
  })

  it('disposes the session even if beforeDispose throws', async () => {
    const { host } = setup()
    await host.signIn('claire@clinic.example')
    const session = host.current()!

    await expect(host.signOut({ beforeDispose: () => Promise.reject(new Error('navigation failed')) })).rejects.toThrow(
      'navigation failed',
    )
    expect(session.dispose).toHaveBeenCalledOnce()
  })

  it('closes the current session when disposed', async () => {
    const { host } = setup()
    await host.signIn('claire@clinic.example')
    const session = host.current()!

    await host.dispose()

    expect(host.current()).toBeNull()
    expect(session.dispose).toHaveBeenCalledOnce()
  })
})
