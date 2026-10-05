import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/encounters/')({
  component: () => (
    <div className="flex h-full items-center justify-center text-sm text-slate-400">
      Select an encounter
    </div>
  ),
})
