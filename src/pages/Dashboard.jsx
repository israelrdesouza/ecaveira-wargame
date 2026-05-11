import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Crosshair,
  Eye,
  Flame,
  Handshake,
  Info,
  Loader2,
  PhoneCall,
  Plus,
  Radar,
  Trophy,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import StatCard from '../components/StatCard'
import { useAuth } from '../hooks/useAuth'
import { getDashboardData } from '../services/dashboardService'
import { updateLead } from '../services/leadService'
import { formatCurrencyBRL, formatDateBR, formatPhoneBR } from '../utils/formatters'
import { EditLeadModal } from './Leads'

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
    dateField: 'data_suspect',
    title: 'Suspects',
    subtitle: 'Leads que entraram como Suspect no período selecionado.',
  },
  prospects: {
    stage: 'prospect',
    dateField: 'data_prospect',
    title: 'Prospects',
    subtitle: 'Leads que chegaram em Prospect no período selecionado.',
  },
  demos: {
    stage: 'demo',
    dateField: 'data_demo',
    title: 'Demos',
    subtitle: 'Leads que chegaram em Demo no período selecionado.',
  },
  negociacoes: {
    stage: 'negociacao',
    dateField: 'data_negociacao',
    title: 'Negociações',
    subtitle: 'Leads que chegaram em Negociação no período selecionado.',
  },
  fechamentos: {
    stage: 'fechado',
    dateField: 'data_fechamento',
    title: 'Fechamentos',
    subtitle: 'Leads fechados no período selecionado.',
  },
}

const inactiveStages = new Set(['fechado', 'perdido'])
const dashboardPeriodDateFields = [
  'data_suspect',
  'data_prospect',
  'data_demo',
  'data_negociacao',
  'data_fechamento',
]
const stageChartColors = {
  Suspects: '#ef4444',
  Prospects: '#f97316',
  Demos: '#f59e0b',
  Negociações: '#22c55e',
  Fechamentos: '#14b8a6',
}
const temperatureChartColors = {
  Frio: '#64748b',
  Morno: '#f59e0b',
  Quente: '#f97316',
  Caveira: '#ef4444',
}

const monthOptions = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
]

function getCurrentPeriod() {
  const now = new Date()

  return {
    mes: now.getMonth() + 1,
    ano: now.getFullYear(),
  }
}

function Dashboard({ onNavigate }) {
  const { user } = useAuth()
  const [period, setPeriod] = useState(getCurrentPeriod)
  const { mes, ano } = period
  const [periodForm, setPeriodForm] = useState(() => ({
    mes: String(getCurrentPeriod().mes),
    ano: String(getCurrentPeriod().ano),
  }))
  const [dashboardData, setDashboardData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [drilldown, setDrilldown] = useState(null)
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false)
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false)
  const [editingLead, setEditingLead] = useState(null)
  const [savingLeadEdit, setSavingLeadEdit] = useState(false)
  const [leadEditError, setLeadEditError] = useState('')

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
  const warRhythm = getWarRhythm(dashboardData?.goal, leads, mes, ano)
  const stageDonutData = getStageDonutData(stages)
  const temperatureDonutData = getTemperatureDonutData(leads, mes, ano)

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
        currentLeads.filter((lead) => isDateInMonth(lead[config.dateField], mes, ano)),
    })
  }

  function closeDrilldown() {
    setDrilldown(null)
  }

  function openRiskModal() {
    setIsRiskModalOpen(true)
  }

  function closeRiskModal() {
    setIsRiskModalOpen(false)
  }

  function openPeriodModal() {
    setPeriodForm({
      mes: String(mes),
      ano: String(ano),
    })
    setIsPeriodModalOpen(true)
  }

  function closePeriodModal() {
    setIsPeriodModalOpen(false)
  }

  function updatePeriodField(event) {
    const { name, value } = event.target
    setPeriodForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function applyPeriod(event) {
    event.preventDefault()

    const nextMonth = Number(periodForm.mes)
    const nextYear = Number(periodForm.ano)

    if (!Number.isInteger(nextMonth) || nextMonth < 1 || nextMonth > 12) {
      return
    }

    if (!Number.isInteger(nextYear) || nextYear < 2000 || nextYear > 2100) {
      return
    }

    setPeriod({ mes: nextMonth, ano: nextYear })
    setDrilldown(null)
    setIsRiskModalOpen(false)
    setIsPeriodModalOpen(false)
  }

  function applyCurrentMonth() {
    const current = getCurrentPeriod()
    setPeriod(current)
    setPeriodForm({
      mes: String(current.mes),
      ano: String(current.ano),
    })
    setDrilldown(null)
    setIsRiskModalOpen(false)
    setIsPeriodModalOpen(false)
  }

  function openLeadDetails(lead) {
    if (!lead?.id) {
      return
    }

    setEditingLead(lead)
    setLeadEditError('')
    setDrilldown(null)
    setIsRiskModalOpen(false)
  }

  async function handleSaveLeadEdit(form) {
    if (!editingLead || savingLeadEdit) {
      return
    }

    setSavingLeadEdit(true)
    setLeadEditError('')

    try {
      await updateLead(editingLead, form, editingLead.user_id || user.id)
      const data = await getDashboardData(user.id, mes, ano)

      setDashboardData(data)
      setDrilldown((current) =>
        current?.getLeads
          ? {
              ...current,
              leads: current.getLeads(data.leads ?? []),
            }
          : current,
      )
      setEditingLead(null)
    } catch (leadError) {
      setLeadEditError(leadError.message || 'Não foi possível atualizar o lead.')
    } finally {
      setSavingLeadEdit(false)
    }
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
            lead.proximo_contato < today &&
            isDateInMonth(lead.proximo_contato, mes, ano),
        )
      },
    },
    caveiraLeads: {
      title: 'Leads Caveira',
      subtitle: 'Leads ativos com temperatura Caveira.',
      getLeads: (currentLeads) =>
        getLeadsMovedInPeriod(currentLeads, mes, ano).filter(
          (lead) =>
            !inactiveStages.has(lead.etapa_atual) && lead.temperatura === 'caveira',
        ),
    },
    todayMission: {
      title: 'Missão do Dia',
      subtitle: 'Leads com próximo contato marcado para hoje.',
      getLeads: (currentLeads) => {
        const today = getTodayISODate()
        return currentLeads.filter(
          (lead) =>
            lead.proximo_contato === today &&
            isDateInMonth(lead.proximo_contato, mes, ano),
        )
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
            onAction={openPeriodModal}
            actionTitle="Selecionar período"
            actionIcon={CalendarClock}
          />
          <HeaderSignal
            label="Risco operacional"
            value={`${auxiliary?.operationalRisk ?? 0} pendências`}
            danger={(auxiliary?.operationalRisk ?? 0) > 0}
            onAction={openRiskModal}
            actionTitle="Ver pendências"
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

      <WarRhythmCard rhythm={warRhythm} />

      <div className="grid gap-4 xl:grid-cols-2">
        <DonutChartCard
          title="Distribuição por etapa"
          subtitle="Realizado do mês por passagem no funil."
          data={stageDonutData}
          colors={stageChartColors}
        />
        <DonutChartCard
          title="Distribuição por temperatura"
          subtitle="Leads movimentados no período por temperatura."
          data={temperatureDonutData}
          colors={temperatureChartColors}
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
          <DrilldownModal
            drilldown={drilldown}
            onClose={closeDrilldown}
            onOpenLead={openLeadDetails}
          />,
          document.body,
        )}
      {isRiskModalOpen &&
        createPortal(
          <RiskModal
            leads={lists?.overdueFollowUps ?? []}
            onClose={closeRiskModal}
            onOpenLead={openLeadDetails}
          />,
          document.body,
        )}
      {isPeriodModalOpen &&
        createPortal(
          <PeriodModal
            form={periodForm}
            onChange={updatePeriodField}
            onApply={applyPeriod}
            onCurrentMonth={applyCurrentMonth}
            onClose={closePeriodModal}
          />,
          document.body,
        )}
      {editingLead && (
        <EditLeadModal
          lead={editingLead}
          error={leadEditError}
          isSaving={savingLeadEdit}
          onClose={() => {
            if (!savingLeadEdit) {
              setEditingLead(null)
              setLeadEditError('')
            }
          }}
          onSave={handleSaveLeadEdit}
        />
      )}
    </section>
  )
}

function HeaderSignal({
  label,
  value,
  danger = false,
  onAction,
  actionTitle,
  actionIcon: ActionIcon = Info,
}) {
  return (
    <div className="min-w-0 border-white/10 px-5 py-4 sm:border-r sm:last:border-r-0">
      <div className="flex items-center gap-2">
        <p className="break-words text-xs font-black uppercase leading-4 tracking-[0.14em] text-zinc-600">
          {label}
        </p>
        {onAction && (
          <button
            type="button"
            onClick={onAction}
            title={actionTitle}
            aria-label={actionTitle}
            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md border border-red-500/20 bg-red-950/10 text-red-300 transition hover:border-red-400/40 hover:bg-red-950/25 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-300/35"
          >
            <ActionIcon size={14} />
          </button>
        )}
      </div>
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

function PeriodModal({ form, onChange, onApply, onCurrentMonth, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
      <form
        onSubmit={onApply}
        className="w-full max-w-lg rounded-lg border border-red-500/20 bg-zinc-950/95 p-5 shadow-2xl shadow-black/60 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
              Filtro do cockpit
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">Selecionar período</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-zinc-500">
              Consulte metas, cards, drilldowns, risco, ritmo e gráficos de outro mês.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 text-zinc-500 transition hover:border-red-500/35 hover:text-white"
            aria-label="Fechar seleção de período"
          >
            <X size={17} />
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_0.75fr]">
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
              Mês
            </span>
            <select
              name="mes"
              value={form.mes}
              onChange={onChange}
              className="h-11 w-full rounded-md border border-white/10 bg-black/30 px-3 text-sm font-semibold text-white outline-none transition focus:border-red-500"
            >
              {monthOptions.map((month) => (
                <option key={month.value} value={month.value} className="bg-zinc-950">
                  {month.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
              Ano
            </span>
            <input
              type="number"
              name="ano"
              min="2000"
              max="2100"
              value={form.ano}
              onChange={onChange}
              className="h-11 w-full rounded-md border border-white/10 bg-black/30 px-3 text-sm font-semibold text-white outline-none transition focus:border-red-500"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-md border border-white/10 px-4 text-sm font-black text-zinc-300 transition hover:border-red-500/30 hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onCurrentMonth}
            className="inline-flex h-10 items-center justify-center rounded-md border border-red-500/20 bg-red-950/15 px-4 text-sm font-black text-red-100 transition hover:border-red-400/40 hover:bg-red-950/30 hover:text-white"
          >
            Mês atual
          </button>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-black text-white shadow-[0_0_24px_rgba(220,38,38,0.24)] transition hover:bg-red-500"
          >
            Aplicar
          </button>
        </div>
      </form>
    </div>
  )
}

function RiskModal({ leads, onClose, onOpenLead }) {
  const records = (leads ?? []).map((lead) => ({
    ...lead,
    pendingType: 'Follow-up vencido',
  }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <article className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-lg border border-red-500/20 bg-zinc-950 shadow-2xl shadow-black/60">
        <header className="flex items-start justify-between gap-4 border-b border-white/10 p-5 sm:p-6">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
              Pendências
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">Risco Operacional</h2>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-zinc-500">
              Pendências que exigem atenção no período atual.
            </p>
            <p className="mt-3 w-fit rounded-md border border-red-500/20 bg-red-950/20 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-red-200">
              {records.length} pendência{records.length === 1 ? '' : 's'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 text-zinc-400 transition hover:border-red-500/40 hover:text-white"
            aria-label="Fechar risco operacional"
          >
            <X size={18} />
          </button>
        </header>

        <div className="max-h-[68vh] overflow-y-auto p-4 sm:p-5">
          {records.length === 0 ? (
            <p className="rounded-md border border-white/10 bg-black/25 p-4 text-sm font-semibold text-zinc-400">
              Sem pendências operacionais no período.
            </p>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-[1120px] w-full table-fixed text-left">
                  <thead className="border-b border-white/10 bg-black/25">
                    <tr className="text-xs font-black uppercase tracking-[0.12em] text-zinc-600">
                      <th className="w-[140px] px-3 py-3">Tipo</th>
                      <th className="w-[180px] px-3 py-3">Empresa/Pessoa</th>
                      <th className="w-[140px] px-3 py-3">Contato</th>
                      <th className="w-[132px] px-3 py-3">Celular</th>
                      <th className="w-[130px] px-3 py-3">Produto</th>
                      <th className="w-[130px] px-3 py-3">Origem</th>
                      <th className="w-[112px] px-3 py-3">Etapa</th>
                      <th className="w-[118px] px-3 py-3">Temp.</th>
                      <th className="w-[128px] px-3 py-3">Próx. contato</th>
                      <th className="w-[170px] px-3 py-3">Última ação</th>
                      <th className="sticky right-0 z-20 w-[104px] bg-black/95 px-3 py-3 text-right shadow-[-14px_0_24px_rgba(0,0,0,0.45)]">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {records.map((lead) => (
                      <RiskTableRow key={lead.id} lead={lead} onOpenLead={onOpenLead} />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 lg:hidden">
                {records.map((lead) => (
                  <RiskLeadCard key={lead.id} lead={lead} onOpenLead={onOpenLead} />
                ))}
              </div>
            </>
          )}
        </div>
      </article>
    </div>
  )
}

function RiskTableRow({ lead, onOpenLead }) {
  return (
    <tr className="text-sm text-zinc-300 transition hover:bg-white/[0.025]">
      <td className="px-3 py-3">
        <SmallBadge>{lead.pendingType}</SmallBadge>
      </td>
      <td className="break-words px-3 py-3 font-black text-white">{lead.empresa || '-'}</td>
      <td className="break-words px-3 py-3 font-semibold text-zinc-400">{lead.contato || '-'}</td>
      <td className="whitespace-nowrap px-3 py-3 font-semibold text-zinc-400">
        {formatPhoneBR(lead.celular) || '-'}
      </td>
      <td className="break-words px-3 py-3 font-semibold text-zinc-400">
        {lead.produto || '-'}
      </td>
      <td className="break-words px-3 py-3 font-semibold text-zinc-400">
        {lead.origem || '-'}
      </td>
      <td className="px-3 py-3">
        <SmallBadge>{formatStage(lead.etapa_atual)}</SmallBadge>
      </td>
      <td className="px-3 py-3">
        <SmallBadge>{formatTemperature(lead.temperatura)}</SmallBadge>
      </td>
      <td className="whitespace-nowrap px-3 py-3 font-semibold text-zinc-400">
        {lead.proximo_contato ? formatDateBR(lead.proximo_contato) : '-'}
      </td>
      <td className="break-words px-3 py-3 font-semibold text-zinc-400">
        {lead.ultima_acao || lead.proxima_acao || '-'}
      </td>
      <td className="sticky right-0 z-10 bg-zinc-950/95 px-3 py-3 text-right shadow-[-14px_0_24px_rgba(0,0,0,0.38)]">
        <OpenLeadButton onClick={() => onOpenLead(lead)} />
      </td>
    </tr>
  )
}

function RiskLeadCard({ lead, onOpenLead }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <SmallBadge>{lead.pendingType}</SmallBadge>
          <p className="mt-3 break-words text-base font-black text-white">
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
      <div className="mt-4 flex justify-end">
        <OpenLeadButton onClick={() => onOpenLead(lead)} />
      </div>
    </div>
  )
}

function WarRhythmCard({ rhythm }) {
  const statusStyles = {
    atrasado: {
      label: 'Atrasado',
      badge: 'border-red-500/30 bg-red-950/30 text-red-100',
      icon: 'text-red-300',
      bar: 'from-red-700 via-red-500 to-red-300',
    },
    ritmo: {
      label: 'No ritmo',
      badge: 'border-emerald-500/25 bg-emerald-950/20 text-emerald-100',
      icon: 'text-emerald-300',
      bar: 'from-zinc-700 via-emerald-700 to-emerald-400',
    },
    adiantado: {
      label: 'Adiantado',
      badge: 'border-emerald-500/35 bg-emerald-950/25 text-emerald-100',
      icon: 'text-emerald-300',
      bar: 'from-emerald-800 via-emerald-600 to-emerald-300',
    },
  }
  const style = statusStyles[rhythm.status] ?? statusStyles.ritmo
  const progress =
    rhythm.metaAcumulada > 0
      ? Math.min(Math.round((rhythm.realizadoAcumulado / rhythm.metaAcumulada) * 100), 100)
      : 0

  return (
    <article className="overflow-hidden rounded-lg border border-white/10 bg-zinc-900/70 shadow-xl shadow-black/20 backdrop-blur">
      <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] lg:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-white/10 bg-black/30 ${style.icon}`}>
              <Activity size={22} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
                Execução diária
              </p>
              <h2 className="mt-1 text-xl font-black text-white">
                Ritmo de Guerra
              </h2>
              <p className="mt-1 text-sm font-semibold text-zinc-500">
                Controle diário da meta de Suspects.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className={`rounded-md border px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] ${style.badge}`}>
              {style.label}
            </span>
            <p className="text-sm font-semibold text-zinc-400">{rhythm.supportText}</p>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.12em] text-zinc-600">
              <span>Acumulado</span>
              <span>{progress}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-black/40 ring-1 ring-white/10">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${style.bar} shadow-[0_0_18px_rgba(239,68,68,0.22)]`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <RhythmMetric label="Missão de hoje" value={rhythm.missaoHoje} highlight />
          <RhythmMetric label="Realizado hoje" value={rhythm.realizadoHoje} />
          <RhythmMetric label="Faltam hoje" value={rhythm.faltamHoje} danger={rhythm.faltamHoje > 0} />
          <RhythmMetric label="Meta base diária" value={rhythm.metaBaseDiaria} />
          <RhythmMetric label="Realizado acumulado" value={rhythm.realizadoAcumulado} />
          <RhythmMetric label="Meta acumulada" value={rhythm.metaAcumulada} />
          <RhythmMetric label="Saldo do ritmo" value={formatSignedNumber(rhythm.saldo)} danger={rhythm.saldo > 0} success={rhythm.saldo < 0} />
          <RhythmMetric label="Dias úteis decorridos" value={`${rhythm.diasUteisDecorridos}/${rhythm.diasUteis}`} />
        </div>
      </div>
    </article>
  )
}

function RhythmMetric({ label, value, highlight = false, danger = false, success = false }) {
  const valueClass = danger
    ? 'text-red-200'
    : success
      ? 'text-emerald-200'
      : highlight
        ? 'text-white'
        : 'text-zinc-100'

  return (
    <div className={`min-w-0 rounded-lg border p-4 ${highlight ? 'border-red-500/25 bg-red-950/20' : 'border-white/10 bg-black/25'}`}>
      <p className="text-xs font-black uppercase leading-4 tracking-[0.12em] text-zinc-600">
        {label}
      </p>
      <p className={`mt-2 break-words text-2xl font-black leading-none ${valueClass}`}>
        {value}
      </p>
    </div>
  )
}

function DonutChartCard({ title, subtitle, data, colors }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const hasData = total > 0

  return (
    <article className="rounded-lg border border-white/10 bg-zinc-900/70 p-5 shadow-xl shadow-black/20 backdrop-blur">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-black text-white">{title}</h2>
          <p className="mt-1 text-sm font-medium text-zinc-500">{subtitle}</p>
        </div>
        <span className="w-fit rounded-md border border-red-500/20 bg-red-950/20 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-red-200">
          {total} total
        </span>
      </div>

      {hasData ? (
        <div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] md:items-center">
          <div className="relative h-64 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="label"
                  innerRadius="62%"
                  outerRadius="82%"
                  paddingAngle={3}
                  stroke="rgba(24,24,27,0.95)"
                  strokeWidth={4}
                >
                  {data.map((item) => (
                    <Cell
                      key={item.label}
                      fill={colors[item.label] ?? '#ef4444'}
                      className="outline-none transition-opacity hover:opacity-80"
                    />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip total={total} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-3xl font-black leading-none text-white">{total}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-zinc-600">
                  Leads
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {data.map((item) => (
              <DonutLegendItem
                key={item.label}
                item={item}
                total={total}
                color={colors[item.label] ?? '#ef4444'}
              />
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-5 rounded-md border border-white/10 bg-black/25 p-4 text-sm font-semibold text-zinc-400">
          Sem dados para exibir no período.
        </p>
      )}
    </article>
  )
}

function DonutLegendItem({ item, total, color }) {
  const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0

  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-md border border-white/10 bg-black/25 px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.25)]"
          style={{ backgroundColor: color }}
        />
        <span className="truncate text-sm font-black text-zinc-200">{item.label}</span>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-black text-white">{item.value}</p>
        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-zinc-600">
          {percentage}%
        </p>
      </div>
    </div>
  )
}

function DonutTooltip({ active, payload, total }) {
  if (!active || !payload?.length) {
    return null
  }

  const item = payload[0]?.payload
  const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0

  return (
    <div className="rounded-md border border-white/10 bg-zinc-950/95 px-3 py-2 text-sm shadow-xl shadow-black/40">
      <p className="font-black text-white">{item.label}</p>
      <p className="mt-1 font-semibold text-zinc-400">
        {item.value} registros · {percentage}%
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

function DrilldownModal({ drilldown, onClose, onOpenLead }) {
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
                <table className="min-w-[1120px] w-full table-fixed text-left">
                  <thead className="border-b border-white/10 bg-black/25">
                    <tr className="text-xs font-black uppercase tracking-[0.12em] text-zinc-600">
                      <th className="w-[190px] px-3 py-3">Empresa/Pessoa</th>
                      <th className="w-[145px] px-3 py-3">Contato</th>
                      <th className="w-[132px] px-3 py-3">Celular</th>
                      <th className="w-[130px] px-3 py-3">Produto</th>
                      <th className="w-[130px] px-3 py-3">Origem</th>
                      <th className="w-[112px] px-3 py-3">Etapa</th>
                      <th className="w-[118px] px-3 py-3">Temp.</th>
                      <th className="w-[128px] px-3 py-3">Próx. contato</th>
                      <th className="w-[170px] px-3 py-3">Última ação</th>
                      <th className="sticky right-0 z-20 w-[104px] bg-black/95 px-3 py-3 text-right shadow-[-14px_0_24px_rgba(0,0,0,0.45)]">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {records.map((lead) => (
                      <DrilldownTableRow
                        key={lead.id}
                        lead={lead}
                        onOpenLead={onOpenLead}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 lg:hidden">
                {records.map((lead) => (
                  <DrilldownLeadCard
                    key={lead.id}
                    lead={lead}
                    onOpenLead={onOpenLead}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </article>
    </div>
  )
}

function DrilldownTableRow({ lead, onOpenLead }) {
  return (
    <tr className="text-sm text-zinc-300 transition hover:bg-white/[0.025]">
      <td className="break-words px-3 py-3 font-black text-white">{lead.empresa || '-'}</td>
      <td className="break-words px-3 py-3 font-semibold text-zinc-400">{lead.contato || '-'}</td>
      <td className="whitespace-nowrap px-3 py-3 font-semibold text-zinc-400">
        {formatPhoneBR(lead.celular) || '-'}
      </td>
      <td className="break-words px-3 py-3 font-semibold text-zinc-400">{lead.produto || '-'}</td>
      <td className="break-words px-3 py-3 font-semibold text-zinc-400">{lead.origem || '-'}</td>
      <td className="px-3 py-3">
        <SmallBadge>{formatStage(lead.etapa_atual)}</SmallBadge>
      </td>
      <td className="px-3 py-3">
        <SmallBadge>{formatTemperature(lead.temperatura)}</SmallBadge>
      </td>
      <td className="whitespace-nowrap px-3 py-3 font-semibold text-zinc-400">
        {lead.proximo_contato ? formatDateBR(lead.proximo_contato) : '-'}
      </td>
      <td className="break-words px-3 py-3 font-semibold text-zinc-400">
        {lead.ultima_acao || lead.proxima_acao || '-'}
      </td>
      <td className="sticky right-0 z-10 bg-zinc-950/95 px-3 py-3 text-right shadow-[-14px_0_24px_rgba(0,0,0,0.38)]">
        <OpenLeadButton onClick={() => onOpenLead(lead)} />
      </td>
    </tr>
  )
}

function DrilldownLeadCard({ lead, onOpenLead }) {
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
      <div className="mt-4 flex justify-end">
        <OpenLeadButton onClick={() => onOpenLead(lead)} />
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

function OpenLeadButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Abrir lead"
      aria-label="Abrir lead"
      className="inline-flex h-8 whitespace-nowrap items-center justify-center gap-1.5 rounded-md border border-red-500/25 bg-red-950/25 px-2.5 text-xs font-black text-red-100 shadow-sm shadow-black/20 transition hover:border-red-400/50 hover:bg-red-700/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-300/35"
    >
      <Eye size={14} />
      Abrir
    </button>
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

function getWarRhythm(goal, leads, month, year) {
  const metaSuspect = Math.max(Number(goal?.meta_suspect ?? 0), 0)
  const diasUteis = Math.max(
    Number(goal?.dias_uteis ?? countWeekdaysInMonth(year, month)),
    0,
  )
  const metaBaseDiaria = diasUteis > 0 ? Math.ceil(metaSuspect / diasUteis) : 0
  const referenceDate = getBusinessReferenceDate(year, month)
  const referenceISODate = referenceDate ? getLocalISODate(referenceDate) : ''
  const diasUteisDecorridos = referenceDate
    ? countWeekdaysUntil(year, month, referenceDate.getDate())
    : 0
  const metaAcumulada = metaBaseDiaria * diasUteisDecorridos
  const suspectLeads = (leads ?? []).filter((lead) =>
    isDateInMonth(getSuspectDate(lead), month, year),
  )
  const realizadoAcumulado = suspectLeads.filter(
    (lead) => getSuspectDate(lead) <= referenceISODate,
  ).length
  const realizadoHoje = suspectLeads.filter(
    (lead) => getSuspectDate(lead) === referenceISODate,
  ).length
  const saldo = metaAcumulada - realizadoAcumulado
  const missaoHoje = saldo > 0 ? metaBaseDiaria + saldo : metaBaseDiaria
  const faltamHoje = Math.max(missaoHoje - realizadoHoje, 0)
  const status = saldo > 0 ? 'atrasado' : saldo < 0 ? 'adiantado' : 'ritmo'

  return {
    metaSuspect,
    diasUteis,
    diasUteisDecorridos,
    metaBaseDiaria,
    metaAcumulada,
    realizadoAcumulado,
    realizadoHoje,
    saldo,
    missaoHoje,
    faltamHoje,
    status,
    supportText: getRhythmSupportText(saldo),
  }
}

function getStageDonutData(stages) {
  return (stages ?? []).map((stage) => ({
    label: stage.label,
    value: Number(stage.realizado ?? 0),
  }))
}

function getTemperatureDonutData(leads, month, year) {
  const periodLeads = getLeadsMovedInPeriod(leads, month, year)
  const temperatures = [
    { key: 'frio', label: 'Frio' },
    { key: 'morno', label: 'Morno' },
    { key: 'quente', label: 'Quente' },
    { key: 'caveira', label: 'Caveira' },
  ]

  return temperatures.map((temperature) => ({
    label: temperature.label,
    value: periodLeads.filter(
      (lead) => String(lead.temperatura || '').toLowerCase() === temperature.key,
    ).length,
  }))
}

function getLeadsMovedInPeriod(leads, month, year) {
  return (leads ?? []).filter((lead) =>
    dashboardPeriodDateFields.some((field) => isDateInMonth(lead[field], month, year)),
  )
}

function getRhythmSupportText(saldo) {
  if (saldo > 0) {
    return `Você está ${saldo} suspects atrás do ritmo.`
  }

  if (saldo < 0) {
    return `Você está ${Math.abs(saldo)} suspects adiantado.`
  }

  return 'Você está no ritmo da meta.'
}

function getSuspectDate(lead) {
  return String(lead?.data_suspect || lead?.created_at || '').slice(0, 10)
}

function getBusinessReferenceDate(year, month) {
  const today = new Date()
  const numericYear = Number(year)
  const numericMonth = Number(month)
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1

  if (numericYear > currentYear || (numericYear === currentYear && numericMonth > currentMonth)) {
    return null
  }

  const lastDay = new Date(numericYear, numericMonth, 0).getDate()
  const referenceDay =
    numericYear === currentYear && numericMonth === currentMonth
      ? Math.min(today.getDate(), lastDay)
      : lastDay
  let referenceDate = new Date(numericYear, numericMonth - 1, referenceDay)

  while (referenceDate.getMonth() === numericMonth - 1 && !isWeekday(referenceDate)) {
    referenceDate = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate() - 1,
    )
  }

  return referenceDate.getMonth() === numericMonth - 1 ? referenceDate : null
}

function countWeekdaysUntil(year, month, dayLimit) {
  const numericYear = Number(year)
  const numericMonth = Number(month)
  const lastDay = new Date(numericYear, numericMonth, 0).getDate()
  const safeLimit = Math.min(Math.max(Number(dayLimit), 0), lastDay)
  let days = 0

  for (let day = 1; day <= safeLimit; day += 1) {
    if (isWeekday(new Date(numericYear, numericMonth - 1, day))) {
      days += 1
    }
  }

  return days
}

function countWeekdaysInMonth(year, month) {
  const numericYear = Number(year)
  const numericMonth = Number(month)
  const lastDay = new Date(numericYear, numericMonth, 0).getDate()

  return countWeekdaysUntil(numericYear, numericMonth, lastDay)
}

function isWeekday(date) {
  const weekday = date.getDay()

  return weekday !== 0 && weekday !== 6
}

function isDateInMonth(value, month, year) {
  if (!value) {
    return false
  }

  const [dateYear, dateMonth] = String(value).slice(0, 10).split('-').map(Number)

  return dateYear === Number(year) && dateMonth === Number(month)
}

function getLocalISODate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatSignedNumber(value) {
  if (value > 0) {
    return `+${value}`
  }

  return String(value)
}

function getTodayISODate() {
  return new Date().toISOString().slice(0, 10)
}

export default Dashboard
