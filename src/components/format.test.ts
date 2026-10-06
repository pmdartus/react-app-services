import { describe, expect, it, vi } from 'vitest'
import { formatTime, initials } from './format'

describe('initials', () => {
  it('keeps the first letter of the first two names', () => {
    expect(initials('Claire Martin')).toBe('CM')
    expect(initials('jean luc picard')).toBe('JL')
    expect(initials('Cher')).toBe('C')
  })
})

describe('formatTime', () => {
  it('shows only the time for today, and the date too otherwise', () => {
    vi.useFakeTimers({ now: new Date(2026, 9, 6, 15, 0) })
    const time = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const today = new Date(2026, 9, 6, 9, 30)
    const lastWeek = new Date(2026, 8, 29, 9, 30)

    expect(formatTime(today.toISOString())).toBe(time(today))
    expect(formatTime(lastWeek.toISOString())).toBe(
      `${lastWeek.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time(lastWeek)}`,
    )
  })
})
