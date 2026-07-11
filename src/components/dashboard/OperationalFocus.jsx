import { Activity, AlertTriangle, Flame } from 'lucide-react'
import AnimatedNumber from '../AnimatedNumber'
import AnimatedProgressBar from '../AnimatedProgressBar'

const STATUS_STYLES = {
  atrasado: {
    label: 'Atrasado',
    badge: 'border-red-500/30 bg-red-950/30 text-red-100',
    bar: 'from-red-700 via-red-500 to-red-300',
  },
  ritmo: {
    label: 'No ritmo',
    badge: 'border-emerald-500/25 bg-emerald-950/20 text-emerald-100',
    bar: 'from-zinc-700 via-emerald-700 to-emerald-400',
  },
  adiantado: {
    label: 'Adiantado',
    badge: 'border-emerald-500/35 bg-emerald-950/25 text-emerald-100',
    bar: 'from-emerald-800 via-emerald-600 to-emerald-300',
  },
}

function OperationalFocus({
  rhythm,
  overdueFollowUps,
  caveiraLeads,
  missionLeads,
  onOpenOverdue,
  onOpenCaveira,
  onSeeAllMissions,
  animationKey,
  animationDelay = 0,
}) {
  const style = STATUS_STYLES[rhythm.status] ?? STATUS_STYLES.ritmo
  const progress =
    rhythm.metaAcumulada > 0
      ? Math.min(Math.round((rhythm.realizadoAcumulado / rhythm.metaAcumulada) * 100), 100)
      : 0
  const visibleMissionLeads = missionLeads.slice(0, 4)
  const hasMoreMissionLeads = missionLeads.length > visibleMissionLeads.length

  return (
    <article
      style={{ animationDelay: `${animationDelay}ms` }}
      className="animate-dashboard-enter rounded-lg border border-white/10 bg-zinc-900/70 p-5 shadow-xl shadow-black/20 backdrop-blur sm:p-6"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-white/10 bg-black/30 text-red-300">
              <Activity size={22} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">
                Foco operacional
              </p>
              <h2 className="mt-1 text-xl font-black text-white">Ritmo de Guerra</h2>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span
              className={`rounded-md border px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] ${style.badge}`}
            >
              {style.label}
            </span>
            <p className="text-sm font-semibold text-zinc-300">{rhythm.supportText}</p>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.12em] text-zinc-600">
              <span>Meta acumulada atingida</span>
              <span>
                <AnimatedNumber value={progress} suffix="%" animationKey={animationKey} />
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-black/40 ring-1 ring-white/10">
              <AnimatedProgressBar
                value={progress}
                animationKey={animationKey}
                className={`h-full rounded-full bg-gradient-to-r ${style.bar} shadow-[0_0_18px_rgba(239,68,68,0.22)]`}
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <FocusStat
              label="Missão de hoje"
              value={rhythm.missaoHoje}
              highlight
              animationKey={animationKey}
              className="col-span-2 sm:col-span-1"
            />
            <div className="col-span-2 grid grid-cols-3 divide-x divide-white/10 rounded-lg border border-white/10 bg-black/10 sm:col-span-2">
              <SecondaryStat
                label="Faltando hoje"
                value={rhythm.faltamHoje}
                danger={rhythm.faltamHoje > 0}
                animationKey={animationKey}
              />
              <SecondaryStat
                label="Realizado hoje"
                value={rhythm.realizadoHoje}
                animationKey={animationKey}
              />
              <SecondaryStat
                label="Saldo do ritmo"
                value={rhythm.saldo}
                signed
                danger={rhythm.saldo > 0}
                success={rhythm.saldo < 0}
                animationKey={animationKey}
              />
            </div>
          </div>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-72 lg:shrink-0 lg:grid-cols-1">
          <button
            type="button"
            onClick={onOpenOverdue}
            className="flex items-center justify-between gap-2 rounded-lg border border-red-500/25 bg-red-950/20 px-4 py-3 text-left transition hover:border-red-400/45 hover:bg-red-950/30 focus:outline-none focus:ring-2 focus:ring-red-300/40"
          >
            <span className="flex min-w-0 items-center gap-2">
              <AlertTriangle size={17} className="shrink-0 text-red-300" aria-hidden="true" />
              <span className="min-w-0 truncate text-sm font-bold text-red-100">
                Follow-ups vencidos
              </span>
            </span>
            <span className="shrink-0 text-lg font-black text-white">
              <AnimatedNumber value={overdueFollowUps} animationKey={animationKey} />
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenCaveira}
            className="flex items-center justify-between gap-2 rounded-lg border border-red-500/25 bg-red-950/20 px-4 py-3 text-left transition hover:border-red-400/45 hover:bg-red-950/30 focus:outline-none focus:ring-2 focus:ring-red-300/40"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Flame size={17} className="shrink-0 text-red-300" aria-hidden="true" />
              <span className="min-w-0 truncate text-sm font-bold text-red-100">
                Leads Caveira
              </span>
            </span>
            <span className="shrink-0 text-lg font-black text-white">
              <AnimatedNumber value={caveiraLeads} animationKey={animationKey} />
            </span>
          </button>
        </div>
      </div>

      <div className="mt-5 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
            Missão do dia
          </p>
          {hasMoreMissionLeads && (
            <button
              type="button"
              onClick={onSeeAllMissions}
              className="text-xs font-black uppercase tracking-[0.1em] text-red-300 transition hover:text-white"
            >
              Ver todas
            </button>
          )}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {visibleMissionLeads.map((lead) => (
            <MissionItem key={lead.id} lead={lead} />
          ))}
          {missionLeads.length === 0 && (
            <p className="rounded-md border border-white/10 bg-black/25 p-3 text-sm font-semibold text-zinc-400 sm:col-span-2 lg:col-span-4">
              Nenhuma missão marcada para hoje.
            </p>
          )}
        </div>
      </div>
    </article>
  )
}

function FocusStat({
  label,
  value,
  highlight = false,
  danger = false,
  success = false,
  signed = false,
  animationKey,
  className = '',
}) {
  const valueClass = danger
    ? 'text-red-200'
    : success
      ? 'text-emerald-200'
      : highlight
        ? 'text-white'
        : 'text-zinc-100'
  const numericValue = Number(value)
  const signPrefix = signed && numericValue > 0 ? '+' : signed && numericValue < 0 ? '-' : ''

  return (
    <div
      className={`min-w-0 rounded-lg border p-3 ${
        highlight ? 'border-red-500/25 bg-red-950/20' : 'border-white/10 bg-black/25'
      } ${className}`}
    >
      <p className="text-[11px] font-black uppercase leading-4 tracking-[0.1em] text-zinc-600">
        {label}
      </p>
      <p className={`mt-1 text-xl font-black leading-none ${valueClass}`}>
        <AnimatedNumber
          value={Math.abs(numericValue)}
          prefix={signPrefix}
          animationKey={animationKey}
        />
      </p>
    </div>
  )
}

function SecondaryStat({ label, value, danger = false, success = false, signed = false, animationKey }) {
  const valueClass = danger ? 'text-red-300' : success ? 'text-emerald-300' : 'text-zinc-300'
  const numericValue = Number(value)
  const signPrefix = signed && numericValue > 0 ? '+' : signed && numericValue < 0 ? '-' : ''

  return (
    <div className="min-w-0 p-3 text-center">
      <p className="truncate text-[10px] font-bold uppercase leading-4 tracking-[0.08em] text-zinc-600">
        {label}
      </p>
      <p className={`mt-1 text-base font-black leading-none ${valueClass}`}>
        <AnimatedNumber
          value={Math.abs(numericValue)}
          prefix={signPrefix}
          animationKey={animationKey}
        />
      </p>
    </div>
  )
}

function MissionItem({ lead }) {
  return (
    <div className="min-w-0 rounded-md border border-white/10 bg-black/25 p-3">
      <p className="break-words text-sm font-black text-white">{lead.empresa}</p>
      <p className="mt-1 text-xs font-semibold text-zinc-500">
        {lead.proxima_acao || lead.ultima_acao || 'Contato comercial'}
      </p>
    </div>
  )
}

export default OperationalFocus
