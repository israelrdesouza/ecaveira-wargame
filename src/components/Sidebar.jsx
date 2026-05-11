import {
  Activity,
  AlertTriangle,
  BadgeDollarSign,
  Bell,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Info,
  Loader2,
  LogOut,
  Pencil,
  Save,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import logo from '../assets/ecaveira-logo.png'
import {
  PasswordField,
  PasswordStrength,
  getPasswordCriteria,
  getPasswordStrength,
  validatePassword,
} from './PasswordSecurity'
import { updateCurrentUserAuthData } from '../services/authService'
import { getDashboardData } from '../services/dashboardService'
import { deleteAnnualGoal, getAnnualGoal, upsertAnnualGoal } from '../services/goalService'
import { listUnreadNotifications, markNotificationAsRead } from '../services/notificationService'
import { updateOwnProfile } from '../services/profileService'
import { formatCurrencyBRLWithCents, formatDateTimeBR } from '../utils/formatters'
import { normalizeText } from '../utils/normalizers'

function Sidebar({
  currentPage,
  navItems,
  onNavigate,
  onSignOut,
  user,
  profile,
  onProfileUpdated,
}) {
  const currentPeriod = useMemo(() => getCurrentPeriod(), [])
  const currentYear = currentPeriod.ano
  const [annualGoal, setAnnualGoal] = useState(null)
  const [dashboardSummary, setDashboardSummary] = useState(null)
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalYear, setModalYear] = useState(currentYear)
  const [modalGoal, setModalGoal] = useState(null)
  const [form, setForm] = useState(() => getEmptyAnnualGoalForm(currentYear))
  const [isEditing, setIsEditing] = useState(false)
  const [isLoadingGoal, setIsLoadingGoal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [modalError, setModalError] = useState('')
  const [modalSuccess, setModalSuccess] = useState('')
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [activeIndicator, setActiveIndicator] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)
  const [markingNotificationId, setMarkingNotificationId] = useState('')

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

  useEffect(() => {
    let isMounted = true

    async function loadDashboardSummary() {
      if (!user?.id) {
        setDashboardSummary(null)
        return
      }

      setIsLoadingSummary(true)

      try {
        const data = await getDashboardData(user.id, currentPeriod.mes, currentPeriod.ano)

        if (isMounted) {
          setDashboardSummary(data)
        }
      } catch {
        if (isMounted) {
          setDashboardSummary(null)
        }
      } finally {
        if (isMounted) {
          setIsLoadingSummary(false)
        }
      }
    }

    loadDashboardSummary()

    return () => {
      isMounted = false
    }
  }, [currentPeriod.ano, currentPeriod.mes, user?.id])

  const annualGoalValue = Number(annualGoal?.meta_financeira_padrao || 0)
  const hasAnnualGoal = Number.isFinite(annualGoalValue) && annualGoalValue > 0
  const sidebarNavItems = navItems.filter((item) => item.id !== 'newLead')
  const operatorName = profile?.nome || user?.email || 'Operador'
  const operatorRole = formatProfileRole(profile?.perfil)
  const isAdmin = profile?.perfil === 'admin'
  const tacticalSummary = useMemo(
    () => getTacticalSummary(dashboardSummary, currentPeriod),
    [currentPeriod, dashboardSummary],
  )
  const tacticalIndicators = getTacticalIndicators(tacticalSummary, isLoadingSummary)

  const loadNotifications = useCallback(async ({ showLoading = false } = {}) => {
    if (!isAdmin) {
      setNotifications([])
      return
    }

    if (showLoading) {
      setIsLoadingNotifications(true)
    }

    try {
      const data = await listUnreadNotifications()
      setNotifications(data)
    } catch {
      setNotifications([])
    } finally {
      if (showLoading) {
        setIsLoadingNotifications(false)
      }
    }
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin) {
      setNotifications([])
      return undefined
    }

    loadNotifications()
    const intervalId = window.setInterval(() => {
      loadNotifications()
    }, 30000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [isAdmin, loadNotifications])

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

  function openProfileModal() {
    setIsProfileModalOpen(true)
  }

  function closeProfileModal() {
    setIsProfileModalOpen(false)
  }

  async function openNotificationsModal() {
    setIsNotificationsOpen(true)
    await loadNotifications({ showLoading: true })
  }

  async function markAsRead(notificationId) {
    if (!notificationId || markingNotificationId) {
      return
    }

    setMarkingNotificationId(notificationId)

    try {
      await markNotificationAsRead(notificationId)
      setNotifications((current) => current.filter((item) => item.id !== notificationId))
    } catch {
      await loadNotifications()
    } finally {
      setMarkingNotificationId('')
    }
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
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 overflow-x-hidden border-r border-white/10 bg-zinc-950/85 px-4 py-5 shadow-2xl shadow-black/50 backdrop-blur-xl lg:block">
        <div className="flex h-full flex-col">
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="group flex w-full flex-col items-center rounded-lg px-3 py-4 text-center transition hover:bg-white/[0.035]"
        >
          <span className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-red-500/20 bg-black/25 shadow-[0_0_34px_rgba(220,38,38,0.20)]">
            <span className="absolute inset-2 rounded-lg bg-red-600/15 blur-md motion-safe:animate-pulse" />
            <img
              src={logo}
              alt="eCaveira WarGame"
              className="relative h-16 w-16 object-contain drop-shadow-[0_0_14px_rgba(248,113,113,0.45)] transition duration-300 ease-out group-hover:scale-105"
            />
          </span>
          <span className="mt-3 block max-w-full truncate text-sm font-black uppercase tracking-wide text-white">
            eCaveira WarGame
          </span>
          <span className="mt-1 block max-w-full truncate text-xs font-semibold text-red-200/75">
            Cockpit comercial pessoal
          </span>
        </button>

        <div className="mt-4 rounded-lg border border-red-500/15 bg-red-950/10 p-3 shadow-[0_0_22px_rgba(127,29,29,0.08)]">
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={openProfileModal}
              className="min-w-0 flex-1 text-left"
              title="Meu Perfil"
            >
              <p className="truncate text-sm font-black text-white">
                {operatorName}
              </p>
              <p className="mt-1 text-xs font-bold text-red-200">
                {operatorRole}
              </p>
            </button>
            <button
              type="button"
              onClick={openProfileModal}
              title="Editar perfil"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 text-zinc-500 transition hover:border-red-500/35 hover:bg-red-950/20 hover:text-red-200"
            >
              <Pencil size={14} />
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={openNotificationsModal}
                title="Notificações"
                className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 text-zinc-500 transition hover:border-red-500/35 hover:bg-red-950/20 hover:text-red-200"
              >
                <Bell size={14} />
                {notifications.length > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border border-zinc-950 bg-red-600 px-1 text-[10px] font-black leading-none text-white shadow-[0_0_14px_rgba(220,38,38,0.55)]">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 space-y-2 rounded-lg border border-white/10 bg-zinc-900/45 p-3">
          <TacticalIndicator
            indicator={tacticalIndicators.status}
            onClick={() => setActiveIndicator(tacticalIndicators.status)}
            large
          />
          <TacticalIndicator
            indicator={tacticalIndicators.focus}
            onClick={() => setActiveIndicator(tacticalIndicators.focus)}
            large
          />
          <TacticalIndicator
            indicator={tacticalIndicators.rhythm}
            onClick={() => setActiveIndicator(tacticalIndicators.rhythm)}
            large
          />
          <TacticalIndicator
            indicator={tacticalIndicators.attack}
            onClick={() => setActiveIndicator(tacticalIndicators.attack)}
            large
          />
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
          {sidebarNavItems.map((item) => {
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
                <span className="min-w-0 truncate">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-red-500/25 bg-red-950/20 text-xs font-black uppercase tracking-[0.12em] text-red-200 transition hover:border-red-400/45 hover:bg-red-950/35 hover:text-white"
          >
            <LogOut size={15} />
            Sair
          </button>
        </div>
        </div>
      </aside>

      {isAdmin && (
        <button
          type="button"
          onClick={openNotificationsModal}
          title="Notificações"
          className="fixed right-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-zinc-950/85 text-zinc-300 shadow-2xl shadow-black/40 backdrop-blur-xl transition hover:border-red-500/35 hover:text-red-200 lg:hidden"
        >
          <Bell size={17} />
          {notifications.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-zinc-950 bg-red-600 px-1 text-[10px] font-black leading-none text-white shadow-[0_0_14px_rgba(220,38,38,0.55)]">
              {notifications.length > 9 ? '9+' : notifications.length}
            </span>
          )}
        </button>
      )}

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

      {isProfileModalOpen &&
        createPortal(
          <ProfileModal
            user={user}
            profile={profile}
            onClose={closeProfileModal}
            onProfileUpdated={onProfileUpdated}
          />,
          document.body,
        )}

      {isNotificationsOpen &&
        createPortal(
          <NotificationsModal
            notifications={notifications}
            isLoading={isLoadingNotifications}
            markingId={markingNotificationId}
            onClose={() => setIsNotificationsOpen(false)}
            onMarkAsRead={markAsRead}
          />,
          document.body,
        )}

      {activeIndicator &&
        createPortal(
          <TacticalIndicatorModal
            indicator={activeIndicator}
            onClose={() => setActiveIndicator(null)}
            onNavigateDashboard={() => {
              setActiveIndicator(null)
              onNavigate('dashboard')
            }}
          />,
          document.body,
        )}
    </>
  )
}

function NotificationsModal({
  notifications,
  isLoading,
  markingId,
  onClose,
  onMarkAsRead,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden bg-black/75 p-4 backdrop-blur-sm">
      <article className="max-h-[92vh] w-full max-w-xl overflow-x-hidden overflow-y-auto rounded-lg border border-red-500/20 bg-zinc-950 p-5 shadow-2xl shadow-black/60 sm:p-6">
        <header className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
              Central interna
            </p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-white">
              Notificações
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-zinc-500">
              Eventos importantes do eCaveira WarGame.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 text-zinc-400 transition hover:border-red-500/40 hover:text-white"
            aria-label="Fechar notificações"
          >
            <X size={18} />
          </button>
        </header>

        <div className="mt-5 space-y-3">
          {isLoading && (
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/25 p-4 text-sm font-semibold text-zinc-400">
              <Loader2 size={17} className="animate-spin text-red-300" />
              Carregando notificações...
            </div>
          )}

          {!isLoading && notifications.length === 0 && (
            <div className="rounded-lg border border-white/10 bg-black/25 p-4 text-sm font-semibold text-zinc-400">
              Nenhuma notificação nova.
            </div>
          )}

          {!isLoading &&
            notifications.map((notification) => (
              <article
                key={notification.id}
                className="rounded-lg border border-white/10 bg-zinc-900/55 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-white">{notification.titulo}</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-zinc-400">
                      {notification.mensagem}
                    </p>
                    <p className="mt-2 text-xs font-bold text-zinc-600">
                      {formatDateTimeBR(notification.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onMarkAsRead(notification.id)}
                    disabled={markingId === notification.id}
                    className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-red-500/25 bg-red-950/15 px-3 text-xs font-black text-red-100 transition hover:border-red-400/45 hover:bg-red-950/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {markingId === notification.id && (
                      <Loader2 size={14} className="animate-spin" />
                    )}
                    Marcar como lida
                  </button>
                </div>
              </article>
            ))}
        </div>
      </article>
    </div>
  )
}

function TacticalIndicator({ indicator, onClick, large = false }) {
  const tone = getIndicatorToneClasses(indicator.tone)
  const Icon = indicator.icon

  return (
    <button
      type="button"
      onClick={onClick}
      title="Clique para entender"
      className={`group w-full rounded-lg border p-3 text-left shadow-[0_0_22px_rgba(0,0,0,0.14)] transition hover:-translate-y-0.5 hover:bg-white/[0.045] ${tone.card} ${
        large ? 'p-4' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={`flex shrink-0 items-center justify-center rounded-md border ${tone.icon} ${
          large ? 'h-10 w-10' : 'h-8 w-8'
        }`}>
          <Icon size={large ? 19 : 15} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[11px] font-black uppercase tracking-[0.16em] text-zinc-500">
              {indicator.label}
            </p>
            <span className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`} />
          </div>
          <p className={`mt-1 break-words font-black leading-snug text-white ${large ? 'text-sm' : 'text-xs'}`}>
            {indicator.value}
          </p>
          <p className="mt-1 break-words text-xs font-medium leading-5 text-zinc-500">
            {indicator.shortDescription}
          </p>
        </div>
      </div>
    </button>
  )
}

function TacticalIndicatorModal({ indicator, onClose, onNavigateDashboard }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden bg-black/75 p-4 backdrop-blur-sm">
      <article className="max-h-[92vh] w-full max-w-2xl overflow-x-hidden overflow-y-auto rounded-lg border border-red-500/20 bg-zinc-950 p-5 shadow-2xl shadow-black/60 sm:p-6">
        <header className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
              Indicador tático
            </p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-white">
              {indicator.modalTitle}
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-zinc-500">
              {indicator.modalSubtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 text-zinc-400 transition hover:border-red-500/40 hover:text-white"
            aria-label="Fechar indicador"
          >
            <X size={18} />
          </button>
        </header>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {indicator.metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-lg border border-white/10 bg-black/25 p-3"
            >
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-zinc-600">
                {metric.label}
              </p>
              <p className="mt-1 text-base font-black text-white">{metric.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-4">
          <TacticalModalSection title="Motivos considerados" items={indicator.reasons} />
          <TacticalModalSection title="Dados analisados" items={indicator.dataPoints} />
          <div className="rounded-lg border border-red-500/20 bg-red-950/15 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-red-300">
              Orientação prática
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-red-100/85">
              {indicator.guidance}
            </p>
          </div>
        </div>

        <footer className="mt-6 flex flex-col-reverse gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          {indicator.allowDashboardAction ? (
            <button
              type="button"
              onClick={onNavigateDashboard}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-600 px-4 text-xs font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500"
            >
              <Crosshair size={15} />
              Ir ao Dashboard
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-md border border-white/10 px-4 text-xs font-black uppercase tracking-[0.12em] text-zinc-300 transition hover:border-red-500/40 hover:text-white"
          >
            Fechar
          </button>
        </footer>
      </article>
    </div>
  )
}

function TacticalModalSection({ title, items }) {
  return (
    <section className="rounded-lg border border-white/10 bg-zinc-900/45 p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
        {title}
      </p>
      <ul className="mt-3 space-y-2 text-sm font-semibold leading-6 text-zinc-300">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ProfileModal({ user, profile, onClose, onProfileUpdated }) {
  const [form, setForm] = useState(() => ({
    nome: profile?.nome ?? '',
    email: profile?.email ?? user?.email ?? '',
    cargo: profile?.cargo ?? '',
    perfil: formatProfileRole(profile?.perfil),
  }))
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const hasPasswordInput = Boolean(password || confirmPassword)
  const passwordCriteria = getPasswordCriteria(password, confirmPassword)
  const passwordStrength = getPasswordStrength(password)
  const isPasswordValid = passwordCriteria.every((criterion) => criterion.valid)
  const canSubmit = !isSavingProfile && (!hasPasswordInput || isPasswordValid)

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setError('')
    setSuccess('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const normalizedProfile = {
      nome: normalizeText(form.nome),
      cargo: normalizeText(form.cargo),
    }

    if (!normalizedProfile.nome) {
      setError('Nome é obrigatório.')
      return
    }

    if (hasPasswordInput) {
      const passwordError = validatePassword(password, confirmPassword)

      if (passwordError) {
        setError(passwordError)
        return
      }
    }

    setIsSavingProfile(true)

    try {
      await updateOwnProfile(user.id, {
        nome: normalizedProfile.nome,
        cargo: normalizedProfile.cargo || null,
      })

      const { error: authError } = await updateCurrentUserAuthData({
        password: hasPasswordInput ? password : undefined,
        metadata: {
          nome: normalizedProfile.nome,
          cargo: normalizedProfile.cargo || null,
        },
      })

      if (authError) {
        throw authError
      }

      setForm((current) => ({
        ...current,
        nome: normalizedProfile.nome,
        cargo: normalizedProfile.cargo,
      }))
      setPassword('')
      setConfirmPassword('')
      setSuccess('Perfil atualizado com sucesso.')
      await onProfileUpdated?.()
    } catch {
      setError('Não foi possível atualizar o perfil.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden bg-black/75 p-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="max-h-[92vh] w-full max-w-2xl overflow-x-hidden overflow-y-auto rounded-lg border border-red-500/20 bg-zinc-950 p-5 shadow-2xl shadow-black/60 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
              Conta
            </p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-white">
              Meu Perfil
            </h2>
            <p className="mt-2 text-sm font-medium leading-6 text-zinc-500">
              Atualize seus dados e, se quiser, defina uma nova senha.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 text-zinc-400 transition hover:border-red-500/40 hover:text-white"
            aria-label="Fechar Meu Perfil"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <ProfileField label="Nome" name="nome" value={form.nome} onChange={updateField} />
          <ProfileField label="Login/e-mail" name="email" value={form.email} readOnly />
          <ProfileField label="Cargo" name="cargo" value={form.cargo} onChange={updateField} />
          <ProfileField label="Perfil" name="perfil" value={form.perfil} readOnly />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <PasswordField
            label="Nova senha"
            value={password}
            onChange={setPassword}
            showValue={showPassword}
            onToggleShow={() => setShowPassword((current) => !current)}
            placeholder="Opcional"
            toggleLabel={showPassword ? 'Ocultar nova senha' : 'Mostrar nova senha'}
          />

          <PasswordField
            label="Confirmar nova senha"
            value={confirmPassword}
            onChange={setConfirmPassword}
            showValue={showConfirmPassword}
            onToggleShow={() => setShowConfirmPassword((current) => !current)}
            placeholder="Repita a nova senha"
            toggleLabel={
              showConfirmPassword
                ? 'Ocultar confirmação de senha'
                : 'Mostrar confirmação de senha'
            }
          />
        </div>

        {hasPasswordInput && (
          <div className="mt-4">
            <PasswordStrength criteria={passwordCriteria} strength={passwordStrength} />
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

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSavingProfile}
            className="inline-flex h-10 items-center justify-center rounded-md border border-white/10 px-4 text-xs font-black uppercase tracking-[0.12em] text-zinc-300 transition hover:border-red-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Fechar
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-600 px-4 text-xs font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none"
          >
            {isSavingProfile && <Loader2 size={15} className="animate-spin" />}
            Salvar perfil
          </button>
        </div>
      </form>
    </div>
  )
}

function ProfileField({ label, name, value, onChange, readOnly = false }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </span>
      <input
        name={name}
        type="text"
        value={value}
        readOnly={readOnly}
        onChange={onChange}
        className="h-11 w-full rounded-md border border-white/10 bg-black/30 px-3 text-sm font-semibold text-white outline-none transition read-only:cursor-not-allowed read-only:text-zinc-500 focus:border-red-500"
      />
    </label>
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

function formatProfileRole(role) {
  const roles = {
    admin: 'Admin',
    operador: 'Operador',
  }

  return roles[role] ?? 'Operador'
}

function getCurrentPeriod() {
  const now = new Date()

  return {
    mes: now.getMonth() + 1,
    ano: now.getFullYear(),
  }
}

function getTacticalSummary(data, period) {
  const goal = data?.goal ?? null
  const auxiliary = data?.auxiliary ?? {}
  const stages = data?.stages ?? []
  const leads = data?.leads ?? []
  const rhythm = getSidebarWarRhythm(goal, leads, period.mes, period.ano)
  const negotiations = stages.find((stage) => stage.key === 'negociacoes')?.realizado ?? 0

  return {
    hasData: Boolean(data && goal),
    period,
    risk: Number(auxiliary.operationalRisk ?? 0),
    overdueFollowUps: Number(auxiliary.overdueFollowUps ?? 0),
    caveiraLeads: Number(auxiliary.caveiraLeads ?? 0),
    todayMission: Number(auxiliary.todayMission ?? 0),
    negotiations,
    rhythm,
  }
}

function getTacticalIndicators(summary, isLoading) {
  const loadingIndicator = {
    tone: 'gray',
    value: 'Lendo dados',
    shortDescription: 'Analisando mês atual.',
  }

  const status = getStatusIndicator(summary, isLoading, loadingIndicator)
  const focus = getFocusIndicator(summary, isLoading, loadingIndicator)
  const rhythm = getRhythmIndicator(summary, isLoading, loadingIndicator)
  const attack = getAttackIndicator(summary, isLoading, loadingIndicator)

  return { status, focus, rhythm, attack }
}

function getStatusIndicator(summary, isLoading, loadingIndicator) {
  if (isLoading) {
    return buildIndicator({
      key: 'status',
      label: 'Status',
      modalTitle: 'Status da Operação',
      icon: Info,
      ...loadingIndicator,
      metrics: [{ label: 'Status atual', value: 'Lendo dados' }],
      reasons: ['O cockpit está carregando os dados do mês atual.'],
      dataPoints: ['Metas mensais', 'Risco operacional', 'Ritmo de Guerra'],
      guidance: 'Aguarde a leitura dos dados para avaliar a operação.',
    })
  }

  if (!summary.hasData) {
    return buildIndicator({
      key: 'status',
      label: 'Status',
      value: 'Sem dados',
      tone: 'gray',
      icon: Info,
      modalTitle: 'Status da Operação',
      shortDescription: 'Metas do mês ainda não cadastradas.',
      metrics: [{ label: 'Status atual', value: 'Sem dados' }],
      reasons: ['Não há meta mensal cadastrada para ativar a análise tática.'],
      dataPoints: ['Metas do mês', 'Leads do período'],
      guidance: 'Cadastre as metas mensais para liberar a leitura completa da operação.',
    })
  }

  const isCritical = summary.risk >= 3 || summary.rhythm.status === 'critico'
  const needsAttention = summary.risk > 0 || summary.rhythm.status === 'atrasado'

  if (isCritical) {
    return buildIndicator({
      key: 'status',
      label: 'Status',
      value: 'Crítico',
      tone: 'red',
      icon: AlertTriangle,
      modalTitle: 'Status da Operação',
      shortDescription: 'Ação comercial necessária agora.',
      metrics: getCommonTacticalMetrics(summary, 'Crítico'),
      reasons: [
        `Risco operacional em ${summary.risk} pendência(s).`,
        `Saldo do ritmo em ${summary.rhythm.saldo}.`,
      ],
      dataPoints: ['Follow-ups vencidos', 'Ritmo de Guerra', 'Missão do Dia'],
      guidance: 'Priorize pendências vencidas e recupere o ritmo antes de avançar novas frentes.',
    })
  }

  if (needsAttention) {
    return buildIndicator({
      key: 'status',
      label: 'Status',
      value: 'Atenção',
      tone: 'amber',
      icon: AlertTriangle,
      modalTitle: 'Status da Operação',
      shortDescription: 'Há pontos para monitorar.',
      metrics: getCommonTacticalMetrics(summary, 'Atenção'),
      reasons: [
        `Risco operacional em ${summary.risk} pendência(s).`,
        `Ritmo atual: ${summary.rhythm.label}.`,
      ],
      dataPoints: ['Risco operacional', 'Follow-ups vencidos', 'Meta acumulada'],
      guidance: 'Resolva os atrasos do dia e mantenha o pipeline sob controle.',
    })
  }

  return buildIndicator({
    key: 'status',
    label: 'Status',
    value: 'Em combate',
    tone: 'green',
    icon: ShieldCheck,
    modalTitle: 'Status da Operação',
    shortDescription: 'Operação saudável no mês atual.',
    metrics: getCommonTacticalMetrics(summary, 'Em combate'),
    reasons: ['Sem risco operacional aberto.', `Ritmo atual: ${summary.rhythm.label}.`],
    dataPoints: ['Risco operacional', 'Ritmo de Guerra', 'Leads ativos'],
    guidance: 'Mantenha a cadência comercial e ataque oportunidades de maior temperatura.',
  })
}

function getFocusIndicator(summary, isLoading, loadingIndicator) {
  if (isLoading || !summary.hasData) {
    return buildIndicator({
      key: 'focus',
      label: 'Foco',
      value: isLoading ? loadingIndicator.value : 'Configurar',
      tone: 'gray',
      icon: Crosshair,
      modalTitle: 'Foco recomendado',
      shortDescription: isLoading ? loadingIndicator.shortDescription : 'Faltam metas do mês.',
      metrics: [{ label: 'Foco atual', value: isLoading ? 'Lendo dados' : 'Configurar metas' }],
      reasons: [isLoading ? 'O sistema ainda está calculando o foco.' : 'Sem metas não há recomendação confiável.'],
      dataPoints: ['Follow-ups vencidos', 'Ritmo', 'Temperatura', 'Negociações'],
      guidance: isLoading ? 'Aguarde a leitura.' : 'Cadastre as metas para receber foco operacional.',
    })
  }

  if (summary.overdueFollowUps > 0) {
    return buildFocus('Resolver pendências', 'red', 'Há follow-ups vencidos exigindo ação.', summary)
  }

  if (summary.rhythm.status === 'atrasado' || summary.rhythm.status === 'critico') {
    return buildFocus('Prospectar', 'amber', 'O ritmo de suspects está abaixo do necessário.', summary)
  }

  if (summary.caveiraLeads > 0) {
    return buildFocus('Atacar Caveiras', 'red', 'Existem leads Caveira ativos no período.', summary)
  }

  if (summary.negotiations > 0) {
    return buildFocus('Avançar negociações', 'green', 'Há negociações em jogo para evoluir.', summary)
  }

  return buildFocus('Manter ritmo', 'green', 'Operação sem alertas críticos no momento.', summary)
}

function buildFocus(value, tone, reason, summary) {
  return buildIndicator({
    key: 'focus',
    label: 'Foco',
    value,
    tone,
    icon: Crosshair,
    modalTitle: 'Foco recomendado',
    shortDescription: reason,
    metrics: getCommonTacticalMetrics(summary, value),
    reasons: [reason],
    dataPoints: ['Follow-ups vencidos', 'Leads Caveira', 'Negociações', 'Ritmo de Guerra'],
    guidance:
      value === 'Resolver pendências'
        ? 'Comece pelos contatos vencidos antes de abrir novas frentes.'
        : value === 'Prospectar'
          ? 'Cadastre novos suspects para recuperar a meta acumulada.'
          : value === 'Atacar Caveiras'
            ? 'Priorize contatos de alta temperatura e avance a etapa.'
            : value === 'Avançar negociações'
              ? 'Atue nas negociações abertas para transformar pipeline em fechamento.'
              : 'Siga a cadência planejada e monitore novos riscos.',
  })
}

function getRhythmIndicator(summary, isLoading, loadingIndicator) {
  if (isLoading || !summary.hasData) {
    return buildIndicator({
      key: 'rhythm',
      label: 'Ritmo',
      value: isLoading ? loadingIndicator.value : 'Sem dados',
      tone: 'gray',
      icon: Activity,
      modalTitle: 'Ritmo de Guerra',
      shortDescription: isLoading ? loadingIndicator.shortDescription : 'Meta mensal ausente.',
      metrics: getRhythmMetrics(summary.rhythm),
      reasons: [isLoading ? 'Calculando execução diária.' : 'Sem meta mensal para calcular ritmo.'],
      dataPoints: ['Meta de suspects', 'Dias úteis', 'Suspects realizados'],
      guidance: isLoading ? 'Aguarde a leitura.' : 'Cadastre metas mensais para ativar o ritmo.',
    })
  }

  const tone = summary.rhythm.status === 'critico' || summary.rhythm.status === 'atrasado'
    ? 'red'
    : summary.rhythm.status === 'ritmo'
      ? 'green'
      : 'green'

  return buildIndicator({
    key: 'rhythm',
    label: 'Ritmo',
    value: summary.rhythm.label,
    tone,
    icon: Activity,
    modalTitle: 'Ritmo de Guerra',
    shortDescription: summary.rhythm.supportText,
    metrics: getRhythmMetrics(summary.rhythm),
    reasons: [
      `Meta acumulada: ${summary.rhythm.metaAcumulada}.`,
      `Realizado acumulado: ${summary.rhythm.realizadoAcumulado}.`,
      `Saldo do ritmo: ${summary.rhythm.saldo}.`,
    ],
    dataPoints: ['Meta base diária', 'Realizado hoje', 'Missão de hoje'],
    guidance:
      summary.rhythm.saldo > 0
        ? 'Ataque a prospecção hoje para recuperar o saldo acumulado.'
        : 'Mantenha a cadência e proteja a agenda comercial do dia.',
  })
}

function getAttackIndicator(summary, isLoading, loadingIndicator) {
  if (isLoading || !summary.hasData) {
    return buildIndicator({
      key: 'attack',
      label: 'Modo Ataque',
      value: isLoading ? loadingIndicator.value : 'Sem dados',
      tone: 'gray',
      icon: ShieldCheck,
      modalTitle: 'Modo Ataque',
      shortDescription: isLoading ? loadingIndicator.shortDescription : 'Sem dados suficientes.',
      metrics: [{ label: 'Situação atual', value: isLoading ? 'Lendo dados' : 'Sem dados' }],
      reasons: [isLoading ? 'Analisando pipeline.' : 'Metas do mês ainda não cadastradas.'],
      dataPoints: ['Pipeline', 'Risco operacional', 'Leads ativos'],
      guidance: isLoading ? 'Aguarde a leitura.' : 'Cadastre as metas do mês para ativar o modo ataque.',
      allowDashboardAction: true,
    })
  }

  const isCritical = summary.risk >= 3
  const hasRisk = summary.risk > 0
  const value = isCritical ? 'Operação crítica' : hasRisk ? 'Ataque necessário' : 'Pipeline sob vigilância'
  const tone = isCritical ? 'red' : hasRisk ? 'amber' : 'green'

  return buildIndicator({
    key: 'attack',
    label: 'Modo Ataque',
    value,
    tone,
    icon: ShieldCheck,
    modalTitle: 'Modo Ataque',
    shortDescription: hasRisk ? 'Pendências exigem ação.' : 'Pipeline monitorado sem risco aberto.',
    metrics: getCommonTacticalMetrics(summary, value),
    reasons: [
      `Risco operacional: ${summary.risk}.`,
      `Follow-ups vencidos: ${summary.overdueFollowUps}.`,
      `Missão do Dia: ${summary.todayMission}.`,
    ],
    dataPoints: ['Pipeline do mês', 'Pendências', 'Leads Caveira'],
    guidance: hasRisk
      ? 'Vá ao Dashboard e resolva as pendências que compõem o risco operacional.'
      : 'Continue monitorando o pipeline e priorize oportunidades de maior temperatura.',
    allowDashboardAction: true,
  })
}

function buildIndicator(indicator) {
  return {
    allowDashboardAction: false,
    reasons: [],
    dataPoints: [],
    metrics: [],
    guidance: '',
    shortDescription: '',
    ...indicator,
  }
}

function getCommonTacticalMetrics(summary, currentValue) {
  return [
    { label: 'Situação atual', value: currentValue },
    { label: 'Risco operacional', value: summary.risk },
    { label: 'Follow-ups vencidos', value: summary.overdueFollowUps },
    { label: 'Leads Caveira', value: summary.caveiraLeads },
    { label: 'Missão do Dia', value: summary.todayMission },
    { label: 'Negociações', value: summary.negotiations },
  ]
}

function getRhythmMetrics(rhythm) {
  return [
    { label: 'Meta base diária', value: rhythm.metaBaseDiaria },
    { label: 'Realizado hoje', value: rhythm.realizadoHoje },
    { label: 'Realizado acumulado', value: rhythm.realizadoAcumulado },
    { label: 'Meta acumulada', value: rhythm.metaAcumulada },
    { label: 'Saldo do ritmo', value: rhythm.saldo },
    { label: 'Missão de hoje', value: rhythm.missaoHoje },
  ]
}

function getIndicatorToneClasses(tone) {
  const tones = {
    green: {
      card: 'border-emerald-500/20 bg-emerald-950/10 hover:border-emerald-500/35',
      icon: 'border-emerald-500/25 bg-emerald-950/25 text-emerald-300',
      dot: 'bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.75)]',
    },
    amber: {
      card: 'border-amber-500/20 bg-amber-950/10 hover:border-amber-500/35',
      icon: 'border-amber-500/25 bg-amber-950/25 text-amber-300',
      dot: 'bg-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.75)]',
    },
    red: {
      card: 'border-red-500/25 bg-red-950/15 hover:border-red-500/45',
      icon: 'border-red-500/30 bg-red-950/35 text-red-300',
      dot: 'bg-red-500 shadow-[0_0_14px_rgba(239,68,68,0.85)]',
    },
    gray: {
      card: 'border-white/10 bg-zinc-900/45 hover:border-white/20',
      icon: 'border-white/10 bg-black/25 text-zinc-400',
      dot: 'bg-zinc-500 shadow-[0_0_10px_rgba(113,113,122,0.45)]',
    },
  }

  return tones[tone] ?? tones.gray
}

function getSidebarWarRhythm(goal, leads, month, year) {
  const metaSuspect = Math.max(Number(goal?.meta_suspect ?? 0), 0)
  const diasUteis = Math.max(Number(goal?.dias_uteis ?? countWeekdaysInMonth(year, month)), 0)
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
  const criticalLimit = Math.max(metaBaseDiaria * 2, 5)
  const status = saldo > criticalLimit ? 'critico' : saldo > 0 ? 'atrasado' : saldo < 0 ? 'adiantado' : 'ritmo'

  return {
    metaBaseDiaria,
    realizadoHoje,
    realizadoAcumulado,
    metaAcumulada,
    saldo,
    missaoHoje,
    status,
    label: status === 'critico' ? 'Crítico' : status === 'atrasado' ? 'Atrasado' : status === 'adiantado' ? 'Adiantado' : 'No ritmo',
    supportText: getRhythmSupportText(saldo),
  }
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

function countWeekdaysInMonth(year, month) {
  const numericYear = Number(year)
  const numericMonth = Number(month)
  const lastDay = new Date(numericYear, numericMonth, 0).getDate()

  return countWeekdaysUntil(numericYear, numericMonth, lastDay)
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

function isWeekday(date) {
  const weekday = date.getDay()

  return weekday !== 0 && weekday !== 6
}

function getSuspectDate(lead) {
  return String(lead?.data_suspect || lead?.created_at || '').slice(0, 10)
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

export default Sidebar
