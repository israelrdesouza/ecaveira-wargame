import { ArrowLeft, Loader2, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import logo from '../assets/ecaveira-logo.png'

function Login({ onBack, onSuccess, signIn, signUp }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isSignUp = mode === 'signup'

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setMessage('')

    const action = isSignUp ? signUp : signIn
    const { data, error: authError } = await action(email, password)

    if (authError) {
      setError(authError.message)
      setSubmitting(false)
      return
    }

    if (isSignUp && !data.session) {
      setMessage('Conta criada. Verifique seu e-mail para confirmar o acesso.')
      setSubmitting(false)
      return
    }

    setMessage(isSignUp ? 'Conta criada. Entrando no WarGame...' : 'Acesso liberado.')
    setSubmitting(false)
    onSuccess()
  }

  function toggleMode() {
    setMode((current) => (current === 'login' ? 'signup' : 'login'))
    setError('')
    setMessage('')
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
              {isSignUp ? 'Criar acesso' : 'Acesso operacional'}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
              eCaveira WarGame
            </h1>
            <p className="mt-2 text-sm font-medium leading-6 text-zinc-500">
              Entre para acessar o cockpit comercial.
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
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  minLength={6}
                  required
                  placeholder="Sua senha"
                  className="w-full min-w-0 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-zinc-600"
                />
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
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-red-600 px-5 text-sm font-black uppercase tracking-[0.12em] text-white shadow-[0_0_30px_rgba(220,38,38,0.28)] transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting && <Loader2 size={17} className="animate-spin" />}
              {isSignUp ? 'Criar conta' : 'Entrar'}
            </button>

            <button
              type="button"
              onClick={toggleMode}
              className="h-10 w-full rounded-md border border-white/10 text-sm font-black text-zinc-300 transition hover:border-red-500/30 hover:text-white"
            >
              {isSignUp ? 'Já tenho conta' : 'Criar conta'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}

export default Login
