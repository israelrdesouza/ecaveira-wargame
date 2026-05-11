import AnimatedNumber from './AnimatedNumber'
import AnimatedProgressBar from './AnimatedProgressBar'

function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'red',
  detail,
  progress,
  meta,
  onIconClick,
  onDoubleClick,
  iconTitle = 'Ver leads',
  animationKey,
  animationDelay = 0,
}) {
  const accentClasses = {
    red: 'border-red-500/30 bg-red-950/30 text-red-300',
    zinc: 'border-zinc-500/25 bg-zinc-800/50 text-zinc-200',
    green: 'border-emerald-500/25 bg-emerald-950/25 text-emerald-300',
    amber: 'border-amber-500/25 bg-amber-950/25 text-amber-300',
    cyan: 'border-cyan-500/25 bg-cyan-950/25 text-cyan-300',
  }

  return (
    <article
      onDoubleClick={onDoubleClick}
      style={{ animationDelay: `${animationDelay}ms` }}
      className="animate-dashboard-enter group min-w-0 rounded-lg border border-white/10 bg-zinc-900/70 p-4 shadow-xl shadow-black/20 backdrop-blur transition hover:-translate-y-0.5 hover:border-red-500/30 hover:bg-zinc-900/90"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="max-w-full whitespace-normal break-words text-xs font-black uppercase leading-4 tracking-[0.12em] text-zinc-500">
            {label}
          </p>
          <div className="mt-2 flex min-w-0 flex-wrap items-end gap-x-2 gap-y-1">
            <p className="max-w-full break-words text-2xl font-black leading-none text-white sm:text-3xl">
              {value}
            </p>
            {meta && (
              <p className="pb-0.5 text-xs font-bold uppercase text-zinc-500">{meta}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onIconClick?.()
          }}
          title={iconTitle}
          aria-label={iconTitle}
          className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md border transition hover:scale-105 hover:border-red-400/50 hover:bg-red-950/25 focus:outline-none focus:ring-2 focus:ring-red-300/40 ${accentClasses[accent]}`}
        >
          <Icon size={21} strokeWidth={2.4} />
        </button>
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
            <span>
              <AnimatedNumber
                value={progress}
                suffix="%"
                animationKey={animationKey}
              />
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-black/40 ring-1 ring-white/10">
            <AnimatedProgressBar
              value={progress}
              animationKey={animationKey}
              className="h-full rounded-full bg-gradient-to-r from-red-800 via-red-600 to-red-400 shadow-[0_0_16px_rgba(248,113,113,0.45)]"
            />
          </div>
        </div>
      )}
    </article>
  )
}

export default StatCard
