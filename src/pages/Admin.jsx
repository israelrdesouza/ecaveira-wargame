import {
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UsersRound,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  createUser,
  deleteUser,
  listUsers,
  resetUserOperationalData,
} from '../services/adminService'
import { updateProfileAccess } from '../services/profileService'
import { useAuth } from '../hooks/useAuth'
import { formatDateTimeBR } from '../utils/formatters'
import { normalizeEmail, normalizeText } from '../utils/normalizers'

const initialNewUserForm = {
  nome: '',
  email: '',
  cargo: '',
  perfil: 'operador',
  ativo: true,
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

function getInitialResetForm() {
  return {
    mode: 'year',
    year: String(new Date().getFullYear()),
    months: [],
    confirmation: '',
  }
}

function Admin() {
  const { user, isAdmin } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isNewUserOpen, setIsNewUserOpen] = useState(false)
  const [newUserForm, setNewUserForm] = useState(initialNewUserForm)
  const [newUserError, setNewUserError] = useState('')
  const [newUserSuccess, setNewUserSuccess] = useState('')
  const [creatingUser, setCreatingUser] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [editError, setEditError] = useState('')
  const [updatingUser, setUpdatingUser] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deletingUser, setDeletingUser] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [resetTarget, setResetTarget] = useState(null)
  const [resetForm, setResetForm] = useState(getInitialResetForm)
  const [resettingData, setResettingData] = useState(false)
  const [resetError, setResetError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadProfiles() {
      if (!isAdmin) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const data = await listUsers()

        if (isMounted) {
          setProfiles(data)
        }
      } catch (profileError) {
        if (isMounted) {
          setError(profileError.message || 'Não foi possível carregar os usuários.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadProfiles()

    return () => {
      isMounted = false
    }
  }, [isAdmin])

  async function refreshProfiles() {
    const data = await listUsers()
    setProfiles(data)
  }

  function openNewUserModal() {
    setNewUserForm(initialNewUserForm)
    setNewUserError('')
    setNewUserSuccess('')
    setIsNewUserOpen(true)
  }

  function closeNewUserModal() {
    if (creatingUser) {
      return
    }

    setIsNewUserOpen(false)
    setNewUserForm(initialNewUserForm)
    setNewUserError('')
    setNewUserSuccess('')
  }

  function updateNewUserField(event) {
    const { name, value } = event.target
    setNewUserForm((current) => ({
      ...current,
      [name]: name === 'ativo' ? value === 'true' : value,
    }))
    setNewUserError('')
    setNewUserSuccess('')
  }

  async function handleCreateUser(event) {
    event.preventDefault()
    setNewUserError('')
    setNewUserSuccess('')
    const normalizedPayload = normalizeUserForm(newUserForm)
    const validationError = validateUserForm(normalizedPayload, { requireEmail: true })

    if (validationError) {
      setNewUserError(validationError)
      return
    }

    setCreatingUser(true)

    try {
      await createUser(normalizedPayload)

      setNewUserSuccess('Convite enviado com sucesso para o usuário.')
      await refreshProfiles()
    } catch (createError) {
      setNewUserError(getCreateUserMessage(createError.message))
    } finally {
      setCreatingUser(false)
    }
  }

  function openEditModal(profile) {
    setEditTarget(profile)
    setEditForm({
      nome: profile.nome ?? '',
      email: profile.email ?? '',
      cargo: profile.cargo ?? '',
      perfil: profile.perfil || 'operador',
      ativo: profile.ativo !== false,
    })
    setEditError('')
  }

  function closeEditModal() {
    if (updatingUser) {
      return
    }

    setEditTarget(null)
    setEditForm(null)
    setEditError('')
  }

  function updateEditField(event) {
    const { name, value } = event.target
    setEditForm((current) => ({
      ...current,
      [name]: name === 'ativo' ? value === 'true' : value,
    }))
    setEditError('')
  }

  async function handleUpdateUser(event) {
    event.preventDefault()

    if (!editTarget || !editForm || updatingUser) {
      return
    }

    const normalizedPayload = normalizeUserForm(editForm)
    const validationError = validateUserForm(normalizedPayload, { requireEmail: false })

    if (validationError) {
      setEditError(validationError)
      return
    }

    if (editTarget.id === user?.id && normalizedPayload.ativo === false) {
      setEditError('Você não pode bloquear seu próprio acesso.')
      return
    }

    if (editTarget.id === user?.id && normalizedPayload.perfil !== 'admin') {
      setEditError('Você não pode remover seu próprio perfil de administrador.')
      return
    }

    setUpdatingUser(true)
    setError('')
    setSuccess('')

    try {
      const updatedProfile = await updateProfileAccess(
        editTarget.id,
        {
          nome: normalizedPayload.nome,
          cargo: normalizedPayload.cargo || null,
          perfil: normalizedPayload.perfil,
          ativo: normalizedPayload.ativo,
        },
        user?.id,
      )

      setProfiles((current) =>
        current.map((item) =>
          item.id === updatedProfile.id ? { ...item, ...updatedProfile } : item,
        ),
      )
      setSuccess('Usuário atualizado com sucesso.')
      closeEditModal()
    } catch (updateError) {
      setEditError(updateError.message || 'Não foi possível atualizar o usuário.')
    } finally {
      setUpdatingUser(false)
    }
  }

  function openDeleteModal(profile) {
    setDeleteTarget(profile)
    setDeleteConfirmation('')
    setDeleteError('')
  }

  function closeDeleteModal() {
    if (deletingUser) {
      return
    }

    setDeleteTarget(null)
    setDeleteConfirmation('')
    setDeleteError('')
  }

  async function handleDeleteUser(event) {
    event.preventDefault()

    if (!deleteTarget || !isDeleteConfirmationValid(deleteConfirmation)) {
      return
    }

    if (deleteTarget.id === user?.id) {
      setDeleteError('Você não pode excluir seu próprio acesso.')
      return
    }

    setDeletingUser(true)
    setDeleteError('')
    setError('')
    setSuccess('')

    try {
      await deleteUser(deleteTarget.id)
      await refreshProfiles()
      setSuccess('Usuário excluído com sucesso.')
      closeDeleteModal()
    } catch {
      setDeleteError('Não foi possível excluir o usuário.')
    } finally {
      setDeletingUser(false)
    }
  }

  function openResetModal(profile) {
    setResetTarget(profile)
    setResetForm(getInitialResetForm())
    setResetError('')
  }

  function closeResetModal() {
    if (resettingData) {
      return
    }

    setResetTarget(null)
    setResetForm(getInitialResetForm())
    setResetError('')
  }

  function updateResetField(event) {
    const { name, value } = event.target

    setResetForm((current) => ({
      ...current,
      [name]: value,
      months: name === 'mode' && value === 'year' ? [] : current.months,
    }))
    setResetError('')
  }

  function toggleResetMonth(month) {
    setResetForm((current) => {
      const selected = current.months.includes(month)
      const months = selected
        ? current.months.filter((item) => item !== month)
        : [...current.months, month].sort((first, second) => first - second)

      return { ...current, months }
    })
    setResetError('')
  }

  async function handleResetOperationalData(event) {
    event.preventDefault()

    if (!resetTarget || resettingData) {
      return
    }

    const validationError = validateResetForm(resetForm)

    if (validationError) {
      setResetError(validationError)
      return
    }

    setResettingData(true)
    setResetError('')
    setError('')
    setSuccess('')

    try {
      await resetUserOperationalData({
        user_id: resetTarget.id,
        year: Number(resetForm.year),
        mode: resetForm.mode,
        months: resetForm.mode === 'months' ? resetForm.months : undefined,
      })

      await refreshProfiles()
      setSuccess('Dados operacionais reiniciados com sucesso.')
      setResetTarget(null)
      setResetForm(getInitialResetForm())
      setResetError('')
    } catch {
      setResetError('Não foi possível reiniciar os dados operacionais.')
    } finally {
      setResettingData(false)
    }
  }

  if (!isAdmin) {
    return (
      <section className="space-y-5">
        <RestrictedAccess />
      </section>
    )
  }

  return (
    <section className="space-y-5 sm:space-y-6">
      <header className="rounded-lg border border-white/10 bg-zinc-900/70 p-5 shadow-2xl shadow-black/25 backdrop-blur sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-red-300">
              Administração
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Usuários
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-zinc-400">
              Controle perfis, bloqueios de acesso e criação segura de operadores.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openNewUserModal}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-red-600 px-4 text-sm font-black text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500"
            >
              <Plus size={17} strokeWidth={2.6} />
              Novo usuário
            </button>
            <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-red-500/25 bg-red-950/25 text-red-300 shadow-[0_0_28px_rgba(127,29,29,0.18)] sm:flex">
              <UsersRound size={26} />
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-red-500/25 bg-red-950/20 p-4 text-sm font-semibold text-red-100">
          {error}
        </div>
      )}

      {success && (
        <div className="flex gap-2 rounded-lg border border-emerald-500/25 bg-emerald-950/20 p-4 text-sm font-semibold text-emerald-200">
          <ShieldCheck size={17} className="mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <article className="rounded-lg border border-white/10 bg-zinc-900/70 shadow-xl shadow-black/20 backdrop-blur">
        {loading ? (
          <div className="flex items-center gap-2 p-5 text-sm font-semibold text-zinc-400">
            <Loader2 size={17} className="animate-spin text-red-300" />
            Carregando usuários...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1120px] w-full text-left">
              <thead className="border-b border-white/10 bg-black/20">
                <tr className="text-xs font-black uppercase tracking-[0.14em] text-zinc-600">
                  <th className="px-4 py-3">Usuário</th>
                  <th className="px-4 py-3">Cargo</th>
                  <th className="px-4 py-3">Perfil</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Criado em</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {profiles.map((profile) => (
                  <UserRow
                    key={profile.id}
                    profile={profile}
                    currentUserId={user?.id}
                    disabled={deletingUser || updatingUser || resettingData}
                    onEdit={openEditModal}
                    onDelete={openDeleteModal}
                    onReset={openResetModal}
                  />
                ))}
                {profiles.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm font-semibold text-zinc-500"
                    >
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </article>

      {isNewUserOpen && (
        <NewUserModal
          form={newUserForm}
          error={newUserError}
          success={newUserSuccess}
          creating={creatingUser}
          onChange={updateNewUserField}
          onClose={closeNewUserModal}
          onSubmit={handleCreateUser}
        />
      )}

      {editTarget && editForm && (
        <EditUserModal
          form={editForm}
          error={editError}
          updating={updatingUser}
          onChange={updateEditField}
          onClose={closeEditModal}
          onSubmit={handleUpdateUser}
        />
      )}

      {deleteTarget && (
        <DeleteUserModal
          profile={deleteTarget}
          confirmation={deleteConfirmation}
          error={deleteError}
          deleting={deletingUser}
          onConfirmationChange={setDeleteConfirmation}
          onClose={closeDeleteModal}
          onSubmit={handleDeleteUser}
        />
      )}

      {resetTarget && (
        <ResetOperationalDataModal
          profile={resetTarget}
          form={resetForm}
          error={resetError}
          resetting={resettingData}
          onChange={updateResetField}
          onToggleMonth={toggleResetMonth}
          onClose={closeResetModal}
          onSubmit={handleResetOperationalData}
        />
      )}
    </section>
  )
}

function NewUserModal({
  form,
  error,
  success,
  creating,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-2xl rounded-lg border border-white/10 bg-zinc-950/95 p-5 shadow-2xl shadow-black/60 sm:p-6"
      >
        <ModalHeader
          eyebrow="Admin"
          title="Novo usuário"
          description="Crie o acesso sem abrir cadastro público. O usuário receberá um e-mail para criar a senha."
          onClose={onClose}
          closeLabel="Fechar novo usuário"
        />

        <UserFormFields form={form} onChange={onChange} />

        {error && <ErrorMessage>{error}</ErrorMessage>}

        {success && (
          <div className="mt-4 flex gap-2 rounded-md border border-emerald-500/25 bg-emerald-950/20 px-3 py-2 text-sm font-semibold text-emerald-200">
            <ShieldCheck size={17} className="mt-0.5 shrink-0" />
            <span>
              {success}
              <span className="mt-1 block text-xs font-semibold leading-5 text-emerald-100/75">
                O usuário receberá um e-mail para criar sua senha de acesso.
              </span>
            </span>
          </div>
        )}

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <SecondaryButton onClick={onClose}>Cancelar</SecondaryButton>
          <PrimaryButton type="submit" disabled={creating || Boolean(success)}>
            {creating && <Loader2 size={17} className="animate-spin" />}
            Enviar convite
          </PrimaryButton>
        </div>
      </form>
    </div>
  )
}

function EditUserModal({ form, error, updating, onChange, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-2xl rounded-lg border border-white/10 bg-zinc-950/95 p-5 shadow-2xl shadow-black/60 sm:p-6"
      >
        <ModalHeader
          eyebrow="Admin"
          title="Editar usuário"
          description="Atualize dados operacionais do perfil. O login de acesso permanece bloqueado."
          onClose={onClose}
          closeLabel="Fechar edição de usuário"
        />

        <UserFormFields form={form} onChange={onChange} emailReadOnly />

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <SecondaryButton onClick={onClose} disabled={updating}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={updating}>
            {updating && <Loader2 size={17} className="animate-spin" />}
            Salvar alterações
          </PrimaryButton>
        </div>
      </form>
    </div>
  )
}

function UserFormFields({ form, onChange, emailReadOnly = false }) {
  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <FormField label="Nome" name="nome" value={form.nome} onChange={onChange} />
      <div>
        <FormField
          label="E-mail"
          name="email"
          type="email"
          value={form.email}
          onChange={onChange}
          readOnly={emailReadOnly}
        />
        {emailReadOnly && (
          <p className="mt-2 text-xs font-semibold text-zinc-600">
            O login/e-mail não pode ser alterado.
          </p>
        )}
      </div>
      <FormField label="Cargo" name="cargo" value={form.cargo} onChange={onChange} />
      <SelectField label="Perfil" name="perfil" value={form.perfil} onChange={onChange}>
        <option value="operador">operador</option>
        <option value="admin">admin</option>
      </SelectField>
      <SelectField label="Ativo" name="ativo" value={String(form.ativo)} onChange={onChange}>
        <option value="true">sim</option>
        <option value="false">não</option>
      </SelectField>
    </div>
  )
}

function ModalHeader({ eyebrow, title, description, onClose, closeLabel }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-red-300">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-black text-white">{title}</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-zinc-500">
          {description}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 text-zinc-500 transition hover:border-red-500/35 hover:text-white"
        aria-label={closeLabel}
      >
        <X size={17} />
      </button>
    </div>
  )
}

function FormField({ label, name, value, onChange, type = 'text', readOnly = false }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </span>
      <input
        type={type}
        name={name}
        value={value}
        readOnly={readOnly}
        onChange={onChange}
        className="h-11 w-full rounded-md border border-white/10 bg-black/30 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 read-only:cursor-not-allowed read-only:text-zinc-500 focus:border-red-500"
      />
    </label>
  )
}

function SelectField({ label, name, value, onChange, children }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="h-11 w-full rounded-md border border-white/10 bg-black/30 px-3 text-sm font-semibold text-white outline-none transition focus:border-red-500"
      >
        {children}
      </select>
    </label>
  )
}

function UserRow({ profile, currentUserId, disabled, onEdit, onDelete, onReset }) {
  const isCurrentUser = profile.id === currentUserId
  const email = getProfileEmail(profile)

  return (
    <tr className="text-sm text-zinc-300 transition hover:bg-white/[0.025]">
      <td className="px-4 py-4">
        <p className="font-black text-white">{profile.nome || 'Sem nome'}</p>
        <p className="mt-1 max-w-[18rem] truncate text-xs font-semibold text-zinc-500">
          {email}
        </p>
        {isCurrentUser && (
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-red-300">
            VOCÊ
          </p>
        )}
      </td>
      <td className="px-4 py-4 font-semibold text-zinc-400">
        {profile.cargo || 'Não informado'}
      </td>
      <td className="px-4 py-4">
        <Badge tone={profile.perfil === 'admin' ? 'red' : 'zinc'}>
          {formatProfileRole(profile.perfil)}
        </Badge>
      </td>
      <td className="px-4 py-4">
        <Badge tone={profile.ativo ? 'green' : 'zinc'}>
          {profile.ativo ? 'Ativo' : 'Bloqueado'}
        </Badge>
      </td>
      <td className="whitespace-nowrap px-4 py-4 font-semibold text-zinc-500">
        {formatDateTimeBR(profile.created_at)}
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onEdit(profile)}
            disabled={disabled}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 text-xs font-black text-zinc-200 transition hover:border-red-500/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Pencil size={14} />
            Editar
          </button>
          <button
            type="button"
            onClick={() => onReset(profile)}
            disabled={disabled}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-amber-500/25 bg-amber-950/10 px-3 text-xs font-black text-amber-100 transition hover:border-amber-400/45 hover:bg-amber-950/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCcw size={14} />
            Reiniciar dados
          </button>
          {isCurrentUser ? (
            <button
              type="button"
              disabled
              title="Você não pode excluir seu próprio acesso."
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-white/10 px-3 text-xs font-black text-zinc-600 disabled:cursor-not-allowed"
            >
              <Trash2 size={14} />
              Excluir
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onDelete(profile)}
              disabled={disabled}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-red-500/25 bg-red-950/15 px-3 text-xs font-black text-red-200 transition hover:border-red-400/45 hover:bg-red-950/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={14} />
              Excluir
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

function DeleteUserModal({
  profile,
  confirmation,
  error,
  deleting,
  onConfirmationChange,
  onClose,
  onSubmit,
}) {
  const canDelete = isDeleteConfirmationValid(confirmation)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-lg rounded-lg border border-red-500/25 bg-zinc-950/95 p-5 shadow-2xl shadow-black/60 sm:p-6"
      >
        <ModalHeader
          eyebrow="Ação irreversível"
          title="Excluir usuário"
          description="Esta ação é irreversível. O usuário será removido do acesso ao eCaveira Cockpit."
          onClose={onClose}
          closeLabel="Fechar exclusão de usuário"
        />

        <div className="mt-5 rounded-lg border border-white/10 bg-black/25 p-4">
          <InfoRow label="Nome" value={profile.nome || 'Sem nome'} strong />
          <InfoRow label="Login/e-mail" value={getProfileEmail(profile)} />
          <InfoRow label="Cargo" value={profile.cargo || 'Não informado'} />
          <InfoRow label="Perfil" value={formatProfileRole(profile.perfil)} />
        </div>

        <label className="mt-5 block space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
            Para confirmar, digite: Confirmo
          </span>
          <input
            type="text"
            value={confirmation}
            onChange={(event) => onConfirmationChange(event.target.value)}
            className="h-11 w-full rounded-md border border-white/10 bg-black/30 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500"
          />
        </label>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <SecondaryButton onClick={onClose}>Cancelar</SecondaryButton>
          <PrimaryButton type="submit" disabled={!canDelete || deleting}>
            {deleting && <Loader2 size={17} className="animate-spin" />}
            Excluir definitivamente
          </PrimaryButton>
        </div>
      </form>
    </div>
  )
}

function ResetOperationalDataModal({
  profile,
  form,
  error,
  resetting,
  onChange,
  onToggleMonth,
  onClose,
  onSubmit,
}) {
  const canReset = isResetConfirmationValid(form.confirmation) && !getResetValidationError(form)
  const selectedPeriod = getResetPeriodSummary(form)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 px-4 py-6 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="mx-auto w-full max-w-3xl rounded-lg border border-red-500/25 bg-zinc-950/95 p-5 shadow-2xl shadow-black/60 sm:p-6"
      >
        <ModalHeader
          eyebrow="Ação irreversível"
          title="Reiniciar dados operacionais"
          description="Esta ação apagará dados operacionais do usuário selecionado no período informado. Não haverá como recuperar essas informações depois da confirmação."
          onClose={onClose}
          closeLabel="Fechar reinício de dados"
        />

        <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-white/10 bg-black/25 p-4">
            <InfoRow label="Nome" value={profile.nome || 'Sem nome'} strong />
            <InfoRow label="Login/e-mail" value={getProfileEmail(profile)} />
            <InfoRow label="Cargo" value={profile.cargo || 'Não informado'} />
            <InfoRow label="Perfil" value={formatProfileRole(profile.perfil)} />
          </div>

          <div className="space-y-4 rounded-lg border border-white/10 bg-black/25 p-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_0.65fr]">
              <SelectField label="Período" name="mode" value={form.mode} onChange={onChange}>
                <option value="year">Ano inteiro</option>
                <option value="months">Meses específicos</option>
              </SelectField>
              <FormField label="Ano" name="year" type="number" value={form.year} onChange={onChange} />
            </div>

            {form.mode === 'months' && (
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
                  Meses
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {monthOptions.map((month) => {
                    const selected = form.months.includes(month.value)
                    return (
                      <button
                        key={month.value}
                        type="button"
                        onClick={() => onToggleMonth(month.value)}
                        className={`h-9 rounded-md border px-2 text-xs font-black transition ${
                          selected
                            ? 'border-red-500/40 bg-red-600 text-white shadow-lg shadow-red-950/20'
                            : 'border-white/10 bg-black/25 text-zinc-400 hover:border-red-500/30 hover:text-white'
                        }`}
                      >
                        {month.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="rounded-md border border-red-500/20 bg-red-950/15 px-3 py-2 text-sm font-black text-red-100">
              Período selecionado: {selectedPeriod}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <ResetList
            title="Serão apagados"
            tone="red"
            items={[
              'Leads do período',
              'Histórico dos leads do período',
              'Metas mensais do período',
            ]}
          />
          <ResetList
            title="Serão preservados"
            tone="green"
            items={[
              'Usuário',
              'Login/e-mail',
              'Perfil de acesso',
              'Senha',
              'Meta anual',
              'Dados de outros períodos',
            ]}
          />
        </div>

        <label className="mt-5 block space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
            Para confirmar, digite: ESTOU DE ACORDO
          </span>
          <input
            type="text"
            name="confirmation"
            value={form.confirmation}
            onChange={onChange}
            className="h-11 w-full rounded-md border border-white/10 bg-black/30 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500"
          />
        </label>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <SecondaryButton onClick={onClose} disabled={resetting}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={!canReset || resetting}>
            {resetting && <Loader2 size={17} className="animate-spin" />}
            Reiniciar definitivamente
          </PrimaryButton>
        </div>
      </form>
    </div>
  )
}

function ResetList({ title, items, tone }) {
  const toneClass =
    tone === 'green'
      ? 'border-emerald-500/25 bg-emerald-950/10 text-emerald-100'
      : 'border-red-500/25 bg-red-950/15 text-red-100'

  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <p className="text-xs font-black uppercase tracking-[0.14em]">{title}</p>
      <ul className="mt-3 space-y-2 text-sm font-semibold leading-5">
        {items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>
  )
}

function InfoRow({ label, value, strong = false }) {
  return (
    <div className="mt-4 first:mt-0">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-600">
        {label}
      </p>
      <p
        className={`mt-1 break-words text-sm ${
          strong ? 'font-black text-white' : 'font-semibold text-zinc-300'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function Badge({ children, tone = 'zinc' }) {
  const tones = {
    red: 'border-red-500/25 bg-red-950/25 text-red-200',
    green: 'border-emerald-500/25 bg-emerald-950/20 text-emerald-200',
    zinc: 'border-white/10 bg-black/25 text-zinc-300',
  }

  return (
    <span
      className={`inline-flex h-8 items-center rounded-md border px-3 text-xs font-black uppercase tracking-[0.1em] ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

function RestrictedAccess() {
  return (
    <div className="rounded-lg border border-red-500/25 bg-red-950/20 p-5 shadow-xl shadow-black/20">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-red-500/30 bg-red-950/35 text-red-300">
          <ShieldAlert size={22} />
        </span>
        <div>
          <h1 className="text-xl font-black text-white">Acesso restrito</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-red-100/80">
            Acesso restrito ao administrador.
          </p>
        </div>
      </div>
    </div>
  )
}

function ErrorMessage({ children }) {
  return (
    <div className="mt-4 rounded-md border border-red-500/25 bg-red-950/25 px-3 py-2 text-sm font-semibold text-red-200">
      {children}
    </div>
  )
}

function PrimaryButton({ children, type = 'button', disabled = false }) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-600 px-4 text-sm font-black text-white shadow-[0_0_24px_rgba(220,38,38,0.24)] transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none"
    >
      {children}
    </button>
  )
}

function SecondaryButton({ children, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center justify-center rounded-md border border-white/10 px-4 text-sm font-black text-zinc-300 transition hover:border-red-500/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  )
}

function normalizeUserForm(form) {
  return {
    nome: normalizeText(form.nome),
    email: normalizeEmail(form.email),
    cargo: normalizeText(form.cargo),
    perfil: form.perfil,
    ativo: form.ativo !== false,
  }
}

function validateUserForm(form, { requireEmail }) {
  if (!form.nome) {
    return 'Nome é obrigatório.'
  }

  if (requireEmail && !isValidEmail(form.email)) {
    return 'Informe um e-mail válido.'
  }

  if (!['admin', 'operador'].includes(form.perfil)) {
    return 'Perfil é obrigatório.'
  }

  return ''
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function getProfileEmail(profile) {
  return profile.email || 'E-mail não informado'
}

function formatProfileRole(role) {
  const roles = {
    admin: 'Admin',
    operador: 'Operador',
  }

  return roles[role] ?? 'Operador'
}

function getCreateUserMessage(message = '') {
  const normalizedMessage = message.toLowerCase()

  if (
    normalizedMessage.includes('already') ||
    normalizedMessage.includes('registered') ||
    normalizedMessage.includes('cadastrado') ||
    normalizedMessage.includes('exists')
  ) {
    return 'E-mail já cadastrado.'
  }

  if (
    normalizedMessage.includes('admin') ||
    normalizedMessage.includes('403') ||
    normalizedMessage.includes('unauthorized')
  ) {
    return 'Apenas administradores podem criar usuários.'
  }

  return message || 'Erro ao criar usuário.'
}

function isDeleteConfirmationValid(value) {
  return String(value ?? '').trim().toLowerCase() === 'confirmo'
}

function isResetConfirmationValid(value) {
  return String(value ?? '').trim().toLowerCase() === 'estou de acordo'
}

function validateResetForm(form) {
  const periodError = getResetValidationError(form)

  if (periodError) {
    return periodError
  }

  if (!isResetConfirmationValid(form.confirmation)) {
    return 'Digite ESTOU DE ACORDO para confirmar.'
  }

  return ''
}

function getResetValidationError(form) {
  const year = Number(form.year)

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return 'Informe um ano válido.'
  }

  if (!['year', 'months'].includes(form.mode)) {
    return 'Selecione um período válido.'
  }

  if (form.mode === 'months' && form.months.length === 0) {
    return 'Selecione pelo menos um mês.'
  }

  return ''
}

function getResetPeriodSummary(form) {
  const year = Number(form.year) || new Date().getFullYear()

  if (form.mode === 'year') {
    return `Todo o ano de ${year}`
  }

  if (form.months.length === 0) {
    return 'Nenhum mês selecionado'
  }

  return form.months
    .map((month) => `${monthOptions.find((item) => item.value === month)?.label}/${year}`)
    .join(', ')
}

export default Admin
