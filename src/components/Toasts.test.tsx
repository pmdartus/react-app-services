import { describe, expect, it } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { initNotifier, notifier } from '#/services/global/notifier'
import { Toasts } from './Toasts'

initNotifier({ autoDismissMs: 60_000 })

describe('Toasts', () => {
  it('shows what services notify, until dismissed', async () => {
    render(<Toasts />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    // Called from outside React, like a service would.
    act(() => notifier.notify({ kind: 'success', message: 'Preferences saved' }))
    expect(screen.getByRole('status')).toHaveTextContent('Preferences saved')

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
