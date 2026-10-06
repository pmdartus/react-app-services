import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeStorage, testUser } from '#/test/fakes'
import { createAuthService } from './auth'

describe('auth', () => {
  beforeEach(() => {
    vi.useFakeTimers() // skip the fake network latency
  })

  async function settle<T>(promise: Promise<T>): Promise<T> {
    await vi.runAllTimersAsync()
    return promise
  }

  it('starts signed out when nothing is stored', async () => {
    const auth = createAuthService({ storage: fakeStorage() })
    await settle(auth.init())
    expect(auth.getState()).toEqual({ status: 'signedOut' })
  })

  it('restores the stored user on init', async () => {
    const auth = createAuthService({ storage: fakeStorage({ 'auth.user': testUser }) })
    await settle(auth.init())
    expect(auth.getState()).toEqual({ status: 'signedIn', user: testUser })
  })

  it('signs in any email, derives a display name and persists the user', async () => {
    const storage = fakeStorage()
    const auth = createAuthService({ storage })

    const user = await settle(auth.signIn('jean-luc.picard@clinic.example'))

    expect(user).toMatchObject({ id: 'jean-luc.picard@clinic.example', name: 'Jean Luc Picard' })
    expect(auth.getState()).toEqual({ status: 'signedIn', user })
    expect(storage.get('auth.user')).toEqual(user)
  })

  it('ignores a sign-in superseded by a later one', async () => {
    const auth = createAuthService({ storage: fakeStorage() })

    const first = auth.signIn('first@clinic.example')
    const second = auth.signIn('second@clinic.example')
    await vi.runAllTimersAsync()

    expect(await first).toBeNull()
    expect(await second).toMatchObject({ email: 'second@clinic.example' })
    expect(auth.getState()).toMatchObject({ user: { email: 'second@clinic.example' } })
  })

  it('cancels an in-flight sign-in on sign-out', async () => {
    const storage = fakeStorage()
    const auth = createAuthService({ storage })

    const signIn = auth.signIn('claire@clinic.example')
    auth.signOut()

    expect(await settle(signIn)).toBeNull()
    expect(auth.getState()).toEqual({ status: 'signedOut' })
    expect(storage.get('auth.user')).toBeUndefined()
  })

  it('forgets the stored user on sign-out', async () => {
    const storage = fakeStorage({ 'auth.user': testUser })
    const auth = createAuthService({ storage })
    await settle(auth.init())

    auth.signOut()

    expect(auth.getState()).toEqual({ status: 'signedOut' })
    expect(storage.get('auth.user')).toBeUndefined()
  })
})
