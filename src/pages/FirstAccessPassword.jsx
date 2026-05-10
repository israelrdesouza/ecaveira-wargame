import { Loader2, LogOut, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import {
  PasswordField,
  PasswordStrength,
  getPasswordCriteria,
  getPasswordStrength,
  validatePassword,
} from '../components/PasswordSecurity'
import logo from '../assets/ecaveira-logo.png'
import { updateFirstAccessPassword } from '../services/authService'

function FirstAccessPassword({ onComplete, onSignOut }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const passwordCriteria = getPasswordCriteria(password, confirmPassword)
  const passwordStrength = getPasswordStrength(password)
  const canSubmitPassword = passwordCriteria.every((criterion) => criterion.valid)

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

    const { error: updateError } = await updateFirstAccessPassword(password)

    if (updateError) {
      setError('Não foi possível atualizar sua senha. Tente novamente.')
      setIsSubmitting(false)
      return
    }

    setMessage('Senha alterada com sucesso.')
    setIsSubmitting(false)

    window.setTimeout(() => {
      onComplete()
    }, 1200)
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
              Primeiro acesso
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
              Defina sua nova senha
            </h1>
            <p className="mt-3 text-sm font-medium leading-6 text-zinc-500">
              Por segurança, altere a senha provisória antes de acessar o Cockpit Comercial.
            </p>
          </div>

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
              Salvar nova senha
            </button>

            <button
              type="button"
              onClick={onSignOut}
              className="mx-auto flex h-9 w-fit items-center gap-2 px-2 text-xs font-bold text-zinc-500 transition hover:text-red-300"
            >
              <LogOut size={14} />
              Sair
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}

export default FirstAccessPassword
