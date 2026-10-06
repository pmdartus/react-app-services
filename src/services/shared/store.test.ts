import { describe, expect, it, vi } from 'vitest'
import { Store } from './store'

class Counter extends Store<{ count: number }> {
  constructor() {
    super({ count: 0 })
  }
  increment = () => this.setState({ count: this.getState().count + 1 })
  replaceWithSame = () => this.setState(this.getState())
  dispose = () => this.clearListeners()
}

describe('Store', () => {
  it('returns the same reference until the state changes', () => {
    const counter = new Counter()
    const before = counter.getState()
    expect(counter.getState()).toBe(before)

    counter.increment()
    expect(counter.getState()).not.toBe(before)
    expect(counter.getState()).toEqual({ count: 1 })
  })

  it('notifies subscribers on change only', () => {
    const counter = new Counter()
    const listener = vi.fn()
    counter.subscribe(listener)

    counter.replaceWithSame()
    expect(listener).not.toHaveBeenCalled()

    counter.increment()
    expect(listener).toHaveBeenCalledOnce()
  })

  it('stops notifying after unsubscribe or clearListeners', () => {
    const counter = new Counter()
    const unsubscribed = vi.fn()
    const cleared = vi.fn()
    counter.subscribe(unsubscribed)()
    counter.subscribe(cleared)
    counter.dispose()

    counter.increment()
    expect(unsubscribed).not.toHaveBeenCalled()
    expect(cleared).not.toHaveBeenCalled()
  })
})
