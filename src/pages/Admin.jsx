import {
  Copy,
  Loader2,
  Plus,
  ShieldAlert,
  ShieldCheck,
  UsersRound,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { createUser } from '../services/adminService'
import { getProfiles, updateProfileAccess } from '../services/profileService'
import { useAuth } from '../hooks/useAuth'
import { formatDateTimeBR } from '../utils/formatters'

const initialNewUserForm = {
  nome: '',
  email: '',
  cargo: '',
  perfil: 'operador',
  ativo: true,
}

function Admin() {
  const { user, isAdmin } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isNewUserOpen, setIsNewUserOpen] = useState(false)
  const [newUserForm, setNewUserForm] = useState(initialNewUserForm)
  const [newUserError, setNewUserError] = useState('')
  const [newUserSuccess, setNewUserSuccess] = useState('')
  const [temporaryPassword, setTemporaryPassword] = useState('')
  const [creatingUser, setCreatingUser] = useState(false)

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
        const data = await getProfiles()

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
    const data = await getProfiles()
    setProfiles(data)
  }

  async function handleProfileChange(profile, updates) {
    if (!isAdmin || savingId) {
      return
    }

    setError('')
    setSuccess('')

    if (profile.id === user?.id && updates.ativo === false) {
      setError('Você não pode bloquear seu próprio acesso.')
      return
    }

    setSavingId(profile.id)

    try {
      const updatedProfile = await updateProfileAccess(
        profile.id,
        {
          perfil: updates.perfil ?? profile.perfil,
          ativo: updates.ativo ?? profile.ativo,
        },
        user?.id,
      )

      setProfiles((current) =>
        current.map((item) => (item.id === updatedProfile.id ? updatedProfile : item)),
      )
      setSuccess('Usuário atualizado com sucesso.')
    } catch (updateError) {
      setError(updateError.message || 'Não foi possível atualizar o usuário.')
    } finally {
      setSavingId('')
    }
  }

  function openNewUserModal() {
    setNewUserForm(initialNewUserForm)
    setNewUserError('')
    setNewUserSuccess('')
    setTemporaryPassword('')
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
    setTemporaryPassword('')
  }

  function updateNewUserField(event) {
    const { name, value } = event.target
    setNewUserForm((current) => ({
      ...current,
      [name]: name === 'ativo' ? value === 'true' : value,
    }))
    setNewUserError('')
  }

  async function handleCreateUser(event) {
    event.preventDefault()
    setNewUserError('')
    setNewUserSuccess('')
    setTemporaryPassword('')

    const validationError = validateNewUserForm(newUserForm)

    if (validationError) {
      setNewUserError(validationError)
      return
    }

    setCreatingUser(true)

    try {
      const result = await createUser({
        nome: newUserForm.nome.trim(),
        email: newUserForm.email.trim().toLowerCase(),
        cargo: newUserForm.cargo.trim(),
        perfil: newUserForm.perfil,
        ativo: newUserForm.ativo,
      })

      setNewUserSuccess('Usuário criado com sucesso.')
      setTemporaryPassword(result.temporaryPassword || '')
      await refreshProfiles()
    } catch (createError) {
      setNewUserError(getCreateUserMessage(createError.message))
    } finally {
      setCreatingUser(false)
    }
  }

  async function copyTemporaryPassword() {
    if (!temporaryPassword) {
      return
    }

    await navigator.clipboard.writeText(temporaryPassword)
    setNewUserSuccess('Senha provisória copiada. Entregue ao usuário por canal seguro.')
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
            <table className="min-w-[820px] w-full text-left">
              <thead className="border-b border-white/10 bg-black/20">
                <tr className="text-xs font-black uppercase tracking-[0.14em] text-zinc-600">
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Cargo</th>
                  <th className="px-4 py-3">Perfil</th>
                  <th className="px-4 py-3">Ativo</th>
                  <th className="px-4 py-3">Criado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {profiles.map((profile) => (
                  <UserRow
                    key={profile.id}
                    profile={profile}
                    currentUserId={user?.id}
                    saving={savingId === profile.id}
                    disabled={Boolean(savingId)}
                    onChange={handleProfileChange}
                  />
                ))}
                {profiles.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
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
          temporaryPassword={temporaryPassword}
          creating={creatingUser}
          onChange={updateNewUserField}
          onClose={closeNewUserModal}
          onSubmit={handleCreateUser}
          onCopyPassword={copyTemporaryPassword}
        />
      )}
    </section>
  )
}

function NewUserModal({
  form,
  error,
  success,
  temporaryPassword,
  creating,
  onChange,
  onClose,
  onSubmit,
  onCopyPassword,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-2xl rounded-lg border border-white/10 bg-zinc-950/95 p-5 shadow-2xl shadow-black/60 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-red-300">
              Admin
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">Novo usuário</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-zinc-500">
              Crie o acesso sem abrir cadastro público. A senha provisória será gerada no servidor.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 text-zinc-500 transition hover:border-red-500/35 hover:text-white"
            aria-label="Fechar novo usuário"
          >
            <X size={17} />
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <FormField label="Nome" name="nome" value={form.nome} onChange={onChange} />
          <FormField
            label="E-mail"
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
          />
          <FormField label="Cargo" name="cargo" value={form.cargo} onChange={onChange} />
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
              Perfil
            </span>
            <select
              name="perfil"
              value={form.perfil}
              onChange={onChange}
              className="h-11 w-full rounded-md border border-white/10 bg-black/30 px-3 text-sm font-semibold text-white outline-none transition focus:border-red-500"
            >
              <option value="operador">operador</option>
              <option value="admin">admin</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
              Ativo
            </span>
            <select
              name="ativo"
              value={String(form.ativo)}
              onChange={onChange}
              className="h-11 w-full rounded-md border border-white/10 bg-black/30 px-3 text-sm font-semibold text-white outline-none transition focus:border-red-500"
            >
              <option value="true">sim</option>
              <option value="false">não</option>
            </select>
          </label>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-red-500/25 bg-red-950/25 px-3 py-2 text-sm font-semibold text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 flex gap-2 rounded-md border border-emerald-500/25 bg-emerald-950/20 px-3 py-2 text-sm font-semibold text-emerald-200">
            <ShieldCheck size={17} className="mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {temporaryPassword && (
          <div className="mt-4 rounded-lg border border-amber-500/25 bg-amber-950/15 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-300">
              Senha provisória
            </p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
              <code className="min-w-0 flex-1 break-all rounded-md border border-white/10 bg-black/35 px-3 py-2 text-sm font-black text-white">
                {temporaryPassword}
              </code>
              <button
                type="button"
                onClick={onCopyPassword}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-amber-500/25 px-3 text-sm font-black text-amber-100 transition hover:border-amber-400/45 hover:text-white"
              >
                <Copy size={16} />
                Copiar
              </button>
            </div>
            <p className="mt-2 text-xs font-semibold leading-5 text-amber-100/70">
              Entregue esta senha por canal seguro e oriente o usuário a alterá-la no primeiro acesso.
            </p>
          </div>
        )}

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-md border border-white/10 px-4 text-sm font-black text-zinc-300 transition hover:border-red-500/30 hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={creating || Boolean(temporaryPassword)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-600 px-4 text-sm font-black text-white shadow-[0_0_24px_rgba(220,38,38,0.24)] transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {creating && <Loader2 size={17} className="animate-spin" />}
            Criar usuário
          </button>
        </div>
      </form>
    </div>
  )
}

function FormField({ label, name, value, onChange, type = 'text' }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="h-11 w-full rounded-md border border-white/10 bg-black/30 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500"
      />
    </label>
  )
}

function UserRow({ profile, currentUserId, saving, disabled, onChange }) {
  const isCurrentUser = profile.id === currentUserId

  return (
    <tr className="text-sm text-zinc-300 transition hover:bg-white/[0.025]">
      <td className="px-4 py-4">
        <p className="font-black text-white">{profile.nome || 'Sem nome'}</p>
        {isCurrentUser && (
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-red-300">
            Você
          </p>
        )}
      </td>
      <td className="px-4 py-4 font-semibold text-zinc-400">
        {profile.cargo || 'Não informado'}
      </td>
      <td className="px-4 py-4">
        <select
          value={profile.perfil || 'operador'}
          disabled={disabled}
          onChange={(event) => onChange(profile, { perfil: event.target.value })}
          className="h-10 rounded-md border border-white/10 bg-black/30 px-3 text-sm font-black text-white outline-none transition focus:border-red-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="admin">admin</option>
          <option value="operador">operador</option>
        </select>
      </td>
      <td className="px-4 py-4">
        <select
          value={String(Boolean(profile.ativo))}
          disabled={disabled || (isCurrentUser && profile.ativo)}
          onChange={(event) =>
            onChange(profile, { ativo: event.target.value === 'true' })
          }
          className="h-10 rounded-md border border-white/10 bg-black/30 px-3 text-sm font-black text-white outline-none transition focus:border-red-500 disabled:cursor-not-allowed disabled:opacity-60"
          title={isCurrentUser ? 'Você não pode bloquear seu próprio acesso.' : undefined}
        >
          <option value="true">ativo</option>
          <option value="false">bloqueado</option>
        </select>
        {saving && (
          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-zinc-500">
            <Loader2 size={12} className="animate-spin" />
            Salvando
          </p>
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-4 font-semibold text-zinc-500">
        {formatDateTimeBR(profile.created_at)}
      </td>
    </tr>
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

function validateNewUserForm(form) {
  if (!form.nome.trim()) {
    return 'Nome é obrigatório.'
  }

  if (!isValidEmail(form.email)) {
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

export default Admin
