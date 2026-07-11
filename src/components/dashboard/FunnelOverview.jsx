import AnimatedNumber from '../AnimatedNumber'
import AnimatedProgressBar from '../AnimatedProgressBar'

const STAGE_ICON_COLORS = {
  cyan: 'text-cyan-300',
  zinc: 'text-zinc-300',
  amber: 'text-amber-300',
  green: 'text-emerald-300',
}

const STAGE_BAR_COLORS = {
  cyan: 'from-cyan-700 via-cyan-500 to-cyan-300',
  zinc: 'from-zinc-700 via-zinc-500 to-zinc-300',
  amber: 'from-amber-700 via-amber-500 to-amber-300',
  green: 'from-emerald-700 via-emerald-500 to-emerald-300',
}

function FunnelOverview({
  stages,
  stageIconMap,
  stageAccentMap,
  mes,
  ano,
  onOpenStage,
  animationKey,
  animationDelay = 0,
}) {
  return (
    <article
      style={{ animationDelay: `${animationDelay}ms` }}
      className="animate-dashboard-enter rounded-lg border border-white/10 bg-zinc-900/70 p-5 shadow-xl shadow-black/20 backdrop-blur sm:p-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-white">Funil comercial</h2>
          <p className="mt-1 text-sm font-medium text-zinc-500">
            Realizado do mês por etapa, comparado à meta.
          </p>
        </div>
        <span className="w-fit rounded-md border border-red-500/25 bg-red-950/25 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-red-300">
          {String(mes).padStart(2, '0')}/{ano}
        </span>
      </div>

      <div className="mt-4 space-y-2 sm:mt-5 sm:space-y-3">
        {stages.map((stage) => {
          const Icon = stageIconMap[stage.key]
          const accent = stageAccentMap[stage.key] ?? 'zinc'

          return (
            <button
              key={`${stage.key}-${animationKey}`}
              type="button"
              onClick={() => onOpenStage(stage)}
              title="Ver leads"
              className="w-full rounded-lg border border-white/10 bg-black/20 p-3 text-left transition hover:border-red-500/30 hover:bg-black/30 focus:outline-none focus:ring-2 focus:ring-red-300/30 sm:p-4"
            >
              <div className="flex items-center gap-2.5 sm:gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 bg-black/30 sm:h-9 sm:w-9 ${
                    STAGE_ICON_COLORS[accent] ?? STAGE_ICON_COLORS.zinc
                  }`}
                >
                  <Icon size={17} className="sm:hidden" aria-hidden="true" />
                  <Icon size={18} className="hidden sm:block" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-extrabold text-zinc-200">
                      {stage.label}
                    </span>
                    <span className="shrink-0 text-sm font-black text-white">
                      <AnimatedNumber value={stage.realizado} animationKey={animationKey} />{' '}
                      <span className="text-zinc-500">/ {stage.meta}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/40 ring-1 ring-white/10 sm:mt-3 sm:h-2.5">
                <AnimatedProgressBar
                  value={stage.percentual}
                  animationKey={animationKey}
                  className={`h-full rounded-full bg-gradient-to-r ${
                    STAGE_BAR_COLORS[accent] ?? STAGE_BAR_COLORS.zinc
                  }`}
                />
              </div>

              <div className="mt-1.5 flex items-center justify-between text-xs font-semibold text-zinc-500 sm:mt-2">
                <span>{stage.faltante} faltando para a meta</span>
                <span>
                  <AnimatedNumber value={stage.percentual} suffix="%" animationKey={animationKey} />
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </article>
  )
}

export default FunnelOverview
