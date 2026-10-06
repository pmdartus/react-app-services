import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { initLogger } from '#/services/global/logger'

// Services take a scoped logger in their constructor, so it must exist before any of them is created.
initLogger({ scopeColors: {} })
// Every service logs its lifecycle: keep the test output readable.
vi.spyOn(console, 'log').mockImplementation(() => {})

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.useRealTimers()
})
