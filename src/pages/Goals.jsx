import { CalendarDays, Flag, Loader2, Save, Target, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getGoalByMonth, upsertGoal } from '../services/goalService'
import { formatPercent } from '../utils/formatters'

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

function Goals() {
  const { user } = useAuth()
  const [goals, setGoals] = useState(() => getEmptyGoals())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const periodKey = useMemo(() => `${goals.mes}-${goals.ano}`, [goals.mes, goals.ano])
  const calculatedRates = useMemo(() => getCalculatedRates(goals), [goals])

  useEffect(() => {
    let isMounted = true

    async function loadGoal() {
      if (!user?.id || !isValidPeriod(goals.mes, goals.ano)) {
        setIsLoading(false)
        setIsLocked(false)
        return
      }

      setIsLoading(true)
      setError('')
      setSuccess('')

      try {
        const data = await getGoalByMonth(user.id, goals.mes, goals.ano)

        if (!isMounted) {
          return
        }

        if (data) {
          setGoals((current) => ({
            ...current,
            meta_suspect: String(data.meta_suspect ?? 0),
            meta_prospect: String(data.meta_prospect ?? 0),
            meta_demo: String(data.meta_demo ?? 0),
            meta_negociacao: String(data.meta_negociacao ?? 0),
            meta_fechamento: String(data.meta_fechamento ?? 0),
          }))
          setIsLocked(true)
        } else {
          setGoals((current) => ({
            ...current,
            meta_suspect: '',
            meta_prospect: '',
            meta_demo: '',
            meta_negociacao: '',
            meta_fechamento: '',
          }))
          setIsLocked(false)
        }
      } catch (goalError) {
        if (isMounted) {
          setError(goalError.message || 'Não foi possível carregar as metas.')
          setIsLocked(false)
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

  function handleFieldKeyDown(event) {
    if (event.key !== 'Enter') {
      return
    }

    if (event.currentTarget.type === 'submit') {
      return
    }

    event.preventDefault()

    const fields = Array.from(
      event.currentTarget.form.querySelectorAll('input, select, button[type="submit"]'),
    ).filter((field) => !field.disabled)
    const currentIndex = fields.indexOf(event.currentTarget)
    fields[currentIndex + 1]?.focus()
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (isSaving || isLocked) {
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
      const savedGoal = await upsertGoal(user.id, goals.mes, goals.ano, goals)
      setGoals((current) => ({
        ...current,
        meta_suspect: String(savedGoal.meta_suspect ?? 0),
        meta_prospect: String(savedGoal.meta_prospect ?? 0),
        meta_demo: String(savedGoal.meta_demo ?? 0),
        meta_negociacao: String(savedGoal.meta_negociacao ?? 0),
        meta_fechamento: String(savedGoal.meta_fechamento ?? 0),
      }))
      setIsLocked(true)
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
              Metas mensais
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
              Plano de ataque
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-zinc-400">
              Defina os números que comandam o funil comercial do mês.
            </p>
          </div>
          <span className="flex h-14 w-14 items-center justify-center rounded-md border border-red-500/25 bg-red-950/25 text-red-300">
            <Target size={28} />
          </span>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-white/10 bg-zinc-900/70 p-4 shadow-xl shadow-black/20 backdrop-blur md:p-5"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
          <Field label="Meta Suspect" name="meta_suspect" type="number" value={goals.meta_suspect} onChange={updateField} onKeyDown={handleFieldKeyDown} icon={Flag} disabled={isLocked} />
          <Field label="Meta Prospect" name="meta_prospect" type="number" value={goals.meta_prospect} onChange={updateField} onKeyDown={handleFieldKeyDown} disabled={isLocked} />
          <Field label="Meta Demo" name="meta_demo" type="number" value={goals.meta_demo} onChange={updateField} onKeyDown={handleFieldKeyDown} disabled={isLocked} />
          <Field
            label="Meta Negociação"
            name="meta_negociacao"
            type="number"
            value={goals.meta_negociacao}
            onChange={updateField}
            onKeyDown={handleFieldKeyDown}
            disabled={isLocked}
          />
          <Field
            label="Meta Fechamento"
            name="meta_fechamento"
            type="number"
            value={goals.meta_fechamento}
            onChange={updateField}
            onKeyDown={handleFieldKeyDown}
            icon={TrendingUp}
            disabled={isLocked}
          />
        </div>

        {isLoading && (
          <div className="mt-5 flex items-center gap-2 rounded-md border border-white/10 bg-black/25 px-3 py-2 text-sm font-semibold text-zinc-400">
            <Loader2 size={16} className="animate-spin text-red-300" />
            Carregando metas do período...
          </div>
        )}

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

        {isLocked && !isLoading && (
          <div className="mt-5 rounded-md border border-white/10 bg-black/25 px-3 py-2 text-sm font-semibold text-zinc-400">
            Metas bloqueadas para evitar alterações acidentais.
          </div>
        )}

        <div className="mt-6 grid gap-3 rounded-lg border border-white/10 bg-black/25 p-4 sm:grid-cols-3">
          {calculatedRates.map((card) => (
            <GoalPreview key={card.label} {...card} />
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-zinc-500">
            Salvar cria ou atualiza as metas reais do período selecionado.
          </p>
          {isLocked ? (
            <button
              type="button"
              onClick={() => {
                setIsLocked(false)
                setSuccess('')
                setError('')
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-red-500/30 bg-red-950/20 px-5 text-sm font-black text-red-200 transition hover:border-red-400/50 hover:text-white"
            >
              Editar metas
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSaving || isLoading}
              onKeyDown={handleFieldKeyDown}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-red-600 px-5 text-sm font-black text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isSaving ? 'Salvando...' : 'Salvar metas'}
            </button>
          )}
        </div>
      </form>
    </section>
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
  disabled = false,
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </span>
      <span className={getFieldWrapperClassName(disabled)}>
        {Icon && <Icon size={16} className="shrink-0 text-zinc-500" />}
        <input
          name={name}
          type={type}
          min={min}
          max={max}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          disabled={disabled}
          className="w-full min-w-0 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-zinc-600 disabled:cursor-not-allowed disabled:text-zinc-500"
        />
      </span>
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
      label: 'Taxa Demo',
      value: calculateRate(goals.meta_demo, goals.meta_prospect),
      helper: 'Demo / Prospect',
    },
    {
      label: 'Taxa Negociação',
      value: calculateRate(goals.meta_negociacao, goals.meta_demo),
      helper: 'Negociação / Demo',
    },
    {
      label: 'Fechamento alvo',
      value: calculateRate(goals.meta_fechamento, goals.meta_negociacao),
      helper: 'Fechamento / Negociação',
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
