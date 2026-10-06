import { afterEach, describe, expect, it, vi } from 'vitest'

// The flag is read once, when the module loads: set the URL, then import a fresh copy.
async function loadWithUrl(url: string) {
  window.history.replaceState(null, '', url)
  vi.resetModules()
  return import('./demoFlags')
}

describe('failIfRequested', () => {
  afterEach(() => window.history.replaceState(null, '', '/'))

  it('throws for the requested service, on the first attempt only', async () => {
    const { failIfRequested } = await loadWithUrl('/?fail=storage')

    expect(() => failIfRequested('auth')).not.toThrow()
    expect(() => failIfRequested('storage')).toThrow('storage failed (simulated with ?fail=storage)')
    expect(() => failIfRequested('storage')).not.toThrow()
  })

  it('never throws without the flag', async () => {
    const { failIfRequested } = await loadWithUrl('/')
    expect(() => failIfRequested('storage')).not.toThrow()
  })
})
