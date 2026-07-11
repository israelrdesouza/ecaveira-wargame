import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  PasswordField,
  PasswordStrength,
  getPasswordCriteria,
  getPasswordStrength,
  validatePassword,
} from './PasswordSecurity'
import SidebarAnnualGoalButton from './sidebar/SidebarAnnualGoalButton'
import SidebarBrand from './sidebar/SidebarBrand'
import SidebarFooter from './sidebar/SidebarFooter'
import SidebarNavList from './sidebar/SidebarNavList'
import SidebarProfileCard from './sidebar/SidebarProfileCard'
import { updateCurrentUserAuthData } from '../services/authService'
import { deleteAnnualGoal, getAnnualGoal, upsertAnnualGoal } from '../services/goalService'
import { listUnreadNotifications, markNotificationAsRead } from '../services/notificationService'
import { updateOwnProfile } from '../services/profileService'
import { formatCurrencyBRLWithCents, formatDateTimeBR } from '../utils/formatters'
import { normalizeText } from '../utils/normalizers'

const Sidebar = forwardRef(function Sidebar({
  currentPage,
  navItems,
  onNavigate,
  onSignOut,
  user,
  profile,
  onProfileUpdated,
  collapsed = false,
  onToggleCollapsed,
}, ref) {
  const currentPeriod = useMemo(() => getCurrentPeriod(), [])
  const currentYear = currentPeriod.ano
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
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
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

  const annualGoalValue = Number(annualGoal?.meta_financeira_padrao || 0)
  const hasAnnualGoal = Number.isFinite(annualGoalValue) && annualGoalValue > 0
  const sidebarNavItems = navItems.filter((item) => item.id !== 'newLead')
  const operatorName = profile?.nome || user?.email || 'Operador'
  const operatorRole = formatProfileRole(profile?.perfil)
  const isAdmin = profile?.perfil === 'admin'

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

  // Expõe as aberturas de modal já existentes para quem monta a Sidebar
  // (Layout), sem duplicar estado/lógica: o menu "Mais" do mobile chama
  // estas mesmas funções através de uma ref (v2.3.0 — Navegação Mobile
  // Premium).
  useImperativeHandle(ref, () => ({
    openProfileModal,
    openNotificationsModal,
  }))

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden overflow-x-hidden border-r border-border bg-surface-strong shadow-[var(--shadow-panel)] backdrop-blur-xl transition-[width] duration-[var(--duration-base)] ease-out lg:block ${
          collapsed ? 'w-[var(--sidebar-w-collapsed)] px-2 py-4' : 'w-[var(--sidebar-w-expanded)] px-4 py-5'
        }`}
      >
        <div className="flex h-full flex-col">
        <SidebarBrand
          collapsed={collapsed}
          onNavigateHome={() => onNavigate('dashboard')}
          onToggleCollapsed={onToggleCollapsed}
        />

        <SidebarProfileCard
          collapsed={collapsed}
          operatorName={operatorName}
          operatorRole={operatorRole}
          isAdmin={isAdmin}
          notificationCount={notifications.length}
          onOpenProfile={openProfileModal}
          onOpenNotifications={openNotificationsModal}
        />

        <SidebarAnnualGoalButton
          collapsed={collapsed}
          year={currentYear}
          hasGoal={hasAnnualGoal}
          value={annualGoalValue}
          validUntil={annualGoal?.vigente_ate}
          onOpen={openAnnualGoalModal}
        />

        <SidebarNavList
          collapsed={collapsed}
          items={sidebarNavItems}
          currentPage={currentPage}
          onNavigate={onNavigate}
        />

        <SidebarFooter collapsed={collapsed} onSignOut={onSignOut} />
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
    </>
  )
})

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


export default Sidebar
