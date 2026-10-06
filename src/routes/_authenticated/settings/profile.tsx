import { createFileRoute } from '@tanstack/react-router'
import { useLogout, useUser } from '#/hooks/useAuth'

export const Route = createFileRoute('/_authenticated/settings/profile')({
  component: ProfileTab,
})

function ProfileTab() {
  const user = useUser()
  const logout = useLogout()

  return (
    <div className="space-y-6">
      <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        <Field label="Name" value={user.name} />
        <Field label="Email" value={user.email} />
      </dl>
      <button
        onClick={logout}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Log out
      </button>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  )
}
