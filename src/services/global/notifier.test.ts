import { beforeAll, describe, expect, it, vi } from 'vitest'
import { initNotifier, notifier } from './notifier'

describe('notifier', () => {
  // A module singleton: created once for this file.
  beforeAll(() => initNotifier({ autoDismissMs: 1000 }))

  it('can only be initialized once', () => {
    expect(() => initNotifier({ autoDismissMs: 1000 })).toThrow('already initialized')
  })

  it('adds toasts with unique ids, and dismisses them', () => {
    const listener = vi.fn()
    const unsubscribe = notifier.subscribe(listener)

    notifier.notify({ kind: 'success', message: 'Saved' })
    notifier.notify({ kind: 'error', message: 'Oops' })
    const [first, second] = notifier.getState()
    expect(first).toMatchObject({ kind: 'success', message: 'Saved' })
    expect(second.id).not.toBe(first.id)
    expect(listener).toHaveBeenCalledTimes(2)

    notifier.dismiss(first.id)
    expect(notifier.getState()).toEqual([second])

    notifier.dismiss(second.id)
    unsubscribe()
  })

  it('dismisses toasts automatically', () => {
    vi.useFakeTimers()
    notifier.notify({ kind: 'info', message: 'Hello' })
    expect(notifier.getState()).toHaveLength(1)

    vi.advanceTimersByTime(1000)
    expect(notifier.getState()).toEqual([])
  })
})
