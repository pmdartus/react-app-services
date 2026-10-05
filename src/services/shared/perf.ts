/**
 * User Timing measures, visible in the DevTools Performance panel (record, then look under "Timings").
 * Chrome also draws them in a "Services" track group, one track per scope:
 * https://developer.chrome.com/docs/devtools/performance/extension
 */
export interface MeasureOptions {
  track: string
  color?: 'primary' | 'secondary' | 'tertiary' | 'error'
}

/** Records a measure from `start` (a `performance.now()` timestamp) to now. Returns its duration in ms. */
export function measure(name: string, start: number, { track, color = 'primary' }: MeasureOptions): number {
  const end = performance.now()
  performance.measure(name, {
    start,
    end,
    detail: { devtools: { dataType: 'track-entry', trackGroup: 'Services', track, color } },
  })
  return end - start
}

/** Measures an async phase. A failure is recorded too, in red, with a ✗ suffix. */
export async function measured<T>(name: string, track: string, run: () => Promise<T>): Promise<T> {
  const start = performance.now()
  try {
    const result = await run()
    measure(name, start, { track })
    return result
  } catch (error) {
    measure(`${name} ✗`, start, { track, color: 'error' })
    throw error
  }
}
