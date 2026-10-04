import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    const signedIn = context.app.auth.getState().status === 'signedIn'
    throw redirect({ to: signedIn ? '/encounters' : '/login' })
  },
})
