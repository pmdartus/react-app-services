import { useState } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useAuth } from '#/hooks/useAuth'
import { reportError } from '#/services/global/errorReporter'
import { notifier } from '#/services/global/notifier'

export const Route = createFileRoute('/login')({
  beforeLoad: ({ context }) => {
    const auth = context.app.auth.getState()
    if (auth.status === 'signedIn') {
      throw redirect({ to: '/encounters' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('claire.martin@clinic.example')
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: React.SubmitEvent) {
    event.preventDefault()
    try {
      setPending(true)
      await login(email)
      await navigate({ to: '/encounters' })
    } catch (error) {
      reportError(error, { action: 'auth.login' })
      notifier.notify({ kind: 'error', message: `Could not sign in: ${(error as Error).message}` })
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex h-full items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-white">S</span>
          <span className="text-lg font-semibold text-slate-900">Scribe</span>
        </div>
        <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">Any email works — this is a demo.</p>
        <label className="mt-6 block text-sm font-medium text-slate-700" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent-light"
        />
        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-60"
        >
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
