import { createFileRoute } from '@tanstack/react-router'
import { EncountersPlaceholder } from '#/components/Placeholders'

export const Route = createFileRoute('/_authenticated/encounters/')({
  staticData: { placeholder: () => <EncountersPlaceholder /> },
  component: () => (
    <div className="flex h-full items-center justify-center text-sm text-slate-400">
      Select an encounter
    </div>
  ),
})
