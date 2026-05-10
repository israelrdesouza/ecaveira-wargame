import {
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Crosshair,
  Flame,
  Handshake,
  Loader2,
  PhoneCall,
  Plus,
  Radar,
  Trophy,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import StatCard from '../components/StatCard'
import { useAuth } from '../hooks/useAuth'
import { getDashboardData } from '../services/dashboardService'
import { formatCurrencyBRL, formatDateBR } from '../utils/formatters'

const stageIconMap = {
  suspects: Radar,
  prospects: Crosshair,
  demos: CalendarClock,
  negociacoes: Handshake,
  fechamentos: Trophy,
}

const stageAccentMap = {
  suspects: 'cyan',
  prospects: 'zinc',
  demos: 'amber',
  negociacoes: 'amber',
  fechamentos: 'green',
}

function getCurrentPeriod() {
  const now = new Date()

  return {
    mes: now.getMonth() + 1,
    ano: now.getFullYear(),
  }
}

function Dashboard({ onNavigate }) {
  const { user } = useAuth()
  const [{ mes, ano }] = useState(getCurrentPeriod)
  const [dashboardData, setDashboardData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      if (!user?.id) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError('')

      try {
        const data = await getDashboardData(user.id, mes, ano)

        if (isMounted) {
          setDashboardData(data)
        }
      } catch (dashboardError) {
        if (isMounted) {
          setError(dashboardError.message || 'Não foi possível carregar o dashboard.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [user?.id, mes, ano])

  const stages = dashboardData?.stages ?? []
  const auxiliary = dashboardData?.auxiliary
  const lists = dashboardData?.lists

  return (
    <section className="space-y-5 sm:space-y-6">
      <header className="overflow-hidden rounded-lg border border-white/10 bg-zinc-900/70 shadow-2xl shadow-black/25 backdrop-blur">
        <div className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-end md:p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-red-300">
              Painel real do cockpit
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
              QG COCKPIT — GUERRA COMERCIAL
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-zinc-400">
              Metas, pipeline, follow-ups e estratégia comercial em tempo real.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('newLead')}
            title="Novo alvo"
            aria-label="Novo alvo"
            className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-red-400/35 bg-red-600 text-white shadow-lg shadow-red-950/35 transition hover:scale-105 hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-300/50 md:h-16 md:w-16"
          >
            <Plus size={28} strokeWidth={2.8} />
          </button>
        </div>
        <div className="grid border-t border-white/10 bg-black/20 sm:grid-cols-3">
          <HeaderSignal
            label="Receita em jogo"
            value={formatCurrencyBRL(auxiliary?.revenueInPlay ?? 0)}
          />
          <HeaderSignal
            label="Período"
            value={`${String(mes).padStart(2, '0')}/${ano}`}
          />
          <HeaderSignal
            label="Risco operacional"
            value={`${auxiliary?.operationalRisk ?? 0} pendências`}
            danger={(auxiliary?.operationalRisk ?? 0) > 0}
          />
        </div>
      </header>

      {isLoading && (
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-900/70 p-4 text-sm font-semibold text-zinc-400 shadow-xl shadow-black/20 backdrop-blur">
          <Loader2 size={17} className="animate-spin text-red-300" />
          Carregando painel de guerra...
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/25 bg-red-950/20 p-4 text-sm font-semibold text-red-100">
          {error}
        </div>
      )}

      {!isLoading && !error && !dashboardData?.goal && (
        <div className="rounded-lg border border-amber-500/25 bg-amber-950/15 p-5 text-sm font-semibold text-amber-100">
          Cadastre as metas do mês para ativar o painel de guerra.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stages.map((stage) => (
          <StatCard
            key={stage.key}
            label={stage.label}
            value={`${stage.realizado} / ${stage.meta}`}
            meta={`${stage.percentual}%`}
            detail={`${stage.faltante} faltando para a meta`}
            progress={stage.percentual}
            icon={stageIconMap[stage.key]}
            accent={stageAccentMap[stage.key]}
          />
        ))}
        <StatCard
          label="Follow-ups vencidos"
          value={String(auxiliary?.overdueFollowUps ?? 0)}
          detail="Leads ativos com contato atrasado"
          progress={Math.min((auxiliary?.overdueFollowUps ?? 0) * 10, 100)}
          icon={AlertTriangle}
          accent="red"
        />
        <StatCard
          label="Leads Caveira"
          value={String(auxiliary?.caveiraLeads ?? 0)}
          detail="Leads quentes ainda em jogo"
          progress={Math.min((auxiliary?.caveiraLeads ?? 0) * 10, 100)}
          icon={Flame}
          accent="red"
        />
        <StatCard
          label="Missão do Dia"
          value={String(auxiliary?.todayMission ?? 0)}
          detail="Leads com próximo contato hoje"
          progress={Math.min((auxiliary?.todayMission ?? 0) * 10, 100)}
          icon={BadgeCheck}
          accent="zinc"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-lg border border-white/10 bg-zinc-900/70 p-5 shadow-xl shadow-black/20 backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-white">Pipeline em combate</h2>
              <p className="mt-1 text-sm font-medium text-zinc-500">
                Realizado do mês por data de passagem em cada etapa.
              </p>
            </div>
            <span className="w-fit rounded-md border border-red-500/25 bg-red-950/25 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-red-300">
              {String(mes).padStart(2, '0')}/{ano}
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {stages.map((stage) => (
              <div key={stage.key}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-extrabold text-zinc-300">{stage.label}</span>
                  <span className="font-black text-white">
                    {stage.realizado} / {stage.meta}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-black/40 ring-1 ring-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-zinc-700 via-red-700 to-red-400 shadow-[0_0_18px_rgba(239,68,68,0.35)]"
                    style={{ width: `${Math.min(stage.percentual, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-red-500/20 bg-red-950/15 p-5 shadow-xl shadow-red-950/10 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md border border-red-500/30 bg-red-950/35 text-red-300">
              <CheckCircle2 size={22} />
            </span>
            <div>
              <h2 className="text-lg font-black text-white">Missão do Dia</h2>
              <p className="mt-1 text-sm font-medium text-red-100/60">
                Leads com contato marcado para hoje.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {(lists?.todayMissionLeads ?? []).slice(0, 4).map((lead) => (
              <MissionItem key={lead.id} lead={lead} />
            ))}
            {(lists?.todayMissionLeads?.length ?? 0) === 0 && (
              <p className="rounded-md border border-white/10 bg-black/25 p-3 text-sm font-semibold text-zinc-400">
                Nenhuma missão marcada para hoje.
              </p>
            )}
          </div>
        </article>
      </div>

      <article className="rounded-lg border border-white/10 bg-zinc-900/70 p-5 shadow-xl shadow-black/20 backdrop-blur">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-white">Alvos Prioritários</h2>
            <p className="mt-1 text-sm font-medium text-zinc-500">
              Leads ativos com maior valor estimado em jogo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('leads')}
            className="inline-flex h-10 w-fit items-center gap-2 rounded-md border border-white/10 px-4 text-sm font-black text-zinc-200 transition hover:border-red-500/40 hover:text-white"
          >
            Ver leads
            <ChevronRight size={17} />
          </button>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {(lists?.priorityTargets ?? []).map((target) => (
            <PriorityTarget key={target.id} target={target} />
          ))}
          {(lists?.priorityTargets?.length ?? 0) === 0 && (
            <p className="rounded-md border border-white/10 bg-black/25 p-4 text-sm font-semibold text-zinc-400 lg:col-span-3">
              Nenhum alvo prioritário ativo no momento.
            </p>
          )}
        </div>
      </article>
    </section>
  )
}

function HeaderSignal({ label, value, danger = false }) {
  return (
    <div className="border-white/10 px-5 py-4 sm:border-r sm:last:border-r-0">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-600">
        {label}
      </p>
      <p className={`mt-1 text-xl font-black ${danger ? 'text-red-300' : 'text-white'}`}>
        {value}
      </p>
    </div>
  )
}

function MissionItem({ lead }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/25 p-3">
      <p className="text-sm font-black text-white">{lead.empresa}</p>
      <p className="mt-1 text-xs font-semibold text-zinc-500">
        {lead.proxima_acao || lead.ultima_acao || 'Contato comercial'}
      </p>
    </div>
  )
}

function PriorityTarget({ target }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-black text-white">{target.empresa}</p>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-red-300">
            {formatStage(target.etapa_atual)}
          </p>
        </div>
        <p className="rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-black text-zinc-100">
          {formatCurrencyBRL(target.valor_estimado || 0)}
        </p>
      </div>
      <div className="mt-4 space-y-2 text-sm font-medium text-zinc-400">
        <p className="flex gap-2">
          <PhoneCall className="mt-0.5 shrink-0 text-red-400" size={16} />
          <span>
            {target.proximo_contato
              ? `Próximo contato: ${formatDateBR(target.proximo_contato)}`
              : 'Sem próximo contato'}
          </span>
        </p>
        <p className="flex gap-2">
          <AlertTriangle className="mt-0.5 shrink-0 text-amber-300" size={16} />
          <span>{target.ultima_acao || 'Aguardando próxima ação'}</span>
        </p>
      </div>
    </div>
  )
}

function formatStage(stage) {
  const labels = {
    suspect: 'Suspect',
    prospect: 'Prospect',
    demo: 'Demo',
    negociacao: 'Negociação',
    fechado: 'Fechado',
    perdido: 'Perdido',
    congelado: 'Congelado',
  }

  return labels[stage] ?? stage
}

export default Dashboard
