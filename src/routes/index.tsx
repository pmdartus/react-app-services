import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    const auth = context.app.auth.getState()

    const signedIn = auth.status === 'signedIn'
    throw redirect({ to: signedIn ? '/encounters' : '/login' })
  },
})
