import {
  BadgeDollarSign,
  Calculator,
  CalendarDays,
  Flag,
  Loader2,
  Percent,
  Save,
  Target,
  TrendingUp,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getGoalByMonth, upsertGoal } from '../services/goalService'
import { getBusinessDaysForMonth } from '../utils/businessDays'
import { formatCurrencyBRLWithCents, formatPercent } from '../utils/formatters'

const MONTHS = [
  { label: 'JANEIRO', value: '1' },
  { label: 'FEVEREIRO', value: '2' },
  { label: 'MARÇO', value: '3' },
  { label: 'ABRIL', value: '4' },
  { label: 'MAIO', value: '5' },
  { label: 'JUNHO', value: '6' },
  { label: 'JULHO', value: '7' },
  { label: 'AGOSTO', value: '8' },
  { label: 'SETEMBRO', value: '9' },
  { label: 'OUTUBRO', value: '10' },
  { label: 'NOVEMBRO', value: '11' },
  { label: 'DEZEMBRO', value: '12' },
]

const STANDARD_FINANCIAL_GOAL = 6083.33
const STANDARD_FINANCIAL_GOAL_INPUT = '6.083,33'
const STANDARD_FINANCIAL_GOAL_UNTIL = '12/2026'

const defaultRates = {
  taxa_suspect_prospect: '30',
  taxa_prospect_demo: '50',
  taxa_demo_negociacao: '50',
  taxa_negociacao_fechamento: '60',
}

function getCurrentPeriod() {
  const now = new Date()

  return {
    mes: String(now.getMonth() + 1),
    ano: String(now.getFullYear()),
  }
}

function getEmptyGoals(period = getCurrentPeriod()) {
  return {
    mes: period.mes,
    ano: period.ano,
    meta_suspect: '',
    meta_prospect: '',
    meta_demo: '',
    meta_negociacao: '',
    meta_fechamento: '',
  }
}

function getDefaultAttackPlan(days = 20) {
  return {
    meta_financeira: STANDARD_FINANCIAL_GOAL_INPUT,
    resultado_referencia: '0',
    fechamentos_referencia: '0',
    dias_uteis: String(days),
    ...defaultRates,
  }
}

function Goals() {
  const { user } = useAuth()
  const [goals, setGoals] = useState(() => getEmptyGoals())
  const [attackPlan, setAttackPlan] = useState(() => getDefaultAttackPlan())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [businessDaysWarning, setBusinessDaysWarning] = useState('')
  const periodKey = useMemo(() => `${goals.mes}-${goals.ano}`, [goals.mes, goals.ano])
  const plannedPeriod = useMemo(
    () => getPeriodLabel(goals.mes, goals.ano),
    [goals.mes, goals.ano],
  )
  const referencePeriod = useMemo(
    () => getReferencePeriodLabel(goals.mes, goals.ano),
    [goals.mes, goals.ano],
  )
  const ticketReference = useMemo(() => calculateTicketReference(attackPlan), [attackPlan])
  const referencePerformance = useMemo(
    () => getReferencePerformance(attackPlan),
    [attackPlan],
  )
  const calculatedRates = useMemo(() => getCalculatedRates(goals), [goals])
  const attackResults = useMemo(
    () => calculateAttackPlan(attackPlan, ticketReference),
    [attackPlan, ticketReference],
  )
  const isEditMode = !isLocked || isEditing

  useEffect(() => {
    let isMounted = true

    async function loadGoal() {
      if (!user?.id || !isValidPeriod(goals.mes, goals.ano)) {
        setIsLoading(false)
        setIsLocked(false)
        setIsEditing(false)
        return
      }

      setIsLoading(true)
      setError('')
      setSuccess('')
      setBusinessDaysWarning('')

      try {
        const [goalData, businessDaysData] = await Promise.all([
          getGoalByMonth(user.id, goals.mes, goals.ano),
          getBusinessDaysForMonth(Number(goals.ano), Number(goals.mes)),
        ])

        if (!isMounted) {
          return
        }

        setBusinessDaysWarning(businessDaysData.warning)

        if (goalData) {
          setGoals((current) => ({
            ...current,
            meta_suspect: String(goalData.meta_suspect ?? 0),
            meta_prospect: String(goalData.meta_prospect ?? 0),
            meta_demo: String(goalData.meta_demo ?? 0),
            meta_negociacao: String(goalData.meta_negociacao ?? 0),
            meta_fechamento: String(goalData.meta_fechamento ?? 0),
          }))
          setAttackPlan(getAttackPlanFromGoal(goalData, businessDaysData.days))
          setIsLocked(true)
          setIsEditing(false)
        } else {
          setGoals((current) => ({
            ...current,
            meta_suspect: '',
            meta_prospect: '',
            meta_demo: '',
            meta_negociacao: '',
            meta_fechamento: '',
          }))
          setAttackPlan(getDefaultAttackPlan(businessDaysData.days))
          setIsLocked(false)
          setIsEditing(false)
        }
      } catch (goalError) {
        if (isMounted) {
          setError(goalError.message || 'Não foi possível carregar as metas.')
          setIsLocked(false)
          setIsEditing(false)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadGoal()

    return () => {
      isMounted = false
    }
  }, [periodKey, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function updateField(event) {
    const { name, value } = event.target
    setGoals((current) => ({ ...current, [name]: value }))
    setError('')
    setSuccess('')
  }

  function updateAttackField(event) {
    if (!isEditMode) {
      return
    }

    const { name, value } = event.target
    setAttackPlan((current) => ({ ...current, [name]: value }))
    setError('')
    setSuccess('')
  }

  function enableEditMode() {
    setIsEditing(true)
    setSuccess('')
    setError('')
  }

  function cancelEditMode() {
    setIsEditing(false)
    setSuccess('')
    setError('')
  }

  function applyCalculatedGoals() {
    if (!isEditMode) {
      setError('As metas estão bloqueadas. Clique em Editar metas para aplicar o Plano de Ataque.')
      setSuccess('')
      return
    }

    if (!attackResults.isReady) {
      setError('Informe meta financeira, referências, dias úteis e taxas válidas antes de aplicar.')
      setSuccess('')
      return
    }

    setGoals((current) => ({
      ...current,
      meta_suspect: String(attackResults.suspects),
      meta_prospect: String(attackResults.prospects),
      meta_demo: String(attackResults.demos),
      meta_negociacao: String(attackResults.negociacoes),
      meta_fechamento: String(attackResults.fechamentos),
    }))
    setError('')
    setSuccess('Metas calculadas aplicadas. Revise e clique em "Salvar metas".')
  }

  function handleFieldKeyDown(event) {
    if (event.key !== 'Enter') {
      return
    }

    if (event.currentTarget.type === 'submit') {
      return
    }

    event.preventDefault()

    const container = event.currentTarget.form ?? event.currentTarget.closest('article')
    const fields = Array.from(
      container?.querySelectorAll('input, select, button[type="submit"]') ?? [],
    ).filter((field) => !field.disabled)
    const currentIndex = fields.indexOf(event.currentTarget)
    fields[currentIndex + 1]?.focus()
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (isSaving || !isEditMode) {
      return
    }

    const validationError = validateGoals(goals)

    if (validationError) {
      setError(validationError)
      setSuccess('')
      return
    }

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const savedGoal = await upsertGoal(user.id, goals.mes, goals.ano, {
        ...goals,
        ...attackPlan,
        ticket_medio_referencia: ticketReference,
      })
      setGoals((current) => ({
        ...current,
        meta_suspect: String(savedGoal.meta_suspect ?? 0),
        meta_prospect: String(savedGoal.meta_prospect ?? 0),
        meta_demo: String(savedGoal.meta_demo ?? 0),
        meta_negociacao: String(savedGoal.meta_negociacao ?? 0),
        meta_fechamento: String(savedGoal.meta_fechamento ?? 0),
      }))
      setAttackPlan(getAttackPlanFromGoal(savedGoal, attackPlan.dias_uteis))
      setIsLocked(true)
      setIsEditing(false)
      setSuccess('Metas mensais salvas com sucesso.')
    } catch (goalError) {
      setError(goalError.message || 'Não foi possível salvar as metas.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="space-y-5">
      <header className="rounded-lg border border-white/10 bg-zinc-900/70 p-5 shadow-xl shadow-black/20 backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-red-300">
              Planejamento comercial
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
              Metas e Plano de Ataque
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-zinc-400">
              Planeje o mês, calcule sua missão comercial e transforme meta em execução diária.
            </p>
          </div>
          <span className="flex h-14 w-14 items-center justify-center rounded-md border border-red-500/25 bg-red-950/25 text-red-300">
            <Target size={28} />
          </span>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <MonthVisionCard label="Mês planejado" value={plannedPeriod} helper="Mês de execução" />
        <MonthVisionCard label="Referência" value={referencePeriod} helper="Base do ticket médio" />
        <BusinessDaysContextCard
          value={attackPlan.dias_uteis}
          onChange={updateAttackField}
          disabled={!isEditMode}
        />
      </section>

      <article className="overflow-hidden rounded-lg border border-red-500/20 bg-zinc-900/70 shadow-xl shadow-black/20 backdrop-blur">
        <div className="border-b border-white/10 bg-black/20 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">
                Plano de Ataque de {plannedPeriod}
              </h2>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-zinc-400">
                Use os resultados de {referencePeriod} para calcular a missão comercial de {plannedPeriod}.
              </p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-md border border-red-500/25 bg-red-950/25 text-red-300">
              <Calculator size={24} />
            </span>
          </div>
        </div>

        <div className="grid gap-5 p-4 xl:p-5">
          <AttackBlock
            title="Referência financeira"
            description="Informe resultado e fechamentos do mês anterior para gerar ticket médio e desempenho."
            icon={BadgeDollarSign}
          >
            <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-[1.05fr_1fr_0.75fr_1fr]">
              <Field
                label="Resultado"
                name="resultado_referencia"
                type="text"
                inputMode="decimal"
                value={attackPlan.resultado_referencia}
                onChange={updateAttackField}
                onKeyDown={handleFieldKeyDown}
                disabled={!isEditMode}
              />
              <ReferencePerformance performance={referencePerformance} />
              <Field
                label="Fechamentos"
                name="fechamentos_referencia"
                type="number"
                value={attackPlan.fechamentos_referencia}
                onChange={updateAttackField}
                onKeyDown={handleFieldKeyDown}
                disabled={!isEditMode}
              />
              <Field
                label="Ticket médio"
                name="ticket_medio_referencia"
                type="text"
                value={formatCurrencyBRLWithCents(ticketReference)}
                onChange={() => {}}
                onKeyDown={handleFieldKeyDown}
                disabled
              />
            </div>

            {businessDaysWarning && (
              <div className="mt-4 rounded-md border border-amber-500/25 bg-amber-950/15 px-3 py-2 text-sm font-semibold text-amber-100">
                {businessDaysWarning}
              </div>
            )}
          </AttackBlock>

          <AttackBlock
            title="Taxas do funil"
            description="Ajuste as conversões esperadas entre cada etapa."
            icon={Percent}
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field
                label="Suspect → Prospect (%)"
                name="taxa_suspect_prospect"
                type="number"
                max="100"
                value={attackPlan.taxa_suspect_prospect}
                onChange={updateAttackField}
                onKeyDown={handleFieldKeyDown}
                disabled={!isEditMode}
              />
              <Field
                label="Prospect → Demo (%)"
                name="taxa_prospect_demo"
                type="number"
                max="100"
                value={attackPlan.taxa_prospect_demo}
                onChange={updateAttackField}
                onKeyDown={handleFieldKeyDown}
                disabled={!isEditMode}
              />
              <Field
                label="Demo → Negociação (%)"
                name="taxa_demo_negociacao"
                type="number"
                max="100"
                value={attackPlan.taxa_demo_negociacao}
                onChange={updateAttackField}
                onKeyDown={handleFieldKeyDown}
                disabled={!isEditMode}
              />
              <Field
                label="Negociação → Fechamento (%)"
                name="taxa_negociacao_fechamento"
                type="number"
                max="100"
                value={attackPlan.taxa_negociacao_fechamento}
                onChange={updateAttackField}
                onKeyDown={handleFieldKeyDown}
                disabled={!isEditMode}
              />
            </div>
          </AttackBlock>

          <section className="rounded-lg border border-white/10 bg-black/20 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h3 className="text-lg font-black text-white">
                  Missão comercial do mês
                </h3>
                <p className="mt-1 text-sm font-medium text-zinc-500">
                  Volume necessário para atingir a meta com base nas referências e taxas informadas.
                </p>
              </div>
              <button
                type="button"
                onClick={applyCalculatedGoals}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-red-500/30 bg-red-950/20 px-5 text-sm font-black text-red-200 transition hover:border-red-400/50 hover:text-white"
              >
                <Calculator size={18} />
                Aplicar metas calculadas
              </button>
            </div>

            {!attackResults.isReady && (
              <div className="mt-4 rounded-md border border-amber-500/25 bg-amber-950/15 px-3 py-2 text-sm font-semibold text-amber-100">
                Informe meta financeira, referências, dias úteis e taxas válidas para calcular o plano completo.
              </div>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <AttackResultCard label="Suspects" value={attackResults.suspects} />
              <AttackResultCard label="Prospects" value={attackResults.prospects} />
              <AttackResultCard label="Demos" value={attackResults.demos} />
              <AttackResultCard label="Negociações" value={attackResults.negociacoes} />
              <AttackResultCard label="Fechamentos" value={attackResults.fechamentos} />
              <AttackResultCard
                label="Suspects p/dia útil"
                value={attackResults.suspectsPorDia}
                accent
              />
            </div>

            <p className="mt-4 text-sm font-medium text-zinc-500">
              {!isEditMode
                ? 'Metas bloqueadas. Clique em Editar metas para ajustar o Plano de Ataque.'
                : 'Aplicar preenche as metas mensais abaixo; o salvamento continua manual.'}
            </p>
          </section>
        </div>
      </article>

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-white/10 bg-zinc-900/70 p-4 shadow-xl shadow-black/20 backdrop-blur md:p-5"
      >
        <div className="flex flex-col gap-3 border-b border-white/10 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-black text-white">Metas mensais</h2>
            <p className="mt-1 text-sm font-medium text-zinc-500">
              Valores finais que serão usados no Dashboard do mês.
            </p>
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/25 px-3 py-2 text-sm font-semibold text-zinc-400">
              <Loader2 size={16} className="animate-spin text-red-300" />
              Carregando metas...
            </div>
          )}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-7">
          <SelectField
            label="Mês"
            name="mes"
            value={goals.mes}
            onChange={updateField}
            onKeyDown={handleFieldKeyDown}
            options={MONTHS}
            icon={CalendarDays}
          />
          <Field
            label="Ano"
            name="ano"
            type="number"
            min="2000"
            value={goals.ano}
            onChange={updateField}
            onKeyDown={handleFieldKeyDown}
          />
          <Field
            label="Meta Suspect"
            name="meta_suspect"
            type="number"
            value={goals.meta_suspect}
            onChange={updateField}
            onKeyDown={handleFieldKeyDown}
            icon={Flag}
            disabled={!isEditMode}
          />
          <Field
            label="Meta Prospect"
            name="meta_prospect"
            type="number"
            value={goals.meta_prospect}
            onChange={updateField}
            onKeyDown={handleFieldKeyDown}
            disabled={!isEditMode}
          />
          <Field
            label="Meta Demo"
            name="meta_demo"
            type="number"
            value={goals.meta_demo}
            onChange={updateField}
            onKeyDown={handleFieldKeyDown}
            disabled={!isEditMode}
          />
          <Field
            label="Meta Negociação"
            name="meta_negociacao"
            type="number"
            value={goals.meta_negociacao}
            onChange={updateField}
            onKeyDown={handleFieldKeyDown}
            disabled={!isEditMode}
          />
          <Field
            label="Meta Fechamento"
            name="meta_fechamento"
            type="number"
            value={goals.meta_fechamento}
            onChange={updateField}
            onKeyDown={handleFieldKeyDown}
            icon={TrendingUp}
            disabled={!isEditMode}
          />
        </div>

        {error && (
          <div className="mt-5 rounded-md border border-red-500/25 bg-red-950/25 px-3 py-2 text-sm font-semibold text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-5 rounded-md border border-emerald-500/25 bg-emerald-950/20 px-3 py-2 text-sm font-semibold text-emerald-200">
            {success}
          </div>
        )}

        {!isEditMode && !isLoading && (
          <div className="mt-5 rounded-md border border-white/10 bg-black/25 px-3 py-2 text-sm font-semibold text-zinc-400">
            Metas bloqueadas. Clique em Editar metas para ajustar o Plano de Ataque.
          </div>
        )}

        {isEditMode && !isLoading && (
          <div className="mt-5 rounded-md border border-emerald-500/25 bg-emerald-950/20 px-3 py-2 text-sm font-semibold text-emerald-200">
            Modo edição ativo. Ajuste o Plano de Ataque e salve as metas.
          </div>
        )}

        <section className="mt-6 rounded-lg border border-white/10 bg-black/25 p-4">
          <div className="mb-4">
            <h3 className="text-base font-black text-white">Conversões das metas</h3>
            <p className="mt-1 text-sm font-medium text-zinc-500">
              Leitura rápida das conversões calculadas a partir das metas mensais.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {calculatedRates.map((card) => (
              <GoalPreview key={card.label} {...card} />
            ))}
          </div>
        </section>

        <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-zinc-500">
            Salvar cria ou atualiza as metas reais do período selecionado.
          </p>
          {!isEditMode ? (
            <button
              type="button"
              onClick={enableEditMode}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-red-500/30 bg-red-950/20 px-5 text-sm font-black text-red-200 transition hover:border-red-400/50 hover:text-white"
            >
              Editar metas
            </button>
          ) : (
            <div className="flex flex-wrap gap-2">
              {isLocked && (
                <button
                  type="button"
                  onClick={cancelEditMode}
                  disabled={isSaving || isLoading}
                  className="inline-flex h-11 items-center justify-center rounded-md border border-white/10 px-5 text-sm font-black text-zinc-300 transition hover:border-red-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Cancelar edição
                </button>
              )}
              <button
                type="submit"
                disabled={isSaving || isLoading}
                onKeyDown={handleFieldKeyDown}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-red-600 px-5 text-sm font-black text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {isSaving ? 'Salvando...' : 'Salvar metas'}
              </button>
            </div>
          )}
        </div>
      </form>
    </section>
  )
}

function MonthVisionCard({ label, value, helper, accent = false }) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 ${
        accent
          ? 'border-red-500/25 bg-red-950/20'
          : 'border-white/10 bg-zinc-900/70'
      }`}
    >
      <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </p>
      <p className={`mt-2 text-lg font-black ${accent ? 'text-red-100' : 'text-white'}`}>
        {value}
      </p>
      <p className="mt-1 text-xs font-semibold text-zinc-600">{helper}</p>
    </div>
  )
}

function BusinessDaysContextCard({ value, onChange, disabled }) {
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-900/70 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
        Dias úteis
      </p>
      {disabled ? (
        <p className="mt-2 text-lg font-black text-white">{value || '0'}</p>
      ) : (
        <span className="mt-2 flex h-9 max-w-24 items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 transition focus-within:border-red-500">
          <CalendarDays size={15} className="shrink-0 text-zinc-500" />
          <input
            name="dias_uteis"
            type="number"
            min="0"
            value={value}
            onChange={onChange}
            className="w-full min-w-0 bg-transparent text-sm font-black text-white outline-none disabled:cursor-not-allowed disabled:text-zinc-500"
          />
        </span>
      )}
      <p className="mt-1 text-xs font-semibold text-zinc-600">
        Calculado para o mês planejado
      </p>
    </div>
  )
}

function AttackBlock({ title, description, icon: Icon, children }) {
  return (
    <section className="rounded-lg border border-white/10 bg-black/20 p-4">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-red-500/25 bg-red-950/25 text-red-300">
          <Icon size={20} />
        </span>
        <div>
          <h3 className="text-base font-black text-white">{title}</h3>
          <p className="mt-1 text-sm font-medium leading-6 text-zinc-500">
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  )
}

function ReferencePerformance({ performance }) {
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
        Desempenho
      </p>
      <p
        className={`flex h-11 items-center rounded-md border border-white/10 bg-black/30 px-3 text-sm font-black ${performance.className}`}
      >
        {performance.text}
      </p>
    </div>
  )
}

function Field({
  label,
  name,
  value,
  onChange,
  onKeyDown,
  type = 'text',
  icon: Icon,
  min = type === 'number' ? '0' : undefined,
  max,
  inputMode,
  disabled = false,
  helper = '',
}) {
  return (
    <label className="space-y-2">
      <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </span>
      <span className={getFieldWrapperClassName(disabled)}>
        {Icon && <Icon size={16} className="shrink-0 text-zinc-500" />}
        <input
          name={name}
          type={type}
          min={min}
          max={max}
          inputMode={inputMode}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          disabled={disabled}
          className="w-full min-w-0 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-zinc-600 disabled:cursor-not-allowed disabled:text-zinc-500"
        />
      </span>
      {helper && <p className="text-xs font-medium leading-5 text-zinc-600">{helper}</p>}
    </label>
  )
}

function SelectField({
  label,
  name,
  value,
  onChange,
  onKeyDown,
  options,
  icon: Icon,
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </span>
      <span className="flex h-11 items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 transition focus-within:border-red-500">
        {Icon && <Icon size={16} className="shrink-0 text-zinc-500" />}
        <select
          name={name}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          className="w-full min-w-0 bg-transparent text-sm font-semibold text-white outline-none"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-zinc-950">
              {option.label}
            </option>
          ))}
        </select>
      </span>
    </label>
  )
}

function GoalPreview({ label, value, helper }) {
  return (
    <div className="rounded-md border border-white/10 bg-zinc-900/70 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-white">
        {formatPercent(value)}
      </p>
      <p className="mt-1 text-xs font-semibold text-zinc-600">{helper}</p>
    </div>
  )
}

function AttackResultCard({ label, value, accent = false }) {
  return (
    <div
      className={`rounded-md border px-4 py-3 ${
        accent
          ? 'border-red-500/25 bg-red-950/20'
          : 'border-white/10 bg-black/25'
      }`}
    >
      <p className="whitespace-nowrap text-[11px] font-black uppercase tracking-[0.08em] text-zinc-500">
        {label}
      </p>
      <p className={`mt-2 text-3xl font-black ${accent ? 'text-red-200' : 'text-white'}`}>
        {value}
      </p>
    </div>
  )
}

function getAttackPlanFromGoal(goal, fallbackDays) {
  return {
    meta_financeira: formatNumberForInput(goal.meta_financeira ?? STANDARD_FINANCIAL_GOAL),
    resultado_referencia: formatNumberForInput(goal.resultado_referencia ?? 0),
    fechamentos_referencia: String(goal.fechamentos_referencia ?? 0),
    dias_uteis: String(goal.dias_uteis ?? fallbackDays),
    taxa_suspect_prospect: String(goal.taxa_suspect_prospect ?? defaultRates.taxa_suspect_prospect),
    taxa_prospect_demo: String(goal.taxa_prospect_demo ?? defaultRates.taxa_prospect_demo),
    taxa_demo_negociacao: String(goal.taxa_demo_negociacao ?? defaultRates.taxa_demo_negociacao),
    taxa_negociacao_fechamento: String(
      goal.taxa_negociacao_fechamento ?? defaultRates.taxa_negociacao_fechamento,
    ),
  }
}

function validateGoals(goals) {
  const mes = Number(goals.mes)
  const ano = Number(goals.ano)
  const goalFields = [
    'meta_suspect',
    'meta_prospect',
    'meta_demo',
    'meta_negociacao',
    'meta_fechamento',
  ]

  if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
    return 'Informe um mês válido entre 1 e 12.'
  }

  if (!Number.isInteger(ano) || ano <= 0) {
    return 'Informe um ano válido.'
  }

  if (goalFields.some((field) => Number(goals[field] || 0) < 0)) {
    return 'As metas não podem ser negativas.'
  }

  return ''
}

function calculateTicketReference(plan) {
  const result = parsePositiveNumber(plan.resultado_referencia)
  const closings = parsePositiveNumber(plan.fechamentos_referencia)

  if (closings === 0) {
    return 0
  }

  return Number((result / closings).toFixed(2))
}

function calculateAttackPlan(plan, ticketReference) {
  const financialGoal = parsePositiveNumber(plan.meta_financeira)
  const averageTicket = parsePositiveNumber(ticketReference)
  const businessDays = parsePositiveNumber(plan.dias_uteis)
  const suspectToProspect = parsePercent(plan.taxa_suspect_prospect)
  const prospectToDemo = parsePercent(plan.taxa_prospect_demo)
  const demoToNegotiation = parsePercent(plan.taxa_demo_negociacao)
  const negotiationToClose = parsePercent(plan.taxa_negociacao_fechamento)
  const isReady =
    financialGoal > 0 &&
    averageTicket > 0 &&
    businessDays > 0 &&
    suspectToProspect > 0 &&
    prospectToDemo > 0 &&
    demoToNegotiation > 0 &&
    negotiationToClose > 0

  if (!isReady) {
    return {
      isReady: false,
      fechamentos: 0,
      negociacoes: 0,
      demos: 0,
      prospects: 0,
      suspects: 0,
      suspectsPorDia: 0,
    }
  }

  const rawClosings = financialGoal / averageTicket
  const rawNegotiations = rawClosings / negotiationToClose
  const rawDemos = rawNegotiations / demoToNegotiation
  const rawProspects = rawDemos / prospectToDemo
  const rawSuspects = rawProspects / suspectToProspect

  return {
    isReady: true,
    fechamentos: Math.ceil(rawClosings),
    negociacoes: Math.ceil(rawNegotiations),
    demos: Math.ceil(rawDemos),
    prospects: Math.ceil(rawProspects),
    suspects: Math.ceil(rawSuspects),
    suspectsPorDia: Math.ceil(rawSuspects / businessDays),
  }
}

function getReferencePerformance(plan) {
  const financialGoal = parsePositiveNumber(plan.meta_financeira)
  const referenceResult = parsePositiveNumber(plan.resultado_referencia)

  if (financialGoal <= 0) {
    return {
      text: 'Informe a meta financeira',
      className: 'text-zinc-500',
    }
  }

  const delta = ((referenceResult - financialGoal) / financialGoal) * 100

  if (Math.abs(delta) < 0.005) {
    return {
      text: 'Meta atingida',
      className: 'text-zinc-400',
    }
  }

  const formattedDelta = Math.abs(delta).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  if (delta > 0) {
    return {
      text: `▲ ${formattedDelta}% acima da meta`,
      className: 'text-emerald-300',
    }
  }

  return {
    text: `▼ ${formattedDelta}% abaixo da meta`,
    className: 'text-red-300',
  }
}

function parsePositiveNumber(value) {
  const number = parseLocalizedNumber(value)

  return Number.isFinite(number) && number > 0 ? number : 0
}

function parsePercent(value) {
  const number = parsePositiveNumber(value)

  return number > 0 ? number / 100 : 0
}

function parseLocalizedNumber(value) {
  if (typeof value === 'number') {
    return value
  }

  const cleanValue = String(value ?? '')
    .trim()
    .replace(/[^\d,.-]/g, '')
  const normalizedValue = cleanValue.includes(',')
    ? cleanValue.replace(/\./g, '').replace(',', '.')
    : cleanValue

  return Number(normalizedValue)
}

function formatNumberForInput(value) {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return '0'
  }

  return String(number).replace('.', ',')
}

function getPeriodLabel(month, year) {
  const monthLabel = MONTHS.find((item) => item.value === String(month))?.label ?? month

  return `${monthLabel}/${year}`
}

function getReferencePeriodLabel(month, year) {
  const date = new Date(Number(year), Number(month) - 2, 1)
  const referenceMonth = String(date.getMonth() + 1)
  const referenceYear = String(date.getFullYear())

  return getPeriodLabel(referenceMonth, referenceYear)
}

function isValidPeriod(mes, ano) {
  const numericMonth = Number(mes)
  const numericYear = Number(ano)

  return (
    Number.isInteger(numericMonth) &&
    numericMonth >= 1 &&
    numericMonth <= 12 &&
    Number.isInteger(numericYear) &&
    numericYear > 0
  )
}

function getCalculatedRates(goals) {
  return [
    {
      label: 'Conversão para Demo',
      value: calculateRate(goals.meta_demo, goals.meta_prospect),
      helper: 'Demo ÷ Prospect',
    },
    {
      label: 'Conversão para Negociação',
      value: calculateRate(goals.meta_negociacao, goals.meta_demo),
      helper: 'Negociação ÷ Demo',
    },
    {
      label: 'Conversão para Fechamento',
      value: calculateRate(goals.meta_fechamento, goals.meta_negociacao),
      helper: 'Fechamento ÷ Negociação',
    },
  ]
}

function calculateRate(numerator, denominator) {
  const top = Number(numerator || 0)
  const bottom = Number(denominator || 0)

  if (!Number.isFinite(top) || !Number.isFinite(bottom) || bottom === 0) {
    return 0
  }

  return Math.round((top / bottom) * 100)
}

function getFieldWrapperClassName(disabled) {
  return `flex h-11 items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 transition focus-within:border-red-500 ${
    disabled ? 'opacity-70' : ''
  }`
}

export default Goals
