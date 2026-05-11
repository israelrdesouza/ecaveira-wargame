import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useState } from 'react'
import logo from '../assets/ecaveira-logo.png'
import { sendPasswordResetEmail } from '../services/authService'

function Login({ onBack, onSuccess, signIn }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isResetOpen, setIsResetOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetMessage, setResetMessage] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetSubmitting, setResetSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setMessage('')

    const { error: authError } = await signIn(email, password)

    if (authError) {
      setError(authError.message)
      setSubmitting(false)
      return
    }

    setMessage('Acesso liberado.')
    setSubmitting(false)
    onSuccess()
  }

  function openResetModal() {
    setResetEmail(email)
    setResetError('')
    setResetMessage('')
    setIsResetOpen(true)
  }

  function closeResetModal() {
    if (resetSubmitting) {
      return
    }

    setIsResetOpen(false)
    setResetError('')
    setResetMessage('')
  }

  async function handlePasswordReset(event) {
    event.preventDefault()
    setError('')
    setResetError('')
    setResetMessage('')

    const normalizedEmail = resetEmail.trim()

    if (!normalizedEmail) {
      setResetError('Informe seu e-mail para receber o link de recuperação.')
      return
    }

    setResetSubmitting(true)

    const { error: resetAuthError } = await sendPasswordResetEmail(normalizedEmail)

    setResetSubmitting(false)

    if (resetAuthError) {
      setResetError(resetAuthError.message)
      return
    }

    setResetMessage('Se este e-mail estiver cadastrado, enviaremos um link de recuperação.')
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07080a] px-5 text-zinc-100 antialiased">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(220,38,38,0.22),transparent_24rem),radial-gradient(circle_at_20%_90%,rgba(63,63,70,0.20),transparent_24rem),linear-gradient(135deg,#07080a_0%,#111216_48%,#050506_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px] opacity-25" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/80 to-transparent" />
      </div>

      <section className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center py-10">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex w-fit items-center gap-2 rounded-md border border-white/10 bg-zinc-950/45 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-zinc-400 transition hover:border-red-500/30 hover:text-white"
        >
          <ArrowLeft size={15} />
          Voltar
        </button>

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
              Acesso operacional
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
              ÁREA RESTRITA
            </h1>
            <p className="mt-2 text-sm font-medium leading-6 text-zinc-500">
              Identifique-se para acessar o Cockpit Comercial.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
                E-mail
              </span>
              <span className="flex h-11 items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 transition focus-within:border-red-500">
                <Mail size={16} className="shrink-0 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  placeholder="voce@empresa.com"
                  className="w-full min-w-0 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-zinc-600"
                />
              </span>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
                Senha
              </span>
              <span className="flex h-11 items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 transition focus-within:border-red-500">
                <LockKeyhole size={16} className="shrink-0 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  minLength={6}
                  required
                  placeholder="Sua senha"
                  className="w-full min-w-0 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-zinc-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-white/5 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-300/30"
                  aria-label={showPassword ? 'Ocultar senha' : 'Visualizar senha'}
                  title={showPassword ? 'Ocultar senha' : 'Visualizar senha'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </label>

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
              disabled={submitting}
              className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-red-600 px-5 text-sm font-black uppercase tracking-[0.12em] text-white shadow-[0_0_30px_rgba(220,38,38,0.28)] transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting && <Loader2 size={17} className="animate-spin" />}
              Entrar
            </button>

            <button
              type="button"
              onClick={openResetModal}
              className="mx-auto block h-8 w-fit px-2 text-xs font-bold text-zinc-500 transition hover:text-red-300"
            >
              Esqueci minha senha
            </button>
          </form>
        </div>
      </section>

      {isResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <form
            onSubmit={handlePasswordReset}
            className="w-full max-w-md rounded-lg border border-white/10 bg-zinc-950/95 p-5 shadow-2xl shadow-black/60 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-red-300">
                  Recuperação
                </p>
                <h2 className="mt-2 text-2xl font-black text-white">
                  Esqueci minha senha
                </h2>
                <p className="mt-2 text-sm font-medium leading-6 text-zinc-500">
                  Informe seu e-mail para receber o link seguro de recuperação.
                </p>
              </div>
              <button
                type="button"
                onClick={closeResetModal}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 text-zinc-500 transition hover:border-red-500/35 hover:text-white"
                aria-label="Fechar recuperação de senha"
              >
                <X size={17} />
              </button>
            </div>

            <label className="mt-5 block space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
                E-mail
              </span>
              <span className="flex h-11 items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 transition focus-within:border-red-500">
                <Mail size={16} className="shrink-0 text-zinc-500" />
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(event) => setResetEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="voce@empresa.com"
                  className="w-full min-w-0 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-zinc-600"
                />
              </span>
            </label>

            {resetError && (
              <div className="mt-4 rounded-md border border-red-500/25 bg-red-950/25 px-3 py-2 text-sm font-semibold text-red-200">
                {resetError}
              </div>
            )}

            {resetMessage && (
              <div className="mt-4 flex gap-2 rounded-md border border-emerald-500/25 bg-emerald-950/20 px-3 py-2 text-sm font-semibold text-emerald-200">
                <ShieldCheck size={17} className="mt-0.5 shrink-0" />
                <span>{resetMessage}</span>
              </div>
            )}

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeResetModal}
                className="inline-flex h-10 items-center justify-center rounded-md border border-white/10 px-4 text-sm font-black text-zinc-300 transition hover:border-red-500/30 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={resetSubmitting}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-600 px-4 text-sm font-black text-white shadow-[0_0_24px_rgba(220,38,38,0.24)] transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {resetSubmitting && <Loader2 size={17} className="animate-spin" />}
                Enviar link de recuperação
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  )
}

export default Login
