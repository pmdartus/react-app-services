import { createFileRoute } from '@tanstack/react-router'
import { getSessionServices } from '#/react/useSession'

export const Route = createFileRoute('/_authenticated/encounters/')({
  // Back to the list: no encounter is open, so any recording is disposed.
  onEnter: ({ context }) => getSessionServices(context.app)?.encounters.openEncounter(null),
  component: () => (
    <div className="flex h-full items-center justify-center text-sm text-slate-400">
      Select an encounter
    </div>
  ),
})
