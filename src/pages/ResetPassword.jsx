import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import logo from '../assets/ecaveira-logo.png'
import {
  exchangeRecoveryCodeForSession,
  getCurrentAuthSession,
  signOutCurrentUser,
  updateCurrentUserPassword,
} from '../services/authService'

function ResetPassword({ onBackToLogin }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [hasRecoverySession, setHasRecoverySession] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const passwordCriteria = getPasswordCriteria(password, confirmPassword)
  const passwordStrength = getPasswordStrength(password)
  const canSubmitPassword = passwordCriteria.every((criterion) => criterion.valid)

  useEffect(() => {
    let isMounted = true

    async function checkRecoverySession() {
      const searchParams = new URLSearchParams(window.location.search)
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const recoveryCode = searchParams.get('code')
      const urlError = searchParams.get('error') || searchParams.get('error_code')
      const hasRecoveryHint =
        Boolean(recoveryCode) ||
        hashParams.get('type') === 'recovery' ||
        hashParams.has('access_token') ||
        window.sessionStorage.getItem('ecaveira_password_recovery') === 'true'

      if (urlError) {
        if (isMounted) {
          setHasRecoverySession(false)
          setIsCheckingSession(false)
        }

        return
      }

      if (recoveryCode) {
        const { error: exchangeError } = await exchangeRecoveryCodeForSession(recoveryCode)

        if (exchangeError) {
          if (isMounted) {
            setHasRecoverySession(false)
            setIsCheckingSession(false)
          }

          return
        }
      }

      const { data, error: sessionError } = await getCurrentAuthSession()

      if (!isMounted) {
        return
      }

      setHasRecoverySession(Boolean(data?.session) && !sessionError && hasRecoveryHint)
      setIsCheckingSession(false)
    }

    checkRecoverySession()

    return () => {
      isMounted = false
    }
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    const validationError = validatePassword(password, confirmPassword)

    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)

    const { error: updateError } = await updateCurrentUserPassword(password)

    if (updateError) {
      setError(updateError.message || 'Não foi possível atualizar a senha.')
      setIsSubmitting(false)
      return
    }

    setMessage('Senha atualizada com sucesso. Faça login novamente.')
    setIsSubmitting(false)

    window.setTimeout(() => {
      goBackToLogin()
    }, 2200)
  }

  async function goBackToLogin() {
    window.sessionStorage.removeItem('ecaveira_password_recovery')
    await signOutCurrentUser()
    window.history.replaceState(null, '', '/')
    onBackToLogin()
  }

  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-[#07080a] px-5 text-zinc-100 antialiased">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(220,38,38,0.22),transparent_24rem),radial-gradient(circle_at_20%_90%,rgba(63,63,70,0.20),transparent_24rem),linear-gradient(135deg,#07080a_0%,#111216_48%,#050506_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px] opacity-25" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/80 to-transparent" />
      </div>

      <section className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center py-8 sm:py-10">
        <div className="rounded-lg border border-white/10 bg-zinc-950/70 p-5 shadow-2xl shadow-black/35 backdrop-blur-xl sm:p-6">
          <div className="flex flex-col items-center text-center">
            <div className="group relative flex items-center justify-center">
              <div className="absolute h-32 w-32 rounded-full bg-red-600/20 blur-3xl motion-safe:animate-pulse" />
              <img
                src={logo}
                alt="eCaveira WarGame"
                className="relative w-28 object-contain drop-shadow-[0_0_22px_rgba(248,113,113,0.50)] transition duration-500 ease-out group-hover:scale-105 sm:w-32"
              />
            </div>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.28em] text-red-300">
              Recuperação segura
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
              Criar nova senha
            </h1>
          </div>

          {isCheckingSession && (
            <div className="mt-6 flex items-center justify-center gap-2 rounded-md border border-white/10 bg-black/25 p-4 text-sm font-semibold text-zinc-400">
              <Loader2 size={17} className="animate-spin text-red-300" />
              Validando link de recuperação...
            </div>
          )}

          {!isCheckingSession && !hasRecoverySession && (
            <div className="mt-6 space-y-4">
              <div className="rounded-md border border-red-500/25 bg-red-950/25 px-3 py-3 text-sm font-semibold leading-6 text-red-200">
                Link inválido ou expirado. Solicite uma nova recuperação de senha.
              </div>
              <button
                type="button"
                onClick={goBackToLogin}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-white/10 px-5 text-sm font-black text-zinc-200 transition hover:border-red-500/35 hover:text-white"
              >
                <ArrowLeft size={17} />
                Voltar ao login
              </button>
            </div>
          )}

          {!isCheckingSession && hasRecoverySession && (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <PasswordField
                label="Nova senha"
                value={password}
                onChange={setPassword}
                showValue={showPassword}
                onToggleShow={() => setShowPassword((current) => !current)}
                placeholder="Mínimo 8 caracteres"
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

              <PasswordStrength criteria={passwordCriteria} strength={passwordStrength} />

              {error && (
                <div className="rounded-md border border-red-500/25 bg-red-950/25 px-3 py-2 text-sm font-semibold text-red-200">
                  {error}
                </div>
              )}

              {message && (
                <div className="flex gap-2 rounded-md border border-emerald-500/25 bg-emerald-950/20 px-3 py-2 text-sm font-semibold text-emerald-200">
                  <ShieldCheck size={17} className="mt-0.5 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || Boolean(message) || !canSubmitPassword}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-red-600 px-5 text-sm font-black uppercase tracking-[0.12em] text-white shadow-[0_0_30px_rgba(220,38,38,0.28)] transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none"
              >
                {isSubmitting && <Loader2 size={17} className="animate-spin" />}
                Atualizar senha
              </button>

              <button
                type="button"
                onClick={goBackToLogin}
                className="mx-auto block h-8 w-fit px-2 text-xs font-bold text-zinc-500 transition hover:text-red-300"
              >
                Voltar ao login
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}

function PasswordField({
  label,
  value,
  onChange,
  showValue,
  onToggleShow,
  placeholder,
  toggleLabel,
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </span>
      <span className="flex h-11 items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 transition focus-within:border-red-500">
        <LockKeyhole size={16} className="shrink-0 text-zinc-500" />
        <input
          type={showValue ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="new-password"
          placeholder={placeholder}
          className="w-full min-w-0 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-zinc-600"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-white/5 hover:text-red-300"
          aria-label={toggleLabel}
        >
          {showValue ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </span>
    </label>
  )
}

function PasswordStrength({ criteria, strength }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
          Força da senha
        </p>
        <p className={`text-xs font-black uppercase ${strength.text}`}>
          {strength.label}
        </p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-900 ring-1 ring-white/10">
        <div
          className={`h-full rounded-full transition-all ${strength.color}`}
          style={{ width: strength.width }}
        />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {criteria.map((criterion) => (
          <div
            key={criterion.id}
            className={`flex items-center gap-2 text-xs font-semibold ${
              criterion.valid ? 'text-emerald-300' : 'text-zinc-600'
            }`}
          >
            <CheckCircle2
              size={14}
              className={criterion.valid ? 'text-emerald-400' : 'text-zinc-700'}
            />
            <span>{criterion.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function validatePassword(password, confirmPassword) {
  const failedCriterion = getPasswordCriteria(password, confirmPassword).find(
    (criterion) => !criterion.valid,
  )

  return failedCriterion?.error ?? ''
}

function getPasswordCriteria(password, confirmPassword) {
  return [
    {
      id: 'length',
      label: 'Mínimo de 8 caracteres',
      valid: password.length >= 8,
      error: 'A nova senha deve ter no mínimo 8 caracteres.',
    },
    {
      id: 'uppercase',
      label: 'Uma letra maiúscula',
      valid: /[A-ZÀ-Ý]/.test(password),
      error: 'A nova senha deve conter pelo menos uma letra maiúscula.',
    },
    {
      id: 'lowercase',
      label: 'Uma letra minúscula',
      valid: /[a-zà-ÿ]/.test(password),
      error: 'A nova senha deve conter pelo menos uma letra minúscula.',
    },
    {
      id: 'number',
      label: 'Um número',
      valid: /\d/.test(password),
      error: 'A nova senha deve conter pelo menos um número.',
    },
    {
      id: 'special',
      label: 'Um caractere especial',
      valid: /[^A-Za-zÀ-ÿ0-9]/.test(password),
      error: 'A nova senha deve conter pelo menos um caractere especial.',
    },
    {
      id: 'match',
      label: 'As senhas conferem',
      valid: Boolean(password) && password === confirmPassword,
      error: 'A nova senha e a confirmação precisam ser iguais.',
    },
  ]
}

function getPasswordStrength(password) {
  const mainScore = [
    password.length >= 8,
    /[A-ZÀ-Ý]/.test(password),
    /[a-zà-ÿ]/.test(password),
    /\d/.test(password),
    /[^A-Za-zÀ-ÿ0-9]/.test(password),
  ].filter(Boolean).length

  if (mainScore === 5 && password.length >= 12) {
    return {
      label: 'Excelente',
      width: '100%',
      color: 'bg-emerald-400',
      text: 'text-emerald-300',
    }
  }

  if (mainScore === 5) {
    return {
      label: 'Forte',
      width: '75%',
      color: 'bg-emerald-500',
      text: 'text-emerald-300',
    }
  }

  if (mainScore >= 3) {
    return {
      label: 'Média',
      width: '50%',
      color: 'bg-amber-500',
      text: 'text-amber-300',
    }
  }

  return {
    label: 'Fraca',
    width: '25%',
    color: 'bg-red-600',
    text: 'text-red-300',
  }
}

export default ResetPassword
