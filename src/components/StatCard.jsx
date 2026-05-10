function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'red',
  detail,
  progress,
  meta,
}) {
  const accentClasses = {
    red: 'border-red-500/30 bg-red-950/30 text-red-300',
    zinc: 'border-zinc-500/25 bg-zinc-800/50 text-zinc-200',
    green: 'border-emerald-500/25 bg-emerald-950/25 text-emerald-300',
    amber: 'border-amber-500/25 bg-amber-950/25 text-amber-300',
    cyan: 'border-cyan-500/25 bg-cyan-950/25 text-cyan-300',
  }

  return (
    <article className="group rounded-lg border border-white/10 bg-zinc-900/70 p-4 shadow-xl shadow-black/20 backdrop-blur transition hover:-translate-y-0.5 hover:border-red-500/30 hover:bg-zinc-900/90">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
            {label}
          </p>
          <div className="mt-2 flex items-end gap-2">
            <p className="text-3xl font-black leading-none text-white">{value}</p>
            {meta && (
              <p className="pb-0.5 text-xs font-bold uppercase text-zinc-500">{meta}</p>
            )}
          </div>
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md border ${accentClasses[accent]}`}
        >
          <Icon size={21} strokeWidth={2.4} />
        </div>
      </div>

      {detail && (
        <p className="mt-3 min-h-10 text-sm font-medium leading-5 text-zinc-400">
          {detail}
        </p>
      )}

      {typeof progress === 'number' && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.14em] text-zinc-600">
            <span>Progresso</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-black/40 ring-1 ring-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-800 via-red-600 to-red-400 shadow-[0_0_16px_rgba(248,113,113,0.45)]"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
    </article>
  )
}

export default StatCard
