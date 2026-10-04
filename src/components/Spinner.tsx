export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-4 text-slate-500">
      <div className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-accent" />
      <p className="text-sm">{label}</p>
    </div>
  )
}
