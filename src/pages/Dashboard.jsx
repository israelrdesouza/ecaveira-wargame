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
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import StatCard from '../components/StatCard'
import { useAuth } from '../hooks/useAuth'
import { getDashboardData } from '../services/dashboardService'
import { formatCurrencyBRL, formatDateBR, formatPhoneBR } from '../utils/formatters'

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

const stageDrilldownMap = {
  suspects: {
    stage: 'suspect',
    title: 'Suspects',
    subtitle: 'Leads cuja etapa atual é Suspect.',
  },
  prospects: {
    stage: 'prospect',
    title: 'Prospects',
    subtitle: 'Leads cuja etapa atual é Prospect.',
  },
  demos: {
    stage: 'demo',
    title: 'Demos',
    subtitle: 'Leads cuja etapa atual é Demo.',
  },
  negociacoes: {
    stage: 'negociacao',
    title: 'Negociações',
    subtitle: 'Leads cuja etapa atual é Negociação.',
  },
  fechamentos: {
    stage: 'fechado',
    title: 'Fechamentos',
    subtitle: 'Leads cuja etapa atual é Fechamento.',
  },
}

const inactiveStages = new Set(['fechado', 'perdido'])

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
  const [drilldown, setDrilldown] = useState(null)

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
  const leads = dashboardData?.leads ?? []

  function openDrilldown(config) {
    if (!config) {
      return
    }

    setDrilldown({
      ...config,
      leads: config.getLeads(leads),
    })
  }

  function openStageDrilldown(stage) {
    const config = stageDrilldownMap[stage.key]

    openDrilldown({
      title: config.title,
      subtitle: config.subtitle,
      getLeads: (currentLeads) =>
        currentLeads.filter((lead) => lead.etapa_atual === config.stage),
    })
  }

  function closeDrilldown() {
    setDrilldown(null)
  }

  const auxiliaryDrilldowns = {
    overdueFollowUps: {
      title: 'Follow-ups vencidos',
      subtitle: 'Leads ativos com próximo contato menor que hoje.',
      getLeads: (currentLeads) => {
        const today = getTodayISODate()
        return currentLeads.filter(
          (lead) =>
            !inactiveStages.has(lead.etapa_atual) &&
            lead.proximo_contato &&
            lead.proximo_contato < today,
        )
      },
    },
    caveiraLeads: {
      title: 'Leads Caveira',
      subtitle: 'Leads ativos com temperatura Caveira.',
      getLeads: (currentLeads) =>
        currentLeads.filter(
          (lead) => !inactiveStages.has(lead.etapa_atual) && lead.temperatura === 'caveira',
        ),
    },
    todayMission: {
      title: 'Missão do Dia',
      subtitle: 'Leads com próximo contato marcado para hoje.',
      getLeads: (currentLeads) => {
        const today = getTodayISODate()
        return currentLeads.filter((lead) => lead.proximo_contato === today)
      },
    },
  }

  return (
    <section className="space-y-5 sm:space-y-6">
      <header className="overflow-hidden rounded-lg border border-white/10 bg-zinc-900/70 shadow-2xl shadow-black/25 backdrop-blur">
        <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:p-6">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-red-300">
              Painel real do cockpit
            </p>
            <h1 className="mt-2 max-w-full text-balance text-3xl font-black leading-[0.95] tracking-tight text-white sm:text-4xl xl:text-5xl">
              <span className="block xl:inline">QG COCKPIT</span>
              <span className="hidden xl:inline"> — </span>
              <span className="block xl:inline">GUERRA COMERCIAL</span>
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
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-red-400/35 bg-red-600 text-white shadow-lg shadow-red-950/35 transition hover:scale-105 hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-300/50 sm:h-14 sm:w-14 md:h-16 md:w-16 md:justify-self-end"
          >
            <Plus className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.8} />
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
            onIconClick={() => openStageDrilldown(stage)}
            onDoubleClick={() => openStageDrilldown(stage)}
            iconTitle="Ver leads"
          />
        ))}
        <StatCard
          label="Follow-ups vencidos"
          value={String(auxiliary?.overdueFollowUps ?? 0)}
          detail="Leads ativos com contato atrasado"
          progress={Math.min((auxiliary?.overdueFollowUps ?? 0) * 10, 100)}
          icon={AlertTriangle}
          accent="red"
          onIconClick={() => openDrilldown(auxiliaryDrilldowns.overdueFollowUps)}
          onDoubleClick={() => openDrilldown(auxiliaryDrilldowns.overdueFollowUps)}
          iconTitle="Ver leads"
        />
        <StatCard
          label="Leads Caveira"
          value={String(auxiliary?.caveiraLeads ?? 0)}
          detail="Leads quentes ainda em jogo"
          progress={Math.min((auxiliary?.caveiraLeads ?? 0) * 10, 100)}
          icon={Flame}
          accent="red"
          onIconClick={() => openDrilldown(auxiliaryDrilldowns.caveiraLeads)}
          onDoubleClick={() => openDrilldown(auxiliaryDrilldowns.caveiraLeads)}
          iconTitle="Ver leads"
        />
        <StatCard
          label="Missão do Dia"
          value={String(auxiliary?.todayMission ?? 0)}
          detail="Leads com próximo contato hoje"
          progress={Math.min((auxiliary?.todayMission ?? 0) * 10, 100)}
          icon={BadgeCheck}
          accent="zinc"
          onIconClick={() => openDrilldown(auxiliaryDrilldowns.todayMission)}
          onDoubleClick={() => openDrilldown(auxiliaryDrilldowns.todayMission)}
          iconTitle="Ver leads"
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

      {drilldown &&
        createPortal(
          <DrilldownModal drilldown={drilldown} onClose={closeDrilldown} />,
          document.body,
        )}
    </section>
  )
}

function HeaderSignal({ label, value, danger = false }) {
  return (
    <div className="min-w-0 border-white/10 px-5 py-4 sm:border-r sm:last:border-r-0">
      <p className="break-words text-xs font-black uppercase leading-4 tracking-[0.14em] text-zinc-600">
        {label}
      </p>
      <p
        className={`mt-1 break-words text-lg font-black leading-tight sm:text-xl ${
          danger ? 'text-red-300' : 'text-white'
        }`}
      >
        {value}
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

function PriorityTarget({ target }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-black/25 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-base font-black text-white">{target.empresa}</p>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-red-300">
            {formatStage(target.etapa_atual)}
          </p>
        </div>
        <p className="shrink-0 whitespace-nowrap rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-black text-zinc-100">
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

function DrilldownModal({ drilldown, onClose }) {
  const records = drilldown.leads ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <article className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-lg border border-red-500/20 bg-zinc-950 shadow-2xl shadow-black/60">
        <header className="flex items-start justify-between gap-4 border-b border-white/10 p-5 sm:p-6">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
              Drilldown
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">{drilldown.title}</h2>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-zinc-500">
              {drilldown.subtitle}
            </p>
            <p className="mt-3 w-fit rounded-md border border-white/10 bg-black/25 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-zinc-300">
              {records.length} registro{records.length === 1 ? '' : 's'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 text-zinc-400 transition hover:border-red-500/40 hover:text-white"
            aria-label="Fechar drilldown"
          >
            <X size={18} />
          </button>
        </header>

        <div className="max-h-[68vh] overflow-y-auto p-4 sm:p-5">
          {records.length === 0 ? (
            <p className="rounded-md border border-white/10 bg-black/25 p-4 text-sm font-semibold text-zinc-400">
              Nenhum lead encontrado para este indicador.
            </p>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-[1120px] w-full text-left">
                  <thead className="border-b border-white/10 bg-black/25">
                    <tr className="text-xs font-black uppercase tracking-[0.12em] text-zinc-600">
                      <th className="px-3 py-3">Empresa/Pessoa</th>
                      <th className="px-3 py-3">Contato</th>
                      <th className="px-3 py-3">Celular</th>
                      <th className="px-3 py-3">Produto</th>
                      <th className="px-3 py-3">Origem</th>
                      <th className="px-3 py-3">Etapa</th>
                      <th className="px-3 py-3">Temperatura</th>
                      <th className="px-3 py-3">Próximo contato</th>
                      <th className="px-3 py-3">Última ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {records.map((lead) => (
                      <DrilldownTableRow key={lead.id} lead={lead} />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 lg:hidden">
                {records.map((lead) => (
                  <DrilldownLeadCard key={lead.id} lead={lead} />
                ))}
              </div>
            </>
          )}
        </div>
      </article>
    </div>
  )
}

function DrilldownTableRow({ lead }) {
  return (
    <tr className="text-sm text-zinc-300 transition hover:bg-white/[0.025]">
      <td className="px-3 py-3 font-black text-white">{lead.empresa || '-'}</td>
      <td className="px-3 py-3 font-semibold text-zinc-400">{lead.contato || '-'}</td>
      <td className="whitespace-nowrap px-3 py-3 font-semibold text-zinc-400">
        {formatPhoneBR(lead.celular) || '-'}
      </td>
      <td className="px-3 py-3 font-semibold text-zinc-400">{lead.produto || '-'}</td>
      <td className="px-3 py-3 font-semibold text-zinc-400">{lead.origem || '-'}</td>
      <td className="px-3 py-3">
        <SmallBadge>{formatStage(lead.etapa_atual)}</SmallBadge>
      </td>
      <td className="px-3 py-3">
        <SmallBadge>{formatTemperature(lead.temperatura)}</SmallBadge>
      </td>
      <td className="whitespace-nowrap px-3 py-3 font-semibold text-zinc-400">
        {lead.proximo_contato ? formatDateBR(lead.proximo_contato) : '-'}
      </td>
      <td className="px-3 py-3 font-semibold text-zinc-400">
        {lead.ultima_acao || lead.proxima_acao || '-'}
      </td>
    </tr>
  )
}

function DrilldownLeadCard({ lead }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="break-words text-base font-black text-white">
            {lead.empresa || '-'}
          </p>
          <p className="mt-1 text-sm font-semibold text-zinc-400">
            {lead.contato || 'Sem contato informado'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SmallBadge>{formatStage(lead.etapa_atual)}</SmallBadge>
          <SmallBadge>{formatTemperature(lead.temperatura)}</SmallBadge>
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-sm font-semibold text-zinc-400 sm:grid-cols-2">
        <InfoLine label="Celular" value={formatPhoneBR(lead.celular) || '-'} />
        <InfoLine label="Produto" value={lead.produto || '-'} />
        <InfoLine label="Origem" value={lead.origem || '-'} />
        <InfoLine
          label="Próximo contato"
          value={lead.proximo_contato ? formatDateBR(lead.proximo_contato) : '-'}
        />
        <InfoLine
          label="Última ação"
          value={lead.ultima_acao || lead.proxima_acao || '-'}
          wide
        />
      </div>
    </div>
  )
}

function InfoLine({ label, value, wide = false }) {
  return (
    <p className={wide ? 'sm:col-span-2' : undefined}>
      <span className="text-xs font-black uppercase tracking-[0.12em] text-zinc-600">
        {label}:{' '}
      </span>
      <span>{value}</span>
    </p>
  )
}

function SmallBadge({ children }) {
  return (
    <span className="inline-flex min-h-7 items-center rounded-md border border-white/10 bg-zinc-900 px-2.5 py-1 text-xs font-black text-zinc-200">
      {children || '-'}
    </span>
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

function formatTemperature(temperature) {
  const labels = {
    frio: 'Frio',
    morno: 'Morno',
    quente: 'Quente',
    caveira: 'Caveira',
  }

  return labels[temperature] ?? temperature
}

function getTodayISODate() {
  return new Date().toISOString().slice(0, 10)
}

export default Dashboard
