import type { Encounter } from '#/services/session/encounters'

export function StatusBadge({ status }: { status: Encounter['status'] }) {
  const styles = status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${styles}`}>{status}</span>
  )
}
