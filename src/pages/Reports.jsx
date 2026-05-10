import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  FileDown,
  Filter,
  Flame,
  Loader2,
  Package,
  Radar,
  RotateCcw,
  Search,
  Target,
  Thermometer,
  Trophy,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getReportData } from '../services/reportService'
import { ORIGINS, PRODUCTS, TEMPERATURES } from '../utils/constants'
import {
  formatCurrencyBRL,
  formatDateBR,
  formatDateTimeBR,
  formatPhoneBR,
} from '../utils/formatters'

const STAGE_OPTIONS = [
  { label: 'Suspect', value: 'suspect' },
  { label: 'Prospect', value: 'prospect' },
  { label: 'Demo', value: 'demo' },
  { label: 'Negociação', value: 'negociacao' },
  { label: 'Fechado', value: 'fechado' },
  { label: 'Perdido', value: 'perdido' },
  { label: 'Congelado', value: 'congelado' },
]

const inactiveStages = new Set(['fechado', 'perdido'])

function Reports() {
  const { user } = useAuth()
  const [filters, setFilters] = useState(getDefaultFilters)
  const [appliedFilters, setAppliedFilters] = useState(getDefaultFilters)
  const [leads, setLeads] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [exportMessage, setExportMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadReports() {
      if (!user?.id) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError('')

      try {
        const data = await getReportData(user.id, normalizeFilters(appliedFilters))

        if (isMounted) {
          setLeads(data)
        }
      } catch (reportError) {
        if (isMounted) {
          setError(reportError.message || 'Não foi possível carregar os relatórios.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadReports()

    return () => {
      isMounted = false
    }
  }, [user?.id, appliedFilters])

  const summary = useMemo(() => getSummary(leads), [leads])

  function updateFilter(event) {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function applyFilters(event) {
    event.preventDefault()
    setExportMessage('')
    setAppliedFilters(filters)
  }

  function clearFilters() {
    const defaultFilters = getDefaultFilters()
    setExportMessage('')
    setFilters(defaultFilters)
    setAppliedFilters(defaultFilters)
  }

  function handleExport() {
    setExportMessage('Exportação será implementada em breve.')
  }

  return (
    <section className="space-y-5">
      <header className="overflow-hidden rounded-lg border border-white/10 bg-zinc-900/70 shadow-2xl shadow-black/25 backdrop-blur">
        <div className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-end md:p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-red-300">
              Inteligência comercial
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Relatórios
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-zinc-400">
              Consulte cadastros, produção por etapa, origens, produtos,
              temperaturas e follow-ups dentro do período selecionado.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row md:flex-col md:items-end">
            <div className="rounded-lg border border-red-500/20 bg-red-950/20 px-4 py-3 text-left sm:text-right">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-red-300">
                Período
              </p>
              <p className="mt-1 whitespace-nowrap text-sm font-black text-white">
                {formatReportPeriod(appliedFilters)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/10 bg-black/20 px-4 text-xs font-black uppercase tracking-[0.12em] text-zinc-300 transition hover:border-red-500/40 hover:text-white"
            >
              <FileDown size={16} />
              Exportar
            </button>
          </div>
        </div>
      </header>

      {exportMessage && (
        <div className="rounded-lg border border-amber-500/25 bg-amber-950/15 p-4 text-sm font-semibold text-amber-100">
          {exportMessage}
        </div>
      )}

      <form
        onSubmit={applyFilters}
        className="rounded-lg border border-white/10 bg-zinc-900/70 p-4 shadow-xl shadow-black/20 backdrop-blur"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <ReportField
            label="Data inicial"
            icon={CalendarDays}
            name="dataInicial"
            type="date"
            value={filters.dataInicial}
            onChange={updateFilter}
          />
          <ReportField
            label="Data final"
            icon={CalendarDays}
            name="dataFinal"
            type="date"
            value={filters.dataFinal}
            onChange={updateFilter}
          />
          <ReportSelect
            label="Etapa"
            icon={Target}
            name="etapa"
            value={filters.etapa}
            onChange={updateFilter}
            options={STAGE_OPTIONS}
          />
          <ReportSelect
            label="Produto"
            icon={Package}
            name="produto"
            value={filters.produto}
            onChange={updateFilter}
            options={PRODUCTS.map((product) => ({ label: product, value: product }))}
          />
          <ReportSelect
            label="Origem"
            icon={Radar}
            name="origem"
            value={filters.origem}
            onChange={updateFilter}
            options={ORIGINS.map((origin) => ({ label: origin, value: origin }))}
          />
          <ReportSelect
            label="Temperatura"
            icon={Thermometer}
            name="temperatura"
            value={filters.temperatura}
            onChange={updateFilter}
            options={TEMPERATURES.map((temperature) => ({
              label: temperature,
              value: temperature.toLowerCase(),
            }))}
          />
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/10 px-4 text-sm font-black text-zinc-300 transition hover:border-red-500/40 hover:text-white"
          >
            <RotateCcw size={17} />
            Limpar filtros
          </button>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-red-600 px-5 text-sm font-black text-white shadow-lg shadow-red-950/35 transition hover:bg-red-500"
          >
            <Filter size={17} />
            Aplicar filtros
          </button>
        </div>
      </form>

      {isLoading && (
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-900/70 p-4 text-sm font-semibold text-zinc-400 shadow-xl shadow-black/20 backdrop-blur">
          <Loader2 size={17} className="animate-spin text-red-300" />
          Carregando relatório comercial...
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/25 bg-red-950/20 p-4 text-sm font-semibold text-red-100">
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ReportCard
          label="Leads cadastrados"
          value={summary.total}
          detail="Total no período filtrado"
          icon={BarChart3}
        />
        <ReportCard label="Suspects" value={summary.suspect} icon={Radar} />
        <ReportCard label="Prospects" value={summary.prospect} icon={Target} />
        <ReportCard label="Demos" value={summary.demo} icon={CalendarDays} />
        <ReportCard label="Negociações" value={summary.negociacao} icon={Package} />
        <ReportCard label="Fechamentos" value={summary.fechado} icon={Trophy} />
        <ReportCard
          label="Follow-ups vencidos"
          value={summary.overdueFollowUps}
          detail="Leads ativos com atraso"
          icon={AlertTriangle}
          danger
        />
        <ReportCard
          label="Leads Caveira"
          value={summary.caveira}
          detail={
            summary.caveiraRevenue > 0
              ? `Valor em jogo: ${formatCurrencyBRL(summary.caveiraRevenue)}`
              : 'Leads críticos em acompanhamento'
          }
          icon={Flame}
          danger
        />
      </div>

      <ReportTable leads={leads} isLoading={isLoading} />
    </section>
  )
}

function ReportField({ label, icon: Icon, ...props }) {
  return (
    <label className="space-y-2">
      <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
        <Icon size={14} />
        {label}
      </span>
      <input
        {...props}
        className="h-11 w-full rounded-md border border-white/10 bg-black/30 px-3 text-sm font-semibold text-white outline-none transition focus:border-red-500"
      />
    </label>
  )
}

function ReportSelect({ label, icon: Icon, options, ...props }) {
  return (
    <label className="space-y-2">
      <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
        <Icon size={14} />
        {label}
      </span>
      <select
        {...props}
        className="h-11 w-full rounded-md border border-white/10 bg-black/30 px-3 text-sm font-semibold text-white outline-none transition focus:border-red-500"
      >
        <option value="" className="bg-zinc-950">
          Todos
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-zinc-950">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function ReportCard({ label, value, detail = 'Etapa atual', icon: Icon, danger = false }) {
  return (
    <article
      className={`rounded-lg border p-4 shadow-xl shadow-black/20 backdrop-blur ${
        danger
          ? 'border-red-500/25 bg-red-950/20'
          : 'border-white/10 bg-zinc-900/70'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black text-white">{value}</p>
          <p className="mt-1 text-sm font-semibold text-zinc-500">{detail}</p>
        </div>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${
            danger
              ? 'border-red-500/30 bg-red-950/35 text-red-300'
              : 'border-white/10 bg-black/25 text-zinc-300'
          }`}
        >
          <Icon size={20} />
        </span>
      </div>
    </article>
  )
}

function ReportTable({ leads, isLoading }) {
  return (
    <article className="overflow-hidden rounded-lg border border-white/10 bg-zinc-900/70 shadow-xl shadow-black/20 backdrop-blur">
      <div className="flex flex-col gap-2 border-b border-white/10 bg-black/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-white">Leads filtrados</h2>
          <p className="mt-1 text-sm font-medium text-zinc-500">
            Cadastros encontrados com os filtros atuais.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-md border border-red-500/25 bg-red-950/20 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-red-300">
          <Search size={14} />
          {leads.length} registros
        </span>
      </div>

      <div className="hidden overflow-x-auto pb-2 md:block [-webkit-overflow-scrolling:touch]">
        <table className="min-w-[1180px] text-left text-sm">
          <thead className="whitespace-nowrap border-b border-white/10 text-xs font-black uppercase tracking-[0.12em] text-zinc-600">
            <tr>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">Contato</th>
              <th className="px-4 py-3">Celular</th>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Origem</th>
              <th className="px-4 py-3">Etapa</th>
              <th className="px-4 py-3">Temperatura</th>
              <th className="px-4 py-3">Próximo contato</th>
              <th className="px-4 py-3">Criado em</th>
              <th className="px-4 py-3">Última ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {leads.map((lead) => (
              <tr key={lead.id} className="transition hover:bg-white/[0.025]">
                <td className="px-4 py-3 align-middle font-black text-white">
                  {lead.empresa}
                </td>
                <td className="px-4 py-3 align-middle font-semibold text-zinc-300">
                  {lead.contato || 'Não informado'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-middle font-medium text-zinc-400">
                  {formatPhoneBR(lead.celular)}
                </td>
                <td className="px-4 py-3 align-middle font-medium text-zinc-400">
                  {lead.produto || 'Não informado'}
                </td>
                <td className="px-4 py-3 align-middle font-medium text-zinc-400">
                  {lead.origem || 'Não informada'}
                </td>
                <td className="px-4 py-3 align-middle">
                  <StageBadge stage={lead.etapa_atual} />
                </td>
                <td className="px-4 py-3 align-middle">
                  <TemperatureBadge temperature={lead.temperatura} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-middle font-medium text-zinc-400">
                  {lead.proximo_contato ? formatDateBR(lead.proximo_contato) : 'Sem data'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-middle font-medium text-zinc-400">
                  {formatDateTimeBR(lead.created_at)}
                </td>
                <td className="min-w-44 px-4 py-3 align-middle font-medium text-zinc-400">
                  {lead.ultima_acao || 'Sem ação registrada'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-white/10 md:hidden">
        {leads.map((lead) => (
          <div key={lead.id} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-black text-white">{lead.empresa}</h3>
                <p className="mt-1 text-sm font-semibold text-zinc-500">
                  {lead.contato || 'Sem contato'}{' '}
                  <span className="whitespace-nowrap">· {formatPhoneBR(lead.celular)}</span>
                </p>
              </div>
              <StageBadge stage={lead.etapa_atual} />
            </div>
            <div className="grid gap-2 text-sm font-medium text-zinc-400 sm:grid-cols-2">
              <Info label="Produto" value={lead.produto || 'Não informado'} />
              <Info label="Origem" value={lead.origem || 'Não informada'} />
              <Info
                label="Próximo contato"
                value={lead.proximo_contato ? formatDateBR(lead.proximo_contato) : 'Sem data'}
              />
              <Info label="Criado em" value={formatDateTimeBR(lead.created_at)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <TemperatureBadge temperature={lead.temperatura} />
              <span className="rounded-md border border-white/10 bg-black/25 px-2.5 py-1 text-xs font-bold text-zinc-400">
                {lead.ultima_acao || 'Sem ação registrada'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {!isLoading && leads.length === 0 && (
        <div className="p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-red-500/25 bg-red-950/25 text-red-300">
            <Search size={22} />
          </div>
          <h3 className="mt-4 text-lg font-black text-white">
            Nenhum lead encontrado neste filtro.
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-zinc-500">
            Ajuste o período ou remova filtros para ampliar a consulta comercial.
          </p>
        </div>
      )}
    </article>
  )
}

function StageBadge({ stage }) {
  return (
    <span className="inline-flex h-8 w-fit items-center justify-center whitespace-nowrap rounded-md border border-white/10 bg-black/30 px-3 text-xs font-black leading-none text-zinc-200">
      {formatStage(stage)}
    </span>
  )
}

function TemperatureBadge({ temperature }) {
  const label = formatTemperature(temperature)
  const hot = label === 'Caveira' || label === 'Quente'

  return (
    <span
      className={`inline-flex h-8 w-fit items-center justify-center gap-1 whitespace-nowrap rounded-md border px-3 text-xs font-black leading-none ${
        hot
          ? 'border-red-500/30 bg-red-950/30 text-red-200'
          : 'border-zinc-600/30 bg-zinc-800/50 text-zinc-300'
      }`}
    >
      <Flame size={13} className="shrink-0" />
      {label}
    </span>
  )
}

function Info({ label, value }) {
  return (
    <p>
      <span className="font-black uppercase tracking-[0.12em] text-zinc-600">
        {label}:
      </span>{' '}
      {value}
    </p>
  )
}

function getSummary(leads) {
  const today = getTodayISODate()
  const activeLeads = leads.filter((lead) => !inactiveStages.has(lead.etapa_atual))
  const caveiraLeads = leads.filter((lead) => lead.temperatura === 'caveira')

  return {
    total: leads.length,
    suspect: countByStage(leads, 'suspect'),
    prospect: countByStage(leads, 'prospect'),
    demo: countByStage(leads, 'demo'),
    negociacao: countByStage(leads, 'negociacao'),
    fechado: countByStage(leads, 'fechado'),
    overdueFollowUps: activeLeads.filter(
      (lead) => lead.proximo_contato && lead.proximo_contato < today,
    ).length,
    caveira: caveiraLeads.length,
    caveiraRevenue: caveiraLeads.reduce(
      (total, lead) => total + Number(lead.valor_estimado || 0),
      0,
    ),
  }
}

function countByStage(leads, stage) {
  return leads.filter((lead) => lead.etapa_atual === stage).length
}

function formatReportPeriod(filters) {
  const initial = filters.dataInicial ? formatDateBR(filters.dataInicial) : 'início'
  const final = filters.dataFinal ? formatDateBR(filters.dataFinal) : 'hoje'

  return `${initial} até ${final}`
}

function normalizeFilters(filters) {
  return {
    ...filters,
    temperatura: filters.temperatura ? filters.temperatura.toLowerCase() : '',
  }
}

function getDefaultFilters() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)

  return {
    dataInicial: toInputDate(firstDay),
    dataFinal: toInputDate(now),
    etapa: '',
    produto: '',
    origem: '',
    temperatura: '',
  }
}

function toInputDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getTodayISODate() {
  return toInputDate(new Date())
}

function formatStage(stage) {
  return STAGE_OPTIONS.find((option) => option.value === stage)?.label ?? stage
}

function formatTemperature(temperature) {
  const labels = {
    frio: 'Frio',
    morno: 'Morno',
    quente: 'Quente',
    caveira: 'Caveira',
  }

  return labels[String(temperature || '').toLowerCase()] ?? temperature ?? 'Não informada'
}

export default Reports
