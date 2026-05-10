import {
  BadgeDollarSign,
  ChevronLeft,
  ChevronRight,
  Loader2,
  LogOut,
  Pencil,
  RadioTower,
  Save,
  ShieldCheck,
  Trash2,
  X,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import logo from '../assets/ecaveira-logo.png'
import { deleteAnnualGoal, getAnnualGoal, upsertAnnualGoal } from '../services/goalService'
import { formatCurrencyBRLWithCents } from '../utils/formatters'

function Sidebar({ currentPage, navItems, onNavigate, onSignOut, user }) {
  const currentYear = useMemo(() => new Date().getFullYear(), [])
  const [annualGoal, setAnnualGoal] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalYear, setModalYear] = useState(currentYear)
  const [modalGoal, setModalGoal] = useState(null)
  const [form, setForm] = useState(() => getEmptyAnnualGoalForm(currentYear))
  const [isEditing, setIsEditing] = useState(false)
  const [isLoadingGoal, setIsLoadingGoal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [modalError, setModalError] = useState('')
  const [modalSuccess, setModalSuccess] = useState('')

  const loadCurrentAnnualGoal = useCallback(async () => {
    if (!user?.id) {
      setAnnualGoal(null)
      return
    }

    try {
      const data = await getAnnualGoal(user.id, currentYear)
      setAnnualGoal(data)
    } catch {
      setAnnualGoal(null)
    }
  }, [currentYear, user?.id])

  useEffect(() => {
    loadCurrentAnnualGoal()
  }, [loadCurrentAnnualGoal])

  const annualGoalValue = Number(annualGoal?.meta_financeira_padrao || 0)
  const hasAnnualGoal = Number.isFinite(annualGoalValue) && annualGoalValue > 0

  async function loadModalAnnualGoal(year) {
    if (!user?.id) {
      return
    }

    setIsLoadingGoal(true)
    setModalError('')
    setModalSuccess('')
    setModalYear(Number(year))

    try {
      const data = await getAnnualGoal(user.id, year)
      setModalGoal(data)
      setForm(getAnnualGoalForm(data, year))
      setIsEditing(!data)
    } catch (error) {
      setModalGoal(null)
      setForm(getEmptyAnnualGoalForm(year))
      setIsEditing(true)
      setModalError(error.message || 'Não foi possível carregar a meta anual.')
    } finally {
      setIsLoadingGoal(false)
    }
  }

  function openAnnualGoalModal() {
    setIsModalOpen(true)
    loadModalAnnualGoal(currentYear)
  }

  function closeAnnualGoalModal() {
    setIsModalOpen(false)
    setModalError('')
    setModalSuccess('')
  }

  function updateFormField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setModalError('')
    setModalSuccess('')
  }

  function cancelEditing() {
    if (modalGoal) {
      setForm(getAnnualGoalForm(modalGoal, modalYear))
      setIsEditing(false)
    } else {
      closeAnnualGoalModal()
    }
    setModalError('')
    setModalSuccess('')
  }

  async function navigateAnnualGoalYear(delta) {
    await loadModalAnnualGoal(Number(modalYear) + delta)
  }

  async function saveAnnualGoal(event) {
    event.preventDefault()

    if (!user?.id || isSaving) {
      return
    }

    const validationError = validateAnnualGoalForm(form)

    if (validationError) {
      setModalError(validationError)
      setModalSuccess('')
      return
    }

    setIsSaving(true)
    setModalError('')
    setModalSuccess('')

    try {
      const savedGoal = await upsertAnnualGoal(user.id, form)
      setModalGoal(savedGoal)
      setModalYear(Number(savedGoal.ano))
      setForm(getAnnualGoalForm(savedGoal, savedGoal.ano))
      setIsEditing(false)
      setModalSuccess('Meta anual salva com sucesso.')

      if (Number(savedGoal.ano) === currentYear) {
        setAnnualGoal(savedGoal)
      }

      notifyAnnualGoalChanged(savedGoal.ano)
    } catch (error) {
      setModalError(error.message || 'Não foi possível salvar a meta anual.')
    } finally {
      setIsSaving(false)
    }
  }

  async function removeAnnualGoal() {
    if (!user?.id || isSaving) {
      return
    }

    const confirmed = window.confirm('Deseja excluir a meta anual deste ano?')

    if (!confirmed) {
      return
    }

    setIsSaving(true)
    setModalError('')
    setModalSuccess('')

    try {
      await deleteAnnualGoal(user.id, modalYear)
      setModalGoal(null)
      setForm(getEmptyAnnualGoalForm(modalYear))
      setIsEditing(true)
      setModalSuccess('Meta anual excluída.')

      if (Number(modalYear) === currentYear) {
        setAnnualGoal(null)
      }

      notifyAnnualGoalChanged(modalYear)
    } catch (error) {
      setModalError(error.message || 'Não foi possível excluir a meta anual.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/10 bg-zinc-950/85 px-4 py-5 shadow-2xl shadow-black/50 backdrop-blur-xl lg:block">
        <div className="flex h-full flex-col">
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="group flex w-full items-center gap-3 rounded-lg border border-red-500/20 bg-red-950/20 p-3 text-left shadow-[0_0_35px_rgba(127,29,29,0.12)] transition hover:border-red-500/45 hover:bg-red-950/30"
        >
          <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-red-500/25 bg-black/35 shadow-[0_0_26px_rgba(220,38,38,0.26)]">
            <span className="absolute inset-1 rounded-md bg-red-600/20 blur-md motion-safe:animate-pulse" />
            <img
              src={logo}
              alt="eCaveira WarGame"
              className="relative h-12 w-12 object-contain drop-shadow-[0_0_12px_rgba(248,113,113,0.45)] transition duration-300 ease-out group-hover:scale-105"
            />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-black uppercase tracking-wide text-white">
              eCaveira WarGame
            </span>
            <span className="mt-0.5 block truncate text-xs font-semibold text-red-200/80">
              Cockpit comercial pessoal
            </span>
          </span>
        </button>

        <div className="mt-6 rounded-lg border border-white/10 bg-zinc-900/45 p-3">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
            <span>Status</span>
            <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_14px_rgba(239,68,68,0.85)]" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Signal label="Foco" value="87%" />
            <Signal label="Ritmo" value="Alto" />
          </div>
        </div>

        <button
          type="button"
          onClick={openAnnualGoalModal}
          className="mt-3 w-full rounded-lg border border-red-500/20 bg-red-950/10 p-3 text-left shadow-[0_0_24px_rgba(127,29,29,0.10)] transition hover:border-red-500/40 hover:bg-red-950/20"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-red-500/25 bg-black/25 text-red-300">
              <BadgeDollarSign size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-red-300/80">
                META {currentYear}
              </p>
              {hasAnnualGoal ? (
                <>
                  <p className="mt-0.5 text-lg font-black leading-none text-white">
                    {formatCurrencyBRLWithCents(annualGoalValue)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-zinc-500">
                    Até {formatAnnualGoalValidity(annualGoal?.vigente_ate)}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-xs font-semibold leading-5 text-zinc-500">
                  Não configurada
                </p>
              )}
            </div>
            <Pencil size={15} className="ml-auto text-zinc-600" />
          </div>
        </button>

        <nav className="mt-6 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-extrabold transition ${
                  isActive
                    ? 'border border-red-500/30 bg-red-600 text-white shadow-lg shadow-red-950/35'
                    : 'border border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/[0.045] hover:text-zinc-100'
                }`}
              >
                <Icon size={18} strokeWidth={2.4} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-4">
            <p className="truncate text-xs font-black uppercase tracking-[0.16em] text-zinc-600">
              Operador
            </p>
            <p className="mt-1 truncate text-sm font-bold text-zinc-200">
              {user?.email}
            </p>
            <button
              type="button"
              onClick={onSignOut}
              className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-red-500/25 bg-red-950/20 text-xs font-black uppercase tracking-[0.12em] text-red-200 transition hover:border-red-400/45 hover:bg-red-950/35 hover:text-white"
            >
              <LogOut size={15} />
              Sair
            </button>
          </div>

          <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md border border-red-500/30 bg-red-950/35 text-red-300">
                <ShieldCheck size={20} />
              </span>
              <div>
                <p className="text-sm font-black text-white">Modo Ataque</p>
                <p className="mt-0.5 text-xs font-medium text-zinc-500">
                  Pipeline sob vigilância
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-1 text-xs font-semibold text-zinc-600">
            <RadioTower size={14} />
            <span>Operação local, sem backend</span>
          </div>
        </div>
        </div>
      </aside>

      {isModalOpen &&
        createPortal(
          <AnnualGoalModal
            form={form}
            hasGoal={Boolean(modalGoal)}
            isEditing={isEditing}
            isLoading={isLoadingGoal}
            isSaving={isSaving}
            error={modalError}
            success={modalSuccess}
            onChange={updateFormField}
            onClose={closeAnnualGoalModal}
            onEdit={() => setIsEditing(true)}
            onCancel={cancelEditing}
            onDelete={removeAnnualGoal}
            onNavigateYear={navigateAnnualGoalYear}
            onSubmit={saveAnnualGoal}
          />,
          document.body,
        )}
    </>
  )
}

function AnnualGoalModal({
  form,
  hasGoal,
  isEditing,
  isLoading,
  isSaving,
  error,
  success,
  onChange,
  onClose,
  onEdit,
  onCancel,
  onDelete,
  onNavigateYear,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden bg-black/70 p-4 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="max-h-[92vh] w-full max-w-2xl overflow-x-hidden overflow-y-auto rounded-lg border border-red-500/20 bg-zinc-950 p-5 shadow-2xl shadow-black/60 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
              Meta anual
            </p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-white">
              Configuração da Meta Anual
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-zinc-400 transition hover:border-red-500/40 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2 rounded-lg border border-white/10 bg-black/20 p-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <button
            type="button"
            onClick={() => onNavigateYear(-1)}
            disabled={isLoading || isSaving}
            className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-white/10 px-3 text-xs font-black uppercase tracking-[0.1em] text-zinc-300 transition hover:border-red-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ChevronLeft size={15} />
            Ano anterior
          </button>
          <p className="rounded-md border border-red-500/20 bg-red-950/15 px-5 py-2 text-center text-sm font-black text-red-100">
            META {form.ano || '-'}
          </p>
          <button
            type="button"
            onClick={() => onNavigateYear(1)}
            disabled={isLoading || isSaving}
            className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-white/10 px-3 text-xs font-black uppercase tracking-[0.1em] text-zinc-300 transition hover:border-red-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Próximo ano
            <ChevronRight size={15} />
          </button>
        </div>

        {isLoading ? (
          <div className="mt-6 flex items-center gap-2 rounded-md border border-white/10 bg-black/25 px-3 py-3 text-sm font-semibold text-zinc-400">
            <Loader2 size={16} className="animate-spin text-red-300" />
            Carregando meta anual...
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <AnnualGoalField
              label="Ano"
              name="ano"
              type="number"
              value={form.ano}
              onChange={onChange}
              disabled={!isEditing || isSaving}
            />
            <AnnualGoalField
              label="Meta financeira padrão"
              name="meta_financeira_padrao"
              type="text"
              inputMode="decimal"
              value={form.meta_financeira_padrao}
              onChange={onChange}
              disabled={!isEditing || isSaving}
              readValue={formatCurrencyBRLWithCents(parseLocalizedNumber(form.meta_financeira_padrao))}
            />
            <AnnualGoalField
              label="Vigente até"
              name="vigente_ate"
              type="date"
              value={form.vigente_ate}
              onChange={onChange}
              disabled={!isEditing || isSaving}
            />
            <label className="space-y-2 md:col-span-3">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
                Observação
              </span>
              <textarea
                name="observacao"
                value={form.observacao}
                onChange={onChange}
                disabled={!isEditing || isSaving}
                rows={4}
                className="w-full resize-none rounded-md border border-white/10 bg-black/30 px-3 py-3 text-sm font-semibold leading-6 text-white outline-none transition focus:border-red-500 disabled:cursor-not-allowed disabled:opacity-70"
              />
            </label>
          </div>
        )}

        {!hasGoal && !isLoading && !isEditing && (
          <div className="mt-5 rounded-md border border-white/10 bg-black/25 px-3 py-2 text-sm font-semibold text-zinc-400">
            Nenhuma meta anual cadastrada para este ano.
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

        <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-10">
            {hasGoal && (
              <button
                type="button"
                onClick={onDelete}
                disabled={isSaving || isLoading}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-red-500/25 bg-red-950/15 px-4 text-xs font-black uppercase tracking-[0.12em] text-red-200 transition hover:border-red-400/45 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={15} />
                Excluir
              </button>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {!isEditing ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-white/10 px-4 text-xs font-black uppercase tracking-[0.12em] text-zinc-300 transition hover:border-red-500/40 hover:text-white"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={onEdit}
                  disabled={isLoading}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-red-500/30 bg-red-950/20 px-4 text-xs font-black uppercase tracking-[0.12em] text-red-200 transition hover:border-red-400/45 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Pencil size={15} />
                  {hasGoal ? 'Editar' : 'Criar meta anual'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSaving}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-white/10 px-4 text-xs font-black uppercase tracking-[0.12em] text-zinc-300 transition hover:border-red-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isLoading}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-600 px-4 text-xs font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {hasGoal ? 'Salvar' : 'Criar meta anual'}
                </button>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

function AnnualGoalField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  inputMode,
  disabled,
  readValue,
}) {
  return (
    <label className="space-y-2">
      <span className="block whitespace-nowrap text-xs font-black uppercase tracking-[0.1em] text-zinc-500">
        {label}
      </span>
      <input
        name={name}
        type={type}
        inputMode={inputMode}
        value={disabled && readValue ? readValue : value}
        onChange={onChange}
        disabled={disabled}
        className="flex h-11 w-full rounded-md border border-white/10 bg-black/30 px-3 text-sm font-semibold text-white outline-none transition focus:border-red-500 disabled:cursor-not-allowed disabled:opacity-70"
      />
    </label>
  )
}

function Signal({ label, value }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/25 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500">
        <Zap size={12} />
        {label}
      </div>
      <p className="mt-1 text-sm font-black text-zinc-100">{value}</p>
    </div>
  )
}

function getEmptyAnnualGoalForm(year) {
  return {
    ano: String(year),
    meta_financeira_padrao: '',
    vigente_ate: '',
    observacao: '',
  }
}

function getAnnualGoalForm(goal, year) {
  if (!goal) {
    return getEmptyAnnualGoalForm(year)
  }

  return {
    ano: String(goal.ano ?? year),
    meta_financeira_padrao: formatNumberForInput(goal.meta_financeira_padrao ?? 0),
    vigente_ate: getDateInputValue(goal.vigente_ate),
    observacao: goal.observacao ?? '',
  }
}

function validateAnnualGoalForm(form) {
  const year = Number(form.ano)
  const annualGoalValue = parseLocalizedNumber(form.meta_financeira_padrao)

  if (!Number.isInteger(year) || year <= 0) {
    return 'Informe um ano válido.'
  }

  if (String(form.meta_financeira_padrao ?? '').trim() === '') {
    return 'Informe a meta financeira padrão.'
  }

  if (!Number.isFinite(annualGoalValue) || annualGoalValue < 0) {
    return 'Informe uma meta financeira padrão maior ou igual a 0.'
  }

  return ''
}

function notifyAnnualGoalChanged(year) {
  window.dispatchEvent(new CustomEvent('annual-goal-updated', { detail: { ano: Number(year) } }))
}

function formatNumberForInput(value) {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return ''
  }

  return String(number).replace('.', ',')
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

function getDateInputValue(value) {
  if (!value) {
    return ''
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString().slice(0, 10)
}

function formatAnnualGoalValidity(value) {
  if (!value) {
    return 'sem vigência'
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month] = value.split('-')
    return `${month}/${year}`
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat('pt-BR', {
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(date)
}

export default Sidebar
