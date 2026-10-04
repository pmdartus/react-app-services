import { Link, Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/settings')({
  component: SettingsLayout,
})

const TABS = [
  { to: '/settings/profile', label: 'Profile' },
  { to: '/settings/preferences', label: 'Preferences' },
] as const

function SettingsLayout() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <Link to="/encounters" className="text-sm text-slate-500 hover:text-slate-900">
          ← Back to encounters
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">Settings</h1>
        <nav className="mt-6 flex gap-6 border-b border-slate-200">
          {TABS.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              className="-mb-px border-b-2 border-transparent pb-3 text-sm text-slate-500 hover:text-slate-900"
              activeProps={{ className: 'border-accent! text-slate-900 font-medium' }}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
