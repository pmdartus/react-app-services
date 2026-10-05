import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    const signedIn = context.auth.status === 'signedIn'
    throw redirect({ to: signedIn ? '/encounters' : '/login' })
  },
})
