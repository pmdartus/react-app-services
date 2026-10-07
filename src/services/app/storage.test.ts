import { beforeEach, describe, expect, it, vi } from 'vitest'
import { settle } from '#/test/timers'
import { createStorageService } from './storage'

describe('storage', () => {
  beforeEach(() => {
    vi.useFakeTimers() // skip the fake disk latency
  })

  async function init() {
    const storage = createStorageService()
    await settle(storage.init())
    return storage
  }

  it('loads its own keys from localStorage on init', async () => {
    localStorage.setItem('demo:theme', JSON.stringify({ dark: true }))
    localStorage.setItem('other-app', JSON.stringify('ignored'))

    const storage = await init()

    expect(storage.get('theme')).toEqual({ dark: true })
    expect(storage.get('other-app')).toBeUndefined()
  })

  it('writes through to localStorage', async () => {
    const storage = await init()

    storage.set('answer', 42)
    expect(storage.get('answer')).toBe(42)
    expect(localStorage.getItem('demo:answer')).toBe('42')

    storage.remove('answer')
    expect(storage.get('answer')).toBeUndefined()
    expect(localStorage.getItem('demo:answer')).toBeNull()
  })

  it('fails to init on corrupted data', async () => {
    localStorage.setItem('demo:broken', '{not json')
    await expect(init()).rejects.toThrow(SyntaxError)
  })

  it('forgets cached values once disposed', async () => {
    localStorage.setItem('demo:theme', JSON.stringify('dark'))
    const storage = await init()

    storage.dispose()

    expect(storage.get('theme')).toBeUndefined()
    expect(localStorage.getItem('demo:theme')).not.toBeNull()
  })
})
