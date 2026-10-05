import { createFileRoute } from '@tanstack/react-router'
import { useUserSettings } from '#/hooks/useUserSettings'
import type { UserSettings } from '#/services/session/userSettings'

export const Route = createFileRoute('/_authenticated/settings/preferences')({
  component: PreferencesTab,
})

function PreferencesTab() {
  const { settings, update } = useUserSettings()

  return (
    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
      <SelectField
        label="Note language"
        value={settings.noteLanguage}
        options={{ en: 'English', fr: 'Français' }}
        onChange={(noteLanguage) => update({ noteLanguage })}
      />
      <SelectField
        label="Note template"
        value={settings.noteTemplate}
        options={{ soap: 'SOAP', narrative: 'Narrative' }}
        onChange={(noteTemplate) => update({ noteTemplate })}
      />
    </div>
  )
}

function SelectField<T extends UserSettings[keyof UserSettings]>(props: {
  label: string
  value: T
  options: Record<T, string>
  onChange: (value: T) => void
}) {
  return (
    <label className="flex items-center justify-between px-5 py-4 text-sm">
      <span className="text-slate-500">{props.label}</span>
      <select
        value={props.value}
        onChange={(event) => props.onChange(event.target.value as T)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900 outline-none focus:border-accent"
      >
        {(Object.entries(props.options) as [T, string][]).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  )
}
